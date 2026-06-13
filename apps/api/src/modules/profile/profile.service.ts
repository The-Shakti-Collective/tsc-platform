import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import type {
  CommunityVerificationRequestPayload,
  EcosystemPassportPayload,
  EcosystemPassportSectionItem,
  FollowStatusPayload,
  PersonFollowListPayload,
  PersonFollowPayload,
  PersonProfileRecord,
  PersonUnfollowPayload,
  PublicPassportPayload,
  UsernameCheckPayload,
  VerificationPayload,
} from '@tsc/types';
import { PassportService } from '../passport/passport.service';
import { ActivityService } from '../activity/activity.service';
import { TscIdentityProvisionService } from '../tsc-identity/tsc-identity-provision.service';
import { WorkspaceProvisionService } from '../workspace/workspace-provision.service';
import { CreativeIdentityService } from '../creative-identity/creative-identity.service';
import type {
  AdminVerificationPatchInput,
  CommunityVerificationRequestInput,
  ProfileEditInput,
  UsernameCheckInput,
} from './dto';
import { ProfileRepository, type PersonFollowRow } from './profile.repository';
import {
  buildProfileShareUrl,
  parseProfileLinks,
  toProfileRecord,
  VerificationService,
} from './verification.service';

@Injectable()
export class ProfileService {
  constructor(
    private readonly repository: ProfileRepository,
    private readonly verificationService: VerificationService,
    private readonly passportService: PassportService,
    private readonly activityService: ActivityService,
    private readonly tscIdentityProvision: TscIdentityProvisionService,
    private readonly workspaceProvision: WorkspaceProvisionService,
    private readonly creativeIdentityService: CreativeIdentityService,
  ) {}

  async ensureProfileStub(input: {
    personId: string;
    slug?: string | null;
    username?: string | null;
    displayName?: string | null;
  }) {
    const profile = await this.repository.createStub(input);
    if (profile) {
      void this.tscIdentityProvision.ensureFanIdentity(profile.personId, profile.slug);
      void this.workspaceProvision.ensurePersonalWorkspace(profile.personId, {
        displayName: input.displayName,
        profileSlug: profile.slug,
      });
    }
    return profile;
  }

  async getPublicProfileBySlug(slug: string): Promise<PersonProfileRecord> {
    let profile = await this.repository.findBySlug(slug);
    if (!profile) {
      const artist = await this.repository.findArtistBySlug(slug);
      if (artist?.personId) {
        profile = await this.repository.createStub({
          personId: artist.personId,
          slug: artist.slug,
          displayName: artist.displayName ?? artist.name,
        });
      }
    }

    if (!profile) {
      throw new NotFoundException(`Profile ${slug} not found`);
    }

    const roles = await this.repository.listActiveRoles(profile.personId);
    await this.verificationService.computeVerificationLevel(profile.personId);

    const refreshed = (await this.repository.findBySlug(slug)) ?? profile;
    const record = toProfileRecord(refreshed, roles);
    record.creativeIdentity = await this.creativeIdentityService.getMergeSummaryBySlug(slug);
    return record;
  }

  async getMyProfile(ctx: MembershipContext): Promise<PersonProfileRecord> {
    const personId = await this.resolvePersonId(ctx);
    let profile = await this.repository.findByPersonId(personId);

    if (!profile) {
      profile = await this.repository.createStub({ personId });
    }
    if (!profile) {
      throw new NotFoundException('PersonProfile model unavailable');
    }

    void this.workspaceProvision.ensurePersonalWorkspace(personId, {
      profileSlug: profile.slug,
    });

    const roles = await this.repository.listActiveRoles(personId);
    await this.verificationService.computeVerificationLevel(personId);
    const refreshed = (await this.repository.findByPersonId(personId)) ?? profile;
    return toProfileRecord(refreshed, roles);
  }

  async updateMyProfile(
    input: ProfileEditInput,
    ctx: MembershipContext,
  ): Promise<PersonProfileRecord> {
    const personId = await this.resolvePersonId(ctx);
    let profile = await this.repository.findByPersonId(personId);

    if (!profile) {
      profile = await this.repository.createStub({ personId });
    }
    if (!profile) {
      throw new NotFoundException('PersonProfile model unavailable');
    }

    if (input.username) {
      const available = await this.repository.isUsernameAvailable(
        input.username,
        personId,
      );
      if (!available) {
        throw new BadRequestException(`Username ${input.username} is taken`);
      }
    }

    const updated = await this.repository.updateProfile(personId, input);
    const roles = await this.repository.listActiveRoles(personId);

    await this.activityService.record({
      actorPersonId: personId,
      action: 'updated_profile',
      targetType: 'Person',
      targetId: personId,
      metadata: {
        fields: Object.keys(input).filter(
          (key) => input[key as keyof ProfileEditInput] !== undefined,
        ),
      },
    });

    return toProfileRecord(updated, roles);
  }

