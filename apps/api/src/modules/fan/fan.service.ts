import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { stubFanScoresFromParticipation } from '@tsc/database';
import type {
  ArtistFansPayload,
  FanFollowArtistPayload,
  FanGraphPayload,
  FanProfilePatchInput,
  FanProfilePublic,
  FanProfileRecord,
  FanScoresPayload,
  FanSupportArtistPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { ActivityService } from '../activity/activity.service';
import { FanRepository } from './fan.repository';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';

function toFanProfileRecord(row: {
  personId: string;
  favoriteGenres: string[];
  favoriteArtists: string[];
  cities: string[];
  engagementScore: number;
  spendScore: number;
  attendanceScore: number;
  influenceScore: number;
  createdAt: Date;
  updatedAt: Date;
}): FanProfileRecord {
  return {
    personId: row.personId,
    favoriteGenres: row.favoriteGenres,
    favoriteArtists: row.favoriteArtists,
    cities: row.cities,
    engagementScore: row.engagementScore,
    spendScore: row.spendScore,
    attendanceScore: row.attendanceScore,
    influenceScore: row.influenceScore,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toFanProfilePublic(row: FanProfileRecord): FanProfilePublic {
  return {
    personId: row.personId,
    favoriteGenres: row.favoriteGenres,
    favoriteArtists: row.favoriteArtists,
    cities: row.cities,
    engagementScore: row.engagementScore > 0 ? row.engagementScore : null,
    attendanceScore: row.attendanceScore > 0 ? row.attendanceScore : null,
    updatedAt: row.updatedAt,
  };
}

@Injectable()
export class FanService {
  constructor(
    private readonly repository: FanRepository,
    private readonly activityService: ActivityService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
  ) {}

  async ensureFanProfileStub(personId: string): Promise<FanProfileRecord | null> {
    const existing = await this.repository.findFanProfile(personId);
    if (existing) return toFanProfileRecord(existing);

    const row = await this.repository.createFanProfileStub(personId);
    if (!row) return null;

    const profileSlug = await this.repository.findProfileSlug(personId);
    if (profileSlug) {
      void this.tscIdentityProvision.ensureFanIdentity(personId, profileSlug);
    }

    void this.refreshScores(personId);
    return toFanProfileRecord(row);
  }

  async getMyProfile(ctx: MembershipContext): Promise<FanProfileRecord> {
    const personId = this.resolvePersonId(ctx);
    await this.ensureFanProfileStub(personId);
    const row = await this.repository.findFanProfile(personId);
    if (!row) {
      throw new ServiceUnavailableException(
        'FanProfile model unavailable — apply phase8-step1.prisma migration',
      );
    }
    return toFanProfileRecord(row);
  }

  async getPublicProfile(personId: string): Promise<FanProfilePublic> {
    const row = await this.repository.findFanProfile(personId);
    if (!row) {
      const stub = await this.ensureFanProfileStub(personId);
      if (!stub) {
        throw new NotFoundException(`Fan profile for ${personId} not found`);
      }
      return toFanProfilePublic(stub);
    }
    return toFanProfilePublic(toFanProfileRecord(row));
  }

  async patchMyProfile(
    input: FanProfilePatchInput,
    ctx: MembershipContext,
  ): Promise<FanProfileRecord> {
    const personId = this.resolvePersonId(ctx);
    await this.ensureFanProfileStub(personId);

    const row = await this.repository.upsertFanProfile(personId, input);
    if (!row) {
      throw new ServiceUnavailableException('FanProfile model unavailable');
    }
    return toFanProfileRecord(row);
  }

  async getScores(personId: string): Promise<FanScoresPayload> {
    await this.ensureFanProfileStub(personId);
    return this.refreshScores(personId);
  }

  async refreshScores(personId: string): Promise<FanScoresPayload> {
    const snapshot = await this.repository.findLatestFanSnapshot(personId);
    if (snapshot) {
      const scores = {
        engagementScore: snapshot.engagementScore,
        spendScore: snapshot.purchaseScore,
        attendanceScore: snapshot.attendanceScore,
        influenceScore: snapshot.influenceScore,
      };
      await this.repository.updateFanProfileScores(personId, scores);
      return {
        personId,
        ...scores,
        source: 'snapshot',
        snapshotDate: snapshot.snapshotDate.toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    const profile = await this.repository.findFanProfile(personId);
    if (
      profile &&
      (profile.engagementScore > 0 ||
        profile.spendScore > 0 ||
        profile.attendanceScore > 0 ||
        profile.influenceScore > 0)
    ) {
      return {
        personId,
        engagementScore: profile.engagementScore,
        spendScore: profile.spendScore,
        attendanceScore: profile.attendanceScore,
        influenceScore: profile.influenceScore,
        source: 'profile',
        snapshotDate: null,
        updatedAt: profile.updatedAt.toISOString(),
      };
    }

    const [participation, communityCount, artistFollowCount] = await Promise.all([
      this.repository.countEventParticipation(personId),
      this.repository.countActiveCommunities(personId),
      this.repository.countArtistFollows(personId),
    ]);

    const stub = stubFanScoresFromParticipation({
      registeredCount: participation.registeredCount,
      checkedInCount: participation.checkedInCount,
      communityCount,
      artistFollowCount,
    });

    await this.repository.updateFanProfileScores(personId, stub);

    return {
      personId,
      ...stub,
      source: 'stub',
      snapshotDate: null,
      updatedAt: new Date().toISOString(),
    };
  }

  async followArtist(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<FanFollowArtistPayload> {
    const personId = this.resolvePersonId(ctx);
    const artist = await this.repository.findArtist(artistId);
    if (!artist) {
      throw new NotFoundException(`Artist ${artistId} not found`);
    }

    await this.ensureFanProfileStub(personId);

    const existingFollow = await this.repository.findExistingArtistFollow(
      personId,
      artistId,
    );
    const relationship = await this.repository.upsertFollowsArtistRelationship(
      personId,
      artistId,
    );

    let artistFollowId: string | null = existingFollow?.id ?? null;
    const created = !existingFollow;

    if (!existingFollow) {
      const followRow = await this.repository.createArtistFollow(personId, artistId);
      artistFollowId = followRow?.id ?? null;
    }

    if (created) {
      await this.activityService.recordInternal({
        actorPersonId: personId,
        action: 'followed_artist',
        targetType: 'Artist',
        targetId: artistId,
        metadata: {
          artistName: artist.displayName ?? artist.name,
          artistSlug: artist.slug,
        },
        visibility: 'public',
      });
    }

    void this.refreshScores(personId);

    return {
      artistId,
      personId,
      relationshipId: relationship.id,
      artistFollowId,
      created,
      updatedAt: new Date().toISOString(),
    };
  }

  async supportArtist(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<FanSupportArtistPayload> {
    const personId = this.resolvePersonId(ctx);
    const artist = await this.repository.findArtist(artistId);
    if (!artist) {
      throw new NotFoundException(`Artist ${artistId} not found`);
    }

    await this.ensureFanProfileStub(personId);

    const existing = await this.repository.listFanGraphRelationships(personId, false);
    const hadSupport = existing.some(
      (row) =>
        row.relationshipType === 'SUPPORTED' &&
        row.targetEntityType === 'Artist' &&
        row.targetEntityId === artistId,
    );

    const relationship = await this.repository.upsertSupportedArtistRelationship(
      personId,
      artistId,
    );

    if (!hadSupport) {
      await this.activityService.recordInternal({
        actorPersonId: personId,
        action: 'supported_artist',
        targetType: 'Artist',
        targetId: artistId,
        metadata: {
          artistName: artist.displayName ?? artist.name,
          artistSlug: artist.slug,
          stub: true,
        },
        visibility: 'public',
      });
    }

    return {
      artistId,
      personId,
      relationshipId: relationship.id,
      created: !hadSupport,
      updatedAt: new Date().toISOString(),
    };
  }

  async getFanGraph(
    personId: string,
    ctx: MembershipContext,
    includeInactive = false,
  ): Promise<FanGraphPayload> {
    if (!this.canViewGraph(ctx, personId)) {
      throw new ForbiddenException('Cannot view fan graph for this person');
    }

    const subgraph = await this.repository.buildFanSubgraph(personId, includeInactive);
    const refs = subgraph.edges.flatMap((edge) => {
      const peer =
        edge.direction === 'outbound'
          ? { entityType: edge.targetEntityType, entityId: edge.targetEntityId }
          : { entityType: edge.sourceEntityType, entityId: edge.sourceEntityId };
      return [peer];
    });
    const titles = await this.repository.resolveEntityTitles(refs);

    const fanEdges = {
      follows: [] as FanGraphPayload['fanEdges']['follows'],
      attended: [] as FanGraphPayload['fanEdges']['attended'],
      communities: [] as FanGraphPayload['fanEdges']['communities'],
      supported: [] as FanGraphPayload['fanEdges']['supported'],
    };

    for (const edge of subgraph.edges) {
      if (edge.direction !== 'outbound') continue;
      const title =
        titles.get(`${edge.targetEntityType}:${edge.targetEntityId}`) ?? null;

      switch (edge.relationshipType) {
        case 'FOLLOWS':
          if (edge.targetEntityType === 'Artist') {
            fanEdges.follows.push({ artistId: edge.targetEntityId, title });
          }
          break;
        case 'ATTENDED':
          if (edge.targetEntityType === 'Event') {
            fanEdges.attended.push({ eventId: edge.targetEntityId, title });
          }
          break;
        case 'MEMBER_OF':
          if (edge.targetEntityType === 'Community') {
            fanEdges.communities.push({ communityId: edge.targetEntityId, title });
          }
          break;
        case 'SUPPORTED':
          if (edge.targetEntityType === 'Artist') {
            fanEdges.supported.push({ artistId: edge.targetEntityId, title });
          }
          break;
        default:
          break;
      }
    }

    return {
      ...subgraph,
      personId,
      fanEdges,
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtistTopFans(artistId: string, limit: number): Promise<ArtistFansPayload> {
    const artist = await this.repository.findArtist(artistId);
    if (!artist) {
      throw new NotFoundException(`Artist ${artistId} not found`);
    }

    const follows = await this.repository.listTopFansByArtist(artistId, limit);
    const personIds = follows.map((row) => row.personId);
    const profiles = await this.repository.listFanProfilesByPersonIds(personIds);
    const profileMap = new Map(profiles.map((row) => [row.personId, row]));

    const fans = follows
      .map((row) => {
        const profile = profileMap.get(row.personId);
        const displayName =
          row.person.displayName?.trim() ||
          row.person.name?.trim() ||
          row.personId;
        return {
          personId: row.personId,
          displayName,
          slug: row.person.profile?.slug ?? null,
          engagementScore: profile?.engagementScore ?? 0,
          attendanceScore: profile?.attendanceScore ?? 0,
          followedAt: row.followedAt.toISOString(),
        };
      })
      .sort((a, b) => b.engagementScore - a.engagementScore)
      .slice(0, limit);

    return {
      artistId,
      fans,
      total: fans.length,
      updatedAt: new Date().toISOString(),
    };
  }

  private canViewGraph(ctx: MembershipContext, personId: string): boolean {
    if (ctx.roles.includes('admin')) return true;
    const viewerId = ctx.personId ?? ctx.userId;
    return viewerId === personId;
  }

  private resolvePersonId(ctx: MembershipContext): string {
    const personId = ctx.personId ?? ctx.userId;
    if (!personId) {
      throw new ForbiddenException('Authenticated person required');
    }
    return personId;
  }
}
