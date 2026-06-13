import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  AUDIENCE_PERIOD_DAYS,
  aggregateSuperfanRows,
  computeAudienceHealth,
  computeCommunityAudience,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { toInputJson } from '../../common/json';

type AudienceHealthRow = {
  id: string;
  artistId: string;
  snapshotDate: Date;
  audienceGrowth: number;
  audienceChurn: number;
  fanRetention: number;
  fanConversion: number;
  lifetimeValueStub: number;
  metrics: unknown;
  updatedAt: Date;
};

type CommunityAudienceRow = {
  id: string;
  communityId: string;
  snapshotDate: Date;
  memberGrowth: number;
  activeMembers: number;
  membershipRevenueStub: number;
  fanGrowth: number;
  eventConversion: number;
  metrics: unknown;
  updatedAt: Date;
};

type AudienceHealthClient = {
  findFirst: (args: unknown) => Promise<AudienceHealthRow | null>;
  upsert: (args: unknown) => Promise<AudienceHealthRow>;
  findMany: (args: unknown) => Promise<
    Array<
      AudienceHealthRow & {
        artist: { id: string; name: string; slug: string };
      }
    >
  >;
};

type CommunityAudienceClient = {
  findFirst: (args: unknown) => Promise<CommunityAudienceRow | null>;
  upsert: (args: unknown) => Promise<CommunityAudienceRow>;
  findMany: (args: unknown) => Promise<
    Array<
      CommunityAudienceRow & {
        community: { id: string; name: string; slug: string };
      }
    >
  >;
};

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