  async checkUsername(input: UsernameCheckInput): Promise<UsernameCheckPayload> {
    const available = await this.repository.isUsernameAvailable(input.username);
    const payload: UsernameCheckPayload = {
      username: input.username,
      available,
    };

    if (!available) {
      payload.suggestion = `${input.username}${Math.floor(Math.random() * 90 + 10)}`;
    }

    return payload;
  }

  async getVerification(personId: string): Promise<VerificationPayload> {
    await this.repository.createStub({ personId });
    return this.verificationService.getVerification(personId);
  }

  async requestCommunityVerification(
    input: CommunityVerificationRequestInput,
    ctx: MembershipContext,
  ): Promise<CommunityVerificationRequestPayload> {
    const personId = await this.resolvePersonId(ctx);
    const request = await this.repository.createVerificationRequest({
      personId,
      type: 'community',
      metadata: {
        communityId: input.communityId ?? null,
        note: input.note ?? null,
      },
    });

    return {
      personId,
      status: 'pending',
      message:
        'Community verification request recorded. Manual review deferred to Sprint 2.',
      requestId: request.id,
    };
  }

  async setAdminVerification(
    personId: string,
    input: AdminVerificationPatchInput,
    ctx: MembershipContext,
  ): Promise<VerificationPayload> {
    if (!isAdmin(ctx)) {
      throw new ForbiddenException('Admin access required');
    }

    if (input.level !== 4) {
      throw new BadRequestException('Only level 4 admin verification supported in V1');
    }

    return this.verificationService.setAdminVerification(personId, 4);
  }

