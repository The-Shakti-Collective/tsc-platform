import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  FAN_GRAPH_RELATIONSHIP_TYPES,
  SUPERFAN_TIERS,
  buildEntitySubgraph,
  calculateSuperfanScore,
  clampFanScore,
  fanProfileInclude,
  membershipMonthsFromJoinDate,
  stubFanScoresFromParticipation,
  whereActiveAt,
  whereEntityTouches,
  type SuperfanTier,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

type FanProfileRow = {
  id: string;
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
};

type FanProfileClient = {
  findUnique: (args: unknown) => Promise<FanProfileRow | null>;
  findMany: (args: unknown) => Promise<
    Array<Pick<FanProfileRow, 'personId' | 'engagementScore' | 'attendanceScore'>>
  >;
  create: (args: unknown) => Promise<FanProfileRow>;
  update: (args: unknown) => Promise<FanProfileRow>;
  upsert: (args: unknown) => Promise<FanProfileRow>;
};

type ArtistFollowClient = {
  findUnique: (args: unknown) => Promise<{ id: string } | null>;
  create: (args: unknown) => Promise<{ id: string; followedAt: Date }>;
  findMany: (args: unknown) => Promise<
    Array<{
      id: string;
      personId: string;
      artistId: string;
      followedAt: Date;
      person: {
        id: string;
        displayName: string | null;
        name: string | null;
        profile: { slug: string | null } | null;
      };
    }>
  >;
  count: (args: unknown) => Promise<number>;
};

type FanIntelligenceSnapshotClient = {
  findFirst: (args: unknown) => Promise<{
    engagementScore: number;
    purchaseScore: number;
    attendanceScore: number;
    influenceScore: number;
    snapshotDate: Date;
  } | null>;
};

type SuperfanSnapshotRow = {
  id: string;
  personId: string;
  artistId: string | null;
  superfanScore: number;
  tier: string;
  factors: unknown;
  snapshotDate: Date;
  updatedAt: Date;
};

type SuperfanSnapshotClient = {
  findFirst: (args: unknown) => Promise<SuperfanSnapshotRow | null>;
  upsert: (args: unknown) => Promise<SuperfanSnapshotRow>;
  findMany: (args: unknown) => Promise<
    Array<
      SuperfanSnapshotRow & {
        person: {
          id: string;
          displayName: string | null;
          name: string | null;
          profile: { slug: string | null } | null;
        };
      }
    >
  >;
  groupBy: (args: unknown) => Promise<Array<{ tier: string; _count: { _all: number } }>>;
};

@Injectable()
export class FanRepository {
  constructor(private readonly prisma: PrismaService) {}

  isAvailable(): boolean {
    return Boolean(this.fanProfileClient);
  }

  private get fanProfileClient(): FanProfileClient | null {
    return (this.prisma.client as unknown as { fanProfile?: FanProfileClient }).fanProfile ?? null;
  }

  private get artistFollowClient(): ArtistFollowClient | null {
    return (this.prisma.client as unknown as { artistFollow?: ArtistFollowClient }).artistFollow ?? null;
  }

  private get snapshotClient(): FanIntelligenceSnapshotClient | null {
    return (this.prisma.client as unknown as { fanIntelligenceSnapshot?: FanIntelligenceSnapshotClient })
      .fanIntelligenceSnapshot ?? null;
  }

  private get superfanSnapshotClient(): SuperfanSnapshotClient | null {
    return (this.prisma.client as unknown as { superfanSnapshot?: SuperfanSnapshotClient })
      .superfanSnapshot ?? null;
  }

  findFanProfile(personId: string) {
    if (!this.fanProfileClient) return Promise.resolve(null);
    return this.fanProfileClient.findUnique({
      where: { personId },
      include: fanProfileInclude,
    });
  }

  createFanProfileStub(personId: string) {
    if (!this.fanProfileClient) return Promise.resolve(null);
    return this.fanProfileClient.create({
      data: { personId },
    });
  }