@Injectable()
export class AudienceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get audienceHealthClient(): AudienceHealthClient | null {
    return (this.prisma.client as unknown as { audienceHealthSnapshot?: AudienceHealthClient })
      .audienceHealthSnapshot ?? null;
  }

  private get communityAudienceClient(): CommunityAudienceClient | null {
    return (this.prisma.client as unknown as { communityAudienceSnapshot?: CommunityAudienceClient })
      .communityAudienceSnapshot ?? null;
  }

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { id: true, name: true, slug: true },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      select: { id: true, name: true, slug: true, artistId: true },
    });
  }

  findLatestAudienceHealth(artistId: string) {
    if (!this.audienceHealthClient) return Promise.resolve(null);
    return this.audienceHealthClient.findFirst({
      where: { artistId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  findLatestCommunityAudience(communityId: string) {
    if (!this.communityAudienceClient) return Promise.resolve(null);
    return this.communityAudienceClient.findFirst({
      where: { communityId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  async collectArtistAudienceInput(artistId: string) {
    const periodStart = daysAgo(AUDIENCE_PERIOD_DAYS);
    const previousStart = daysAgo(AUDIENCE_PERIOD_DAYS * 2);

    const [
      totalFollowers,
      newFollowersCurrent,
      newFollowersPrevious,
      followerPersonIds,
      eventParticipations,
      fanProfiles,
      superfanRows,
      fanIntelRows,
      membershipRevenue,
    ] = await Promise.all([
      this.prisma.client.artistFollow.count({ where: { artistId } }),
      this.prisma.client.artistFollow.count({
        where: { artistId, followedAt: { gte: periodStart } },
      }),
      this.prisma.client.artistFollow.count({
        where: { artistId, followedAt: { gte: previousStart, lt: periodStart } },
      }),
      this.prisma.client.artistFollow.findMany({
        where: { artistId },
        select: { personId: true },
      }),
      this.prisma.client.eventParticipation.findMany({
        where: { event: { artistId } },
        select: { status: true, personId: true },
      }),
      this.prisma.client.fanProfile.findMany({
        where: {
          person: { artistFollows: { some: { artistId } } },
        },
        select: { spendScore: true },
      }),
      this.prisma.client.superfanSnapshot.findMany({
        where: { artistId },
        distinct: ['personId'],
        orderBy: [{ personId: 'asc' }, { snapshotDate: 'desc' }],
        select: { superfanScore: true, tier: true, personId: true },
      }),
      this.prisma.client.fanIntelligenceSnapshot.findMany({
        where: { artistId },
        distinct: ['personId'],
        orderBy: [{ personId: 'asc' }, { snapshotDate: 'desc' }],
        select: { loyaltyScore: true },
      }),
      this.sumArtistMembershipRevenueStub(artistId),
    ]);

    const personIds = followerPersonIds.map((row) => row.personId);
    const activeFollowerCount =
      personIds.length === 0
        ? 0
        : await this.prisma.client.activity.count({
            where: {
              actorPersonId: { in: personIds },
              timestamp: { gte: periodStart },
            },
          });

    const eventRegistered = eventParticipations.filter(
      (row) => row.status === 'registered' || row.status === 'checked_in',
    ).length;
    const eventCheckedIn = eventParticipations.filter(
      (row) => row.status === 'checked_in',
    ).length;

    const avgSpendScore =
      fanProfiles.length > 0
        ? fanProfiles.reduce((sum, row) => sum + row.spendScore, 0) / fanProfiles.length
        : 0;

    const superfanAggregate = aggregateSuperfanRows(superfanRows);
    const fanIntelligenceAvgLoyalty =
      fanIntelRows.length > 0
        ? fanIntelRows.reduce((sum, row) => sum + row.loyaltyScore, 0) / fanIntelRows.length
        : null;

    return computeAudienceHealth({
      totalFollowers,
      newFollowersCurrent,
      newFollowersPrevious,
      activeFollowerCount,
      eventRegistered,
      eventCheckedIn,
      avgSpendScore,
      avgSuperfanScore: superfanAggregate.avgScore,
      platinumPlusCount: superfanAggregate.platinumPlusCount,
      membershipRevenueStub: membershipRevenue,
      fanIntelligenceAvgLoyalty,
    });
  }

  async collectCommunityAudienceInput(communityId: string, artistId: string | null) {
    const periodStart = daysAgo(AUDIENCE_PERIOD_DAYS);
    const previousStart = daysAgo(AUDIENCE_PERIOD_DAYS * 2);

    const [totalMembers, newMembersCurrent, newMembersPrevious, memberRows, membershipRevenue] =
      await Promise.all([
        this.prisma.client.communityMember.count({
          where: { communityId, status: 'active' },
        }),
        this.prisma.client.communityMember.count({
          where: { communityId, status: 'active', joinedAt: { gte: periodStart } },
        }),
        this.prisma.client.communityMember.count({
          where: {
            communityId,
            status: 'active',
            joinedAt: { gte: previousStart, lt: periodStart },
          },
        }),
        this.prisma.client.communityMember.findMany({
          where: { communityId, status: 'active' },
          select: { personId: true },
        }),
        this.sumCommunityMembershipRevenueStub(communityId),
      ]);

    const memberPersonIds = memberRows.map((row) => row.personId);
    const activeMemberCount =
      memberPersonIds.length === 0
        ? 0
        : await this.prisma.client.activity.count({
            where: {
              actorPersonId: { in: memberPersonIds },
              timestamp: { gte: periodStart },
            },
          });

    const eventParticipations =
      memberPersonIds.length === 0
        ? []
        : await this.prisma.client.eventParticipation.findMany({
            where: {
              personId: { in: memberPersonIds },
              event: artistId ? { artistId } : undefined,
            },
            select: { status: true },
          });

    const eventRegistered = eventParticipations.filter(
      (row) => row.status === 'registered' || row.status === 'checked_in',
    ).length;
    const eventCheckedIn = eventParticipations.filter(
      (row) => row.status === 'checked_in',
    ).length;

    let newSuperfans = 0;
    if (artistId && memberPersonIds.length > 0) {
      newSuperfans = await this.prisma.client.superfanSnapshot.count({
        where: {
          artistId,
          personId: { in: memberPersonIds },
          snapshotDate: { gte: periodStart },
          tier: { in: ['silver', 'gold', 'platinum', 'legend'] },
        },
      });
    }

    return computeCommunityAudience({
      totalMembers,
      newMembersCurrent,
      newMembersPrevious,
      activeMemberCount,
      membershipRevenueStub: membershipRevenue,
      newSuperfans,
      eventRegistered,
      eventCheckedIn,
    });
  }

  async upsertAudienceHealth(artistId: string, computed: ReturnType<typeof computeAudienceHealth>) {
    if (!this.audienceHealthClient) return null;
    const snapshotDate = startOfUtcDay();
    return this.audienceHealthClient.upsert({
      where: {
        artistId_snapshotDate: { artistId, snapshotDate },
      },
      create: {
        artistId,
        snapshotDate,
        audienceGrowth: computed.audienceGrowth,
        audienceChurn: computed.audienceChurn,
        fanRetention: computed.fanRetention,
        fanConversion: computed.fanConversion,
        lifetimeValueStub: computed.lifetimeValueStub,
        metrics: toInputJson(computed.metrics) as Prisma.InputJsonValue,
      },
      update: {
        audienceGrowth: computed.audienceGrowth,
        audienceChurn: computed.audienceChurn,
        fanRetention: computed.fanRetention,
        fanConversion: computed.fanConversion,
        lifetimeValueStub: computed.lifetimeValueStub,
        metrics: toInputJson(computed.metrics) as Prisma.InputJsonValue,
      },
    });
  }

  async upsertCommunityAudience(
    communityId: string,
    computed: ReturnType<typeof computeCommunityAudience>,
  ) {
    if (!this.communityAudienceClient) return null;
    const snapshotDate = startOfUtcDay();
    return this.communityAudienceClient.upsert({
      where: {
        communityId_snapshotDate: { communityId, snapshotDate },
      },
      create: {
        communityId,
        snapshotDate,
        memberGrowth: computed.memberGrowth,
        activeMembers: computed.activeMembers,
        membershipRevenueStub: computed.membershipRevenueStub,
        fanGrowth: computed.fanGrowth,
        eventConversion: computed.eventConversion,
        metrics: toInputJson(computed.metrics) as Prisma.InputJsonValue,
      },
      update: {
        memberGrowth: computed.memberGrowth,
        activeMembers: computed.activeMembers,
        membershipRevenueStub: computed.membershipRevenueStub,
        fanGrowth: computed.fanGrowth,
        eventConversion: computed.eventConversion,
        metrics: toInputJson(computed.metrics) as Prisma.InputJsonValue,
      },
    });
  }

  listTopGrowthArtists(limit: number, threshold: number) {
    if (!this.audienceHealthClient) return Promise.resolve([]);
    return this.audienceHealthClient.findMany({
      where: { audienceGrowth: { gte: threshold } },
      include: { artist: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ audienceGrowth: 'desc' }, { fanRetention: 'desc' }],
      take: limit,
      distinct: ['artistId'],
    });
  }

  listChurnRiskArtists(limit: number, threshold: number) {
    if (!this.audienceHealthClient) return Promise.resolve([]);
    return this.audienceHealthClient.findMany({
      where: { fanRetention: { lt: threshold } },
      include: { artist: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ fanRetention: 'asc' }, { audienceChurn: 'desc' }],
      take: limit,
      distinct: ['artistId'],
    });
  }

  listMostLoyalCommunities(limit: number) {
    if (!this.communityAudienceClient) return Promise.resolve([]);
    return this.communityAudienceClient.findMany({
      include: { community: { select: { id: true, name: true, slug: true } } },
      orderBy: [{ activeMembers: 'desc' }, { memberGrowth: 'desc' }, { fanGrowth: 'desc' }],
      take: limit,
      distinct: ['communityId'],
    });
  }

  private async sumArtistMembershipRevenueStub(artistId: string): Promise<number> {
    const memberships = await this.prisma.client.membership.findMany({
      where: { community: { artistId }, isActive: true },
      select: { id: true, price: true },
    });
    if (memberships.length === 0) return 0;

    const counts = await Promise.all(
      memberships.map((membership) =>
        this.prisma.client.membershipSubscription.count({
          where: { membershipId: membership.id, status: 'active' },
        }),
      ),
    );

    return memberships.reduce(
      (sum, membership, index) => sum + membership.price * counts[index],
      0,
    );
  }

  private async sumCommunityMembershipRevenueStub(communityId: string): Promise<number> {
    const memberships = await this.prisma.client.membership.findMany({
      where: { communityId, isActive: true },
      select: { id: true, price: true },
    });
    if (memberships.length === 0) return 0;

    const counts = await Promise.all(
      memberships.map((membership) =>
        this.prisma.client.membershipSubscription.count({
          where: { membershipId: membership.id, status: 'active' },
        }),
      ),
    );

    return memberships.reduce(
      (sum, membership, index) => sum + membership.price * counts[index],
      0,
    );
  }
}
