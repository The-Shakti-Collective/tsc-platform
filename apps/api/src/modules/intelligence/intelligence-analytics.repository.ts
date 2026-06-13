import { Injectable } from '@nestjs/common';
import type { GraphEntityType, Prisma } from '@tsc/database';
import type { AudienceIntelligenceInput, AudienceSnapshotScores } from '@tsc/types';
import { PrismaService } from '../../common/database/prisma.service';
import { optionalPrismaClient } from '../../common/prisma/optional-client';

type OptionalModelClient = {
  findFirst?: (args: unknown) => Promise<unknown>;
  findMany?: (args: unknown) => Promise<unknown>;
  count?: (args: unknown) => Promise<number>;
  aggregate?: (args: unknown) => Promise<{ _sum: { amount: unknown } }>;
};

@Injectable()
export class IntelligenceAnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findArtist(artistId: string) {
    return this.prisma.client.artist.findUnique({
      where: { id: artistId },
    });
  }

  findCommunity(communityId: string) {
    return this.prisma.client.community.findUnique({
      where: { id: communityId },
      include: {
        _count: { select: { members: true, posts: true } },
      },
    });
  }

  countFollowers(artistId: string) {
    return this.prisma.client.artistFollow.count({ where: { artistId } });
  }

  countFollowersSince(artistId: string, since: Date) {
    return this.prisma.client.artistFollow.count({
      where: { artistId, followedAt: { gte: since } },
    });
  }

  countFollowersBetween(artistId: string, start: Date, end: Date) {
    return this.prisma.client.artistFollow.count({
      where: {
        artistId,
        followedAt: { gte: start, lt: end },
      },
    });
  }

  countCommunityMembers(artistId: string) {
    return this.prisma.client.communityMember.count({
      where: { community: { artistId } },
    });
  }

  countActiveMembers(artistId: string, since: Date) {
    return this.prisma.client.communityMember.count({
      where: {
        community: { artistId },
        updatedAt: { gte: since },
      },
    });
  }

  countArtistEvents(artistId: string) {
    return this.prisma.client.event.count({ where: { artistId } });
  }

  listOpenOpportunities(artistId?: string) {
    return this.prisma.client.opportunity.findMany({
      where: {
        status: { in: ['open', 'pending', 'in_progress'] },
        ...(artistId
          ? {
              OR: [{ ownerId: null }, { ownerType: 'artist', ownerId: artistId }],
            }
          : {}),
      },
      include: {
        _count: { select: { activities: true, applications: true } },
      },
      orderBy: { updatedAt: 'desc' },
      take: 100,
    });
  }

  listSuggestedOpportunities(artistId: string) {
    return this.prisma.client.opportunity.findMany({
      where: {
        status: 'open',
        OR: [{ ownerId: null }, { ownerType: 'artist', ownerId: artistId }],
      },
      include: {
        _count: { select: { activities: true, applications: true } },
      },
      orderBy: [{ value: 'desc' }, { updatedAt: 'desc' }],
      take: 20,
    });
  }

  findLatestAudienceSnapshot(personId: string, artistId?: string) {
    return this.prisma.client.fanIntelligenceSnapshot.findFirst({
      where: {
        personId,
        ...(artistId ? { artistId } : {}),
      },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  async buildAudienceInput(
    personId: string,
    artistId?: string,
  ): Promise<AudienceIntelligenceInput> {
    const since30 = daysAgo(30);

    const recommendationSignal = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'recommendationSignal',
    );

    const [follow, posts, attendance, signals] = await Promise.all([
      artistId
        ? this.prisma.client.artistFollow.findFirst({
            where: { personId, artistId },
          })
        : this.prisma.client.artistFollow.findFirst({
            where: { personId },
            orderBy: { followedAt: 'asc' },
          }),
      this.prisma.client.communityPost.count({
        where: {
          authorId: personId,
          ...(artistId ? { community: { artistId } } : {}),
        },
      }),
      this.prisma.client.eventParticipation.findMany({
        where: {
          personId,
          ...(artistId ? { event: { artistId } } : {}),
        },
        select: { status: true, updatedAt: true, checkedInAt: true },
      }),
      recommendationSignal?.count
        ? recommendationSignal.count({
            where: {
              personId,
              recordedAt: { gte: since30 },
            },
          })
        : Promise.resolve(0),
    ]);

    const attended = attendance.filter((row) => row.status === 'checked_in').length;
    const invited = attendance.length;
    const noShow = attendance.filter(
      (row) => row.status === 'cancelled' || row.status === 'no_show',
    ).length;
    const lastAttendance = attendance.reduce<Date | null>((latest, row) => {
      const stamp = row.checkedInAt ?? row.updatedAt;
      if (!latest || stamp > latest) return stamp;
      return latest;
    }, null);
    const daysSinceLastAttendance = lastAttendance
      ? Math.floor((Date.now() - lastAttendance.getTime()) / 86_400_000)
      : 999;

    const tenureDays = follow
      ? Math.floor((Date.now() - follow.followedAt.getTime()) / 86_400_000)
      : 0;

    return {
      personId,
      community: {
        postsCount: posts,
        membershipDays: tenureDays,
        activeDaysLast30: posts > 0 ? Math.min(30, posts) : 0,
      },
      attendance: {
        eventsAttended: attended,
        eventsInvited: invited,
        eventsNoShow: noShow,
        daysSinceLastAttendance,
      },
      engagement: {
        contentInteractions: signals,
        sessionsLast30Days: Math.min(signals, 20),
      },
      spending: {
        totalSpendLast90Days: 0,
        transactionCount: attendance.length,
        daysSinceLastPurchase: daysSinceLastAttendance,
      },
      loyalty: {
        tenureDays,
        consecutiveActiveMonths: posts > 0 ? Math.min(12, Math.floor(posts / 2)) : 0,
      },
    };
  }

  async listFanSegmentRows(artistId: string) {
    const follows = await this.prisma.client.artistFollow.findMany({
      where: { artistId },
      include: {
        person: { include: { profile: true } },
      },
    });
    if (follows.length === 0) return [];

    const personIds = follows.map((row) => row.personId);
    const [postCounts, attendanceRows] = await Promise.all([
      this.prisma.client.communityPost.groupBy({
        by: ['authorId'],
        where: { community: { artistId }, authorId: { in: personIds } },
        _count: { _all: true },
        _max: { updatedAt: true },
      }),
      this.prisma.client.eventParticipation.findMany({
        where: { event: { artistId }, personId: { in: personIds } },
        select: { personId: true, updatedAt: true, checkedInAt: true },
      }),
    ]);

    const postUpdatedByPerson = new Map(
      postCounts.map((row) => [row.authorId, row._max.updatedAt]),
    );

    const attendanceByPerson = new Map<string, { lastActive: Date | null }>();
    for (const row of attendanceRows) {
      const stamp = row.checkedInAt ?? row.updatedAt;
      const current = attendanceByPerson.get(row.personId) ?? { lastActive: null };
      if (!current.lastActive || stamp > current.lastActive) {
        current.lastActive = stamp;
      }
      attendanceByPerson.set(row.personId, current);
    }

    const now = Date.now();
    return Promise.all(
      follows.map(async (follow) => {
        const input = await this.buildAudienceInput(follow.personId, artistId);
        const attendance = attendanceByPerson.get(follow.personId);
        const lastActive = maxDate(
          follow.followedAt,
          postUpdatedByPerson.get(follow.personId) ?? null,
          attendance?.lastActive ?? null,
        );
        const lastActiveDays = lastActive
          ? Math.floor((now - lastActive.getTime()) / 86_400_000)
          : 999;

        return {
          personId: follow.personId,
          name:
            follow.person.displayName ??
            follow.person.name ??
            follow.person.profile?.username ??
            `Fan ${follow.personId.slice(0, 6)}`,
          input,
          lastActiveDays,
        };
      }),
    );
  }

  findLatestCitySnapshot(city: string) {
    const citySnapshot = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'cityIntelligenceSnapshot',
    );
    if (!citySnapshot?.findFirst) return Promise.resolve(null);
    return citySnapshot.findFirst({
      where: { city: { equals: city, mode: 'insensitive' } },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  async computeLiveCityCounts(city: string) {
    const cityFilter = { equals: city, mode: 'insensitive' as const };
    const revenueClient = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'revenueTransaction',
    );

    const [venuesCount, eventsCount, artistFollows, communityMembers, revenueAggregate] =
      await Promise.all([
        this.prisma.client.venue.count({ where: { city: cityFilter } }),
        this.prisma.client.event.count({
          where: { venue: { city: cityFilter } },
        }),
        this.prisma.client.artistFollow.count({
          where: {
            artist: {
              OR: [
                { events: { some: { venue: { city: cityFilter } } } },
                { communities: { some: { name: { contains: city, mode: 'insensitive' } } } },
              ],
            },
          },
        }),
        this.prisma.client.communityMember.count({
          where: {
            community: {
              OR: [
                { name: { contains: city, mode: 'insensitive' } },
                { artist: { events: { some: { venue: { city: cityFilter } } } } },
              ],
            },
          },
        }),
        revenueClient?.aggregate
          ? revenueClient.aggregate({
              where: {
                deal: {
                  artist: {
                    events: { some: { venue: { city: cityFilter } } },
                  },
                },
              },
              _sum: { amount: true },
            })
          : Promise.resolve({ _sum: { amount: null } }),
      ]);

    const artistsCount = await this.prisma.client.artist.count({
      where: {
        OR: [
          { events: { some: { venue: { city: cityFilter } } } },
          { communities: { some: { name: { contains: city, mode: 'insensitive' } } } },
        ],
      },
    });

    return {
      city,
      artistsCount,
      fansCount: artistFollows,
      venuesCount,
      eventsCount,
      revenue: revenueAggregate._sum.amount
        ? Number(revenueAggregate._sum.amount)
        : null,
      communityMembers,
    };
  }

  async listCityRecommendations(city: string, limit = 10) {
    const cityFilter = { equals: city, mode: 'insensitive' as const };
    const curator = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'curator',
    );

    const [venues, events, curators] = await Promise.all([
      this.prisma.client.venue.findMany({
        where: { city: cityFilter },
        take: limit,
        orderBy: { name: 'asc' },
        select: { id: true, name: true, city: true },
      }),
      this.prisma.client.event.findMany({
        where: { venue: { city: cityFilter }, startsAt: { gte: new Date() } },
        take: limit,
        orderBy: { startsAt: 'asc' },
        select: { id: true, title: true, startsAt: true },
      }),
      curator?.findMany
        ? (curator.findMany({
            where: { city: cityFilter },
            take: limit,
            orderBy: { name: 'asc' },
            select: { id: true, name: true, city: true },
          }) as Promise<Array<{ id: string; name: string; city: string | null }>>)
        : Promise.resolve([]),
    ]);

    return [venues, events, curators] as const;
  }

  countCommunityPostsSince(communityId: string, since: Date) {
    return this.prisma.client.communityPost.count({
      where: { communityId, publishedAt: { gte: since } },
    });
  }

  countActiveCommunityMembers(communityId: string, since: Date) {
    return this.prisma.client.communityPost.findMany({
      where: { communityId, publishedAt: { gte: since } },
      select: { authorId: true },
      distinct: ['authorId'],
    });
  }

  listCommunityMemberGenres(communityId: string) {
    return this.prisma.client.communityMember.findMany({
      where: { communityId },
      include: { person: { include: { profile: true } } },
      take: 200,
    });
  }

  listRecommendationCandidates(
    personId: string,
    entityType: 'Artist' | 'Event' | 'Community',
    limit = 20,
  ) {
    const candidateClient = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'recommendationCandidate',
    );
    if (!candidateClient?.findMany) return Promise.resolve([]);

    return candidateClient.findMany({
      where: {
        personId,
        entityType,
        OR: [{ expiresAt: null }, { expiresAt: { gte: new Date() } }],
      },
      orderBy: { score: 'desc' },
      take: limit,
    }) as Promise<
      Array<{ entityId: string; entityType: string; score: number }>
    >;
  }

  async resolveRecommendationTitles(
    entityType: 'Artist' | 'Event' | 'Community',
    entityIds: string[],
  ) {
    if (entityIds.length === 0) return new Map<string, string>();

    if (entityType === 'Artist') {
      const rows = await this.prisma.client.artist.findMany({
        where: { id: { in: entityIds } },
        select: { id: true, displayName: true, slug: true },
      });
      return new Map(
        rows.map((row) => [row.id, row.displayName ?? row.slug ?? row.id]),
      );
    }

    if (entityType === 'Event') {
      const rows = await this.prisma.client.event.findMany({
        where: { id: { in: entityIds } },
        select: { id: true, title: true },
      });
      return new Map(rows.map((row) => [row.id, row.title]));
    }

    const rows = await this.prisma.client.community.findMany({
      where: { id: { in: entityIds } },
      select: { id: true, name: true },
    });
    return new Map(rows.map((row) => [row.id, row.name]));
  }

  listEntityGraphEdges(entityType: GraphEntityType, entityId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        OR: [
          { sourceEntityType: entityType, sourceEntityId: entityId },
          { targetEntityType: entityType, targetEntityId: entityId },
        ],
      },
    });
  }

  async countPlatformMetrics(since: Date) {
    const citySnapshot = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'cityIntelligenceSnapshot',
    );

    return Promise.all([
      this.prisma.client.artistFollow.count({
        where: { followedAt: { gte: since } },
      }),
      this.prisma.client.communityMember.count({
        where: { joinedAt: { gte: since } },
      }),
      this.prisma.client.opportunity.count({
        where: { status: { in: ['open', 'pending', 'in_progress'] } },
      }),
      this.prisma.client.artist.count(),
      citySnapshot?.findMany
        ? (citySnapshot.findMany({
            orderBy: { snapshotDate: 'desc' },
            take: 20,
          }) as Promise<unknown[]>)
        : Promise.resolve([]),
      this.listArtistsWithMetrics(30),
    ]);
  }

  listTopCitySnapshots(limit = 12) {
    const citySnapshot = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'cityIntelligenceSnapshot',
    );
    if (!citySnapshot?.findMany) return Promise.resolve([]);
    return citySnapshot.findMany({
      orderBy: [{ snapshotDate: 'desc' }, { eventsCount: 'desc' }],
      take: limit,
    });
  }

  listCommunitiesForDashboard(limit = 20) {
    return this.prisma.client.community.findMany({
      take: limit,
      include: { _count: { select: { members: true } } },
      orderBy: { updatedAt: 'desc' },
    });
  }

  countCommunityMembersSince(communityId: string, since: Date) {
    return this.prisma.client.communityMember.count({
      where: { communityId, joinedAt: { gte: since } },
    });
  }

  aggregateRevenueSince(since: Date) {
    const revenueClient = optionalPrismaClient<OptionalModelClient>(
      this.prisma.client,
      'revenueTransaction',
    );
    if (!revenueClient?.aggregate) {
      return Promise.resolve({ _sum: { amount: null } });
    }
    return revenueClient.aggregate({
      where: { recordedAt: { gte: since } },
      _sum: { amount: true },
    });
  }

  listArtistsWithMetrics(limit = 50) {
    return this.prisma.client.artist.findMany({
      take: limit,
      orderBy: { updatedAt: 'desc' },
    });
  }
}

export function parseSnapshotScores(value: Prisma.JsonValue): AudienceSnapshotScores | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  if (typeof record.compositeScore !== 'number') return null;
  return record as AudienceSnapshotScores;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function maxDate(...values: Array<Date | null | undefined>): Date | null {
  const dates = values.filter((value): value is Date => value instanceof Date);
  if (dates.length === 0) return null;
  return dates.reduce((latest, current) => (current > latest ? current : latest));
}