  async followPerson(
    targetPersonId: string,
    ctx: MembershipContext,
  ): Promise<PersonFollowPayload> {
    const followerPersonId = await this.resolvePersonId(ctx);

    if (followerPersonId === targetPersonId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const target = await this.repository.findPerson(targetPersonId);
    if (!target) {
      throw new NotFoundException(`Person ${targetPersonId} not found`);
    }

    const existing = await this.repository.findFollow(followerPersonId, targetPersonId);
    if (existing) {
      return {
        followerPersonId,
        followingPersonId: targetPersonId,
        relationshipId: null,
        created: false,
        updatedAt: new Date().toISOString(),
      };
    }

    await this.repository.createFollow(followerPersonId, targetPersonId);
    const relationship = await this.repository.upsertFollowsRelationship(
      followerPersonId,
      targetPersonId,
    );

    await this.activityService.record({
      actorPersonId: followerPersonId,
      action: 'followed_person',
      targetType: 'Person',
      targetId: targetPersonId,
      metadata: {
        targetName: target.displayName ?? target.name,
      },
    });

    return {
      followerPersonId,
      followingPersonId: targetPersonId,
      relationshipId: relationship.id,
      created: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async unfollowPerson(
    targetPersonId: string,
    ctx: MembershipContext,
  ): Promise<PersonUnfollowPayload> {
    const followerPersonId = await this.resolvePersonId(ctx);

    const existing = await this.repository.findFollow(followerPersonId, targetPersonId);
    if (!existing) {
      throw new BadRequestException('Not following this person');
    }

    await this.repository.deleteFollow(followerPersonId, targetPersonId);
    await this.repository.endFollowsRelationship(followerPersonId, targetPersonId);

    await this.activityService.record({
      actorPersonId: followerPersonId,
      action: 'unfollowed_person',
      targetType: 'Person',
      targetId: targetPersonId,
      visibility: 'private',
    });

    return {
      followerPersonId,
      followingPersonId: targetPersonId,
      updatedAt: new Date().toISOString(),
    };
  }

  async listFollowers(
    personId: string,
    page: number,
    limit: number,
  ): Promise<PersonFollowListPayload> {
    const { rows, total } = await this.repository.listFollowers(personId, page, limit);
    return {
      personId,
      items: rows.map((row) => toFollowSummary(row, 'follower')),
      page,
      limit,
      total,
      hasMore: page * limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async listFollowing(
    personId: string,
    page: number,
    limit: number,
  ): Promise<PersonFollowListPayload> {
    const { rows, total } = await this.repository.listFollowing(personId, page, limit);
    return {
      personId,
      items: rows.map((row) => toFollowSummary(row, 'following')),
      page,
      limit,
      total,
      hasMore: page * limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async getFollowStatus(
    personId: string,
    ctx: MembershipContext,
  ): Promise<FollowStatusPayload> {
    const viewerId = await this.resolvePersonId(ctx).catch(() => null);
    const [followerCount, followingCount, existing] = await Promise.all([
      this.repository.countFollowers(personId),
      this.repository.countFollowing(personId),
      viewerId ? this.repository.findFollow(viewerId, personId) : Promise.resolve(null),
    ]);

    return {
      personId,
      isFollowing: !!existing,
      followerCount,
      followingCount,
    };
  }

  async getEcosystemPassportBySlug(slug: string): Promise<EcosystemPassportPayload> {
    let profile = await this.repository.findBySlug(slug);
    const artist = profile
      ? await this.repository.findArtistByPersonId(profile.personId)
      : await this.repository.findArtistBySlug(slug);

    if (!profile && artist?.personId) {
      profile = await this.repository.createStub({
        personId: artist.personId,
        slug: artist.slug,
        displayName: artist.displayName ?? artist.name,
      });
    }

    if (!profile) {
      try {
        const passport = await this.passportService.getPublicPassportBySlug(slug);
        return this.buildEcosystemFromPassport(slug, passport);
      } catch {
        throw new NotFoundException(`Ecosystem passport ${slug} not found`);
      }
    }

    const personId = profile.personId;
    const [roles, relationships, applications, verification, artistRecord] =
      await Promise.all([
        this.repository.listActiveRoles(personId),
        this.repository.listPersonRelationships(personId),
        this.repository.listOpportunityApplications(personId),
        this.verificationService.getVerification(personId),
        this.repository.findArtistByPersonId(personId),
      ]);

    let passportScores = {
      healthScore: null as number | null,
      communityScore: null as number | null,
      activityScore: null as number | null,
      ecosystemScore: profile.ecosystemScore,
    };

    if (artistRecord) {
      try {
        const passport = await this.passportService.getPublicPassportBySlug(profile.slug);
        passportScores = {
          healthScore: passport.reputation?.healthScore ?? null,
          communityScore: passport.reputation?.communityScore ?? null,
          activityScore: passport.reputation?.activityScore ?? null,
          ecosystemScore: passport.ecosystemScore ?? profile.ecosystemScore,
        };
      } catch {
        // Private artist passport — profile placeholders only.
      }
    }

    const refs = relationships.flatMap((edge) => {
      const peer = resolvePeerEntity(edge, personId);
      return peer ? [peer] : [];
    });
    const titles = await this.repository.resolveEntityTitles(refs);

    const communities: EcosystemPassportSectionItem[] = [];
    const events: EcosystemPassportSectionItem[] = [];
    const collaborations: EcosystemPassportSectionItem[] = [];

    for (const edge of relationships) {
      const peer = resolvePeerEntity(edge, personId);
      if (!peer) continue;

      const item: EcosystemPassportSectionItem = {
        id: edge.id,
        relationshipType: edge.relationshipType,
        entityType: peer.entityType,
        entityId: peer.entityId,
        title: titles.get(`${peer.entityType}:${peer.entityId}`) ?? peer.entityId,
        effectiveFrom: edge.effectiveFrom?.toISOString() ?? null,
        metadata: parseMetadata(edge.metadata),
      };

      if (edge.relationshipType === 'MEMBER_OF') communities.push(item);
      else if (
        edge.relationshipType === 'ATTENDED' ||
        edge.relationshipType === 'PERFORMED_AT'
      ) {
        events.push(item);
      } else if (edge.relationshipType === 'COLLABORATED_WITH') {
        collaborations.push(item);
      }
    }

    const displayName =
      profile.person?.displayName ??
      profile.person?.name ??
      profile.username ??
      profile.slug;

    const creativeIdentity = await this.creativeIdentityService.getMergeSummaryBySlug(profile.slug);

    return {
      slug: profile.slug,
      shareUrl: buildProfileShareUrl(profile.slug),
      identity: {
        personId,
        displayName,
        username: profile.username,
        bio: profile.bio ?? artistRecord?.bio ?? null,
        city: profile.city,
        genres: profile.genres ?? [],
        skills: profile.skills ?? [],
        links: parseProfileLinks(profile.links),
        photoUrl: artistRecord?.photoUrl ?? null,
        roles: roles.map((row) => ({
          role: row.role,
          entityType: row.entityType,
          entityId: row.entityId,
          label: row.role.replace(/_/g, ' '),
        })),
        verificationLevel: verification.level,
      },
      communities,
      events,
      opportunities: applications.map((row) => ({
        opportunityId: row.opportunityId,
        title: row.opportunity.title,
        category:
          ((row.opportunity.metadata as Record<string, unknown> | null)?.category as
            | string
            | undefined) ?? null,
        status: row.status,
        appliedAt: row.appliedAt?.toISOString() ?? null,
      })),
      collaborations,
      reputation: {
        reputationScore: profile.reputationScore,
        ecosystemScore: passportScores.ecosystemScore,
        ecosystemRankPercentile: stubEcosystemRankPercentile(
          passportScores.ecosystemScore ?? profile.ecosystemScore,
        ),
        healthScore: passportScores.healthScore,
        communityScore: passportScores.communityScore,
        activityScore: passportScores.activityScore,
      },
      artistPassportAvailable: !!artistRecord,
      creativeIdentity,
      updatedAt: profile.updatedAt.toISOString(),
    };
  }

  private buildEcosystemFromPassport(
    slug: string,
    passport: PublicPassportPayload,
  ): EcosystemPassportPayload {
    return {
      slug,
      shareUrl: passport.shareUrl,
      identity: {
        personId: passport.identity.artistId,
        displayName: passport.identity.displayName,
        username: null,
        bio: passport.identity.bio,
        city: null,
        genres: [],
        skills: [],
        links: passport.identity.links,
        photoUrl: passport.identity.photoUrl,
        roles: [
          {
            role: 'artist',
            entityType: 'Artist',
            entityId: passport.identity.artistId,
            label: 'Artist',
          },
        ],
        verificationLevel: 0,
      },
      communities: passport.career.communities,
      events: passport.career.eventsPlayed,
      opportunities: passport.opportunityHistory,
      collaborations: passport.career.collaborations,
      reputation: {
        reputationScore: null,
        ecosystemScore: passport.ecosystemScore,
        ecosystemRankPercentile: stubEcosystemRankPercentile(passport.ecosystemScore),
        healthScore: passport.reputation?.healthScore ?? null,
        communityScore: passport.reputation?.communityScore ?? null,
        activityScore: passport.reputation?.activityScore ?? null,
      },
      artistPassportAvailable: true,
      updatedAt: passport.updatedAt,
    };
  }

  private async resolvePersonId(ctx: MembershipContext): Promise<string> {
    const mapped = await this.repository.findPersonByCoreKnotUser(ctx.userId);
    if (mapped?.personId) return mapped.personId;

    if (ctx.artistMemberships.length > 0) {
      const personId = await this.repository.findPersonIdByArtistId(
        ctx.artistMemberships[0],
      );
      if (personId) return personId;
    }

    throw new NotFoundException(
      'No person linked to membership — set coreknot_user identifier or artist membership',
    );
  }
}

function resolvePeerEntity(
  edge: {
    sourceEntityType: string;
    sourceEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  },
  personId: string,
): { entityType: string; entityId: string } | null {
  if (edge.sourceEntityType === 'Person' && edge.sourceEntityId === personId) {
    return { entityType: edge.targetEntityType, entityId: edge.targetEntityId };
  }
  if (edge.targetEntityType === 'Person' && edge.targetEntityId === personId) {
    return { entityType: edge.sourceEntityType, entityId: edge.sourceEntityId };
  }
  return null;
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function stubEcosystemRankPercentile(score: number | null | undefined): number | null {
  if (score == null) return null;
  return Math.min(99, Math.max(1, Math.round(score)));
}

function toFollowSummary(
  row: PersonFollowRow,
  side: 'follower' | 'following',
): PersonFollowListPayload['items'][number] {
  const person = side === 'follower' ? row.follower : row.following;
  return {
    personId: person?.id ?? (side === 'follower' ? row.followerPersonId : row.followingPersonId),
    displayName:
      person?.displayName?.trim() ||
      person?.name?.trim() ||
      person?.id ||
      'Member',
    slug: person?.profile?.slug ?? null,
    username: person?.profile?.username ?? null,
    followedAt: row.createdAt.toISOString(),
  };
}