  findProfileSlug(personId: string) {
    return this.prisma.client.personProfile
      .findUnique({
        where: { personId },
        select: { slug: true },
      })
      .then((row) => row?.slug ?? null);
  }

  upsertFanProfile(
    personId: string,
    data: Partial<
      Pick<
        FanProfileRow,
        'favoriteGenres' | 'favoriteArtists' | 'cities'
      >
    >,
  ) {
    if (!this.fanProfileClient) return Promise.resolve(null);
    return this.fanProfileClient.upsert({
      where: { personId },
      create: {
        personId,
        favoriteGenres: data.favoriteGenres ?? [],
        favoriteArtists: data.favoriteArtists ?? [],
        cities: data.cities ?? [],
      },
      update: {
        favoriteGenres: data.favoriteGenres,
        favoriteArtists: data.favoriteArtists,
        cities: data.cities,
      },
    });
  }

  updateFanProfileScores(
    personId: string,
    scores: {
      engagementScore: number;
      spendScore: number;
      attendanceScore: number;
      influenceScore: number;
    },
  ) {
    if (!this.fanProfileClient) return Promise.resolve(null);
    return this.fanProfileClient.update({
      where: { personId },
      data: scores,
    });
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, displayName: true, slug: true },
    });
  }

  findPerson(personId: string) {
    return this.prisma.client.person.findUnique({
      where: { id: personId },
      select: { id: true, displayName: true, name: true },
    });
  }

  findExistingArtistFollow(personId: string, artistId: string) {
    if (!this.artistFollowClient) return Promise.resolve(null);
    return this.artistFollowClient.findUnique({
      where: { personId_artistId: { personId, artistId } },
    });
  }

  createArtistFollow(personId: string, artistId: string) {
    if (!this.artistFollowClient) return Promise.resolve(null);
    return this.artistFollowClient.create({
      data: { personId, artistId },
    });
  }

  upsertFollowsArtistRelationship(personId: string, artistId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Artist',
            targetEntityId: artistId,
            relationshipType: 'FOLLOWS',
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Artist',
        targetEntityId: artistId,
        relationshipType: 'FOLLOWS',
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'fan-follow' }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'fan-follow' }),
      },
    });
  }

  upsertSupportedArtistRelationship(personId: string, artistId: string) {
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Artist',
            targetEntityId: artistId,
            relationshipType: 'SUPPORTED',
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Artist',
        targetEntityId: artistId,
        relationshipType: 'SUPPORTED',
        effectiveFrom: new Date(),
        metadata: toInputJson({ source: 'fan-support-stub' }),
      },
      update: {
        effectiveTo: null,
        effectiveFrom: new Date(),
      },
    });
  }

  listFanGraphRelationships(personId: string, includeInactive: boolean) {
    const clauses: Prisma.RelationshipWhereInput[] = [
      whereEntityTouches('Person', personId),
      {
        relationshipType: { in: [...FAN_GRAPH_RELATIONSHIP_TYPES] },
      },
    ];
    if (!includeInactive) {
      clauses.push(whereActiveAt());
    }

    return this.prisma.client.relationship.findMany({
      where: { AND: clauses },
      orderBy: { updatedAt: 'desc' },
      take: 200,
    });
  }

  buildFanSubgraph(personId: string, includeInactive: boolean) {
    return this.listFanGraphRelationships(personId, includeInactive).then((rows) =>
      buildEntitySubgraph('Person', personId, rows),
    );
  }

  resolveEntityTitles(refs: Array<{ entityType: string; entityId: string }>) {
    const map = new Map<string, string>();
    const tasks = refs.map(async (ref) => {
      const key = `${ref.entityType}:${ref.entityId}`;
      if (map.has(key)) return;

      if (ref.entityType === 'Artist') {
        const row = await this.prisma.client.artist.findUnique({
          where: { id: ref.entityId },
          select: { displayName: true, name: true },
        });
        if (row) map.set(key, row.displayName ?? row.name ?? ref.entityId);
        return;
      }
      if (ref.entityType === 'Event') {
        const row = await this.prisma.client.event.findUnique({
          where: { id: ref.entityId },
          select: { title: true },
        });
        if (row) map.set(key, row.title);
        return;
      }
      if (ref.entityType === 'Community') {
        const row = await this.prisma.client.community.findUnique({
          where: { id: ref.entityId },
          select: { name: true },
        });
        if (row) map.set(key, row.name);
      }
    });

    return Promise.all(tasks).then(() => map);
  }

  findLatestFanSnapshot(personId: string, artistId?: string) {
    if (!this.snapshotClient) return Promise.resolve(null);
    return this.snapshotClient.findFirst({
      where: {
        personId,
        ...(artistId ? { artistId } : {}),
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  countArtistFollows(personId: string) {
    if (!this.artistFollowClient) return Promise.resolve(0);
    return this.artistFollowClient.count({ where: { personId } });
  }

  listTopFansByArtist(artistId: string, limit: number) {
    if (!this.artistFollowClient) return Promise.resolve([]);
    return this.artistFollowClient.findMany({
      where: { artistId },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
            profile: { select: { slug: true } },
          },
        },
      },
      orderBy: { followedAt: 'desc' },
      take: limit * 3,
    });
  }

  async listFanProfilesByPersonIds(personIds: string[]) {
    if (!this.fanProfileClient || personIds.length === 0) return [];
    return this.fanProfileClient.findMany({
      where: { personId: { in: personIds } },
      select: {
        personId: true,
        engagementScore: true,
        attendanceScore: true,
      },
    });
  }

  findLatestSuperfanSnapshot(personId: string, artistId?: string) {
    if (!this.superfanSnapshotClient) return Promise.resolve(null);
    return this.superfanSnapshotClient.findFirst({
      where: {
        personId,
        artistId: artistId ?? null,
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  upsertSuperfanSnapshot(data: {
    personId: string;
    artistId: string | null;
    superfanScore: number;
    tier: SuperfanTier;
    factors: unknown;
  }) {
    if (!this.superfanSnapshotClient) return Promise.resolve(null);

    const snapshotDate = new Date();
    snapshotDate.setUTCHours(0, 0, 0, 0);

    return this.superfanSnapshotClient.upsert({
      where: {
        personId_artistId_snapshotDate: {
          personId: data.personId,
          artistId: data.artistId,
          snapshotDate,
        },
      },
      create: {
        personId: data.personId,
        artistId: data.artistId,
        superfanScore: data.superfanScore,
        tier: data.tier,
        factors: toInputJson(data.factors),
        snapshotDate,
      },
      update: {
        superfanScore: data.superfanScore,
        tier: data.tier,
        factors: toInputJson(data.factors),
      },
    });
  }

  async collectSuperfanFactorInput(personId: string, artistId?: string) {
    const [
      participation,
      communityCount,
      purchaseCount,
      referralCount,
      earliestJoin,
      profile,
    ] = await Promise.all([
      this.countEventParticipation(personId, artistId),
      this.countActiveCommunities(personId, artistId),
      this.countPurchasedRelationships(personId, artistId),
      this.countReferredRelationships(personId, artistId),
      this.earliestCommunityJoinDate(personId, artistId),
      this.findFanProfile(personId),
    ]);

    return {
      checkedInCount: participation.checkedInCount,
      registeredCount: participation.registeredCount,
      purchaseCount,
      spendScore: profile?.spendScore ?? 0,
      communityCount,
      referralCount,
      membershipMonths: membershipMonthsFromJoinDate(earliestJoin),
    };
  }

  countEventParticipation(personId: string, artistId?: string) {
    const eventFilter = artistId
      ? { event: { artistId } }
      : {};

    return Promise.all([
      this.prisma.client.eventParticipation.count({
        where: { personId, status: { not: 'cancelled' }, ...eventFilter },
      }),
      this.prisma.client.eventParticipation.count({
        where: { personId, status: 'checked_in', ...eventFilter },
      }),
    ]).then(([registeredCount, checkedInCount]) => ({
      registeredCount,
      checkedInCount,
    }));
  }

  countActiveCommunities(personId: string, artistId?: string) {
    const communityFilter = artistId
      ? { community: { artistId } }
      : {};

    return this.prisma.client.communityMember.count({
      where: { personId, status: 'active', ...communityFilter },
    });
  }

  countPurchasedRelationships(personId: string, artistId?: string) {
    const clauses: Prisma.RelationshipWhereInput[] = [
      {
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        relationshipType: 'PURCHASED',
      },
      whereActiveAt(),
    ];
    if (artistId) {
      clauses.push({
        targetEntityType: 'Artist',
        targetEntityId: artistId,
      });
    }

    return this.prisma.client.relationship.count({
      where: { AND: clauses },
    });
  }

  countReferredRelationships(personId: string, artistId?: string) {
    const clauses: Prisma.RelationshipWhereInput[] = [
      {
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        relationshipType: 'REFERRED',
      },
      whereActiveAt(),
    ];
    if (artistId) {
      clauses.push({
        metadata: {
          path: ['artistId'],
          equals: artistId,
        },
      });
    }

    return this.prisma.client.relationship.count({
      where: { AND: clauses },
    });
  }

  earliestCommunityJoinDate(personId: string, artistId?: string) {
    const communityFilter = artistId
      ? { community: { artistId } }
      : {};

    return this.prisma.client.communityMember.findFirst({
      where: { personId, status: 'active', ...communityFilter },
      orderBy: { joinedAt: 'asc' },
      select: { joinedAt: true },
    }).then((row) => row?.joinedAt ?? null);
  }

  async listTopSuperfansByArtist(artistId: string, limit: number) {
    if (!this.superfanSnapshotClient) return [];

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const snapshots = await this.superfanSnapshotClient.findMany({
      where: {
        artistId,
        snapshotDate: today,
      },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
            profile: { select: { slug: true } },
          },
        },
      },
      orderBy: { superfanScore: 'desc' },
      take: limit,
    });

    if (snapshots.length > 0) return snapshots;

    const followers = await this.listTopFansByArtist(artistId, limit);
    const results: Array<
      SuperfanSnapshotRow & {
        person: {
          id: string;
          displayName: string | null;
          name: string | null;
          profile: { slug: string | null } | null;
        };
      }
    > = [];

    for (const follow of followers.slice(0, limit)) {
      const input = await this.collectSuperfanFactorInput(follow.personId, artistId);
      const profile = await this.findFanProfile(follow.personId);
      const calc = calculateSuperfanScore({
        ...input,
        spendScore: profile?.spendScore ?? input.spendScore,
      });

      const saved = await this.upsertSuperfanSnapshot({
        personId: follow.personId,
        artistId,
        superfanScore: calc.superfanScore,
        tier: calc.tier,
        factors: calc.factors,
      });

      if (saved) {
        results.push({
          ...saved,
          person: follow.person,
        });
      }
    }

    return results.sort((a, b) => b.superfanScore - a.superfanScore).slice(0, limit);
  }

  async countSuperfanSegmentsByArtist(artistId: string) {
    if (!this.superfanSnapshotClient) {
      return SUPERFAN_TIERS.map((tier) => ({ tier, count: 0 }));
    }

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const grouped = await this.superfanSnapshotClient.groupBy({
      by: ['tier'],
      where: { artistId, snapshotDate: today },
      _count: { _all: true },
    });

    const countMap = new Map(grouped.map((row) => [row.tier, row._count._all]));

    return SUPERFAN_TIERS.map((tier) => ({
      tier,
      count: countMap.get(tier) ?? 0,
    }));
  }
}

export { clampFanScore, stubFanScoresFromParticipation };
