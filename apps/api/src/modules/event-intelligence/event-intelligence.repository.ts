import { Injectable } from '@nestjs/common';
import {
  DEFAULT_VENUE_CAPACITY,
  EVENT_INTELLIGENCE_POST_WINDOW_DAYS,
  type GraphEntityType,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';

type SnapshotRow = {
  id: string;
  eventId: string;
  snapshotDate: Date;
  predictedAttendance: number | null;
  actualAttendance: number;
  predictedRevenueStub: number | null;
  actualRevenueStub: number;
  conversionRate: number;
  audienceGrowthImpact: number;
  communityImpact: number;
  fanDensityByCity: unknown;
  metrics: unknown;
  createdAt: Date;
};

type SnapshotClient = {
  findFirst: (args: unknown) => Promise<SnapshotRow | null>;
  upsert: (args: unknown) => Promise<SnapshotRow>;
  findMany: (args: unknown) => Promise<SnapshotRow[]>;
};

function startOfUtcDay(date = new Date()): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysAfter(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function parseCityMap(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, number> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (typeof val === 'number') out[key] = val;
  }
  return out;
}

@Injectable()
export class EventIntelligenceRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get snapshotClient(): SnapshotClient | null {
    return (this.prisma.client as unknown as { eventIntelligenceSnapshot?: SnapshotClient })
      .eventIntelligenceSnapshot ?? null;
  }

  findEvent(eventId: string) {
    return this.prisma.client.event.findUnique({
      where: { id: eventId },
      include: {
        venue: { select: { id: true, name: true, city: true, capacity: true } },
        artist: { select: { id: true, displayName: true, slug: true } },
      },
    });
  }

  findLatestSnapshot(eventId: string) {
    const client = this.snapshotClient;
    if (!client) return Promise.resolve(null);
    return client.findFirst({
      where: { eventId },
      orderBy: { snapshotDate: 'desc' },
    });
  }

  upsertSnapshot(
    eventId: string,
    data: {
      predictedAttendance?: number | null;
      actualAttendance: number;
      predictedRevenueStub?: number | null;
      actualRevenueStub: number;
      conversionRate: number;
      audienceGrowthImpact: number;
      communityImpact: number;
      fanDensityByCity: Record<string, number>;
      metrics: Record<string, unknown>;
    },
  ) {
    const client = this.snapshotClient;
    if (!client) return Promise.resolve(null);
    const snapshotDate = startOfUtcDay();
    return client.upsert({
      where: { eventId_snapshotDate: { eventId, snapshotDate } },
      create: {
        id: newId(),
        eventId,
        snapshotDate,
        predictedAttendance: data.predictedAttendance ?? null,
        actualAttendance: data.actualAttendance,
        predictedRevenueStub: data.predictedRevenueStub ?? null,
        actualRevenueStub: data.actualRevenueStub,
        conversionRate: data.conversionRate,
        audienceGrowthImpact: data.audienceGrowthImpact,
        communityImpact: data.communityImpact,
        fanDensityByCity: toInputJson(data.fanDensityByCity),
        metrics: toInputJson(data.metrics),
      },
      update: {
        predictedAttendance: data.predictedAttendance ?? null,
        actualAttendance: data.actualAttendance,
        predictedRevenueStub: data.predictedRevenueStub ?? null,
        actualRevenueStub: data.actualRevenueStub,
        conversionRate: data.conversionRate,
        audienceGrowthImpact: data.audienceGrowthImpact,
        communityImpact: data.communityImpact,
        fanDensityByCity: toInputJson(data.fanDensityByCity),
        metrics: toInputJson(data.metrics),
      },
    });
  }

  async buildFactorInput(eventId: string) {
    const event = await this.findEvent(eventId);
    if (!event) return null;

    const venueCapacity = event.venue?.capacity ?? DEFAULT_VENUE_CAPACITY;
    const artistId = event.artistId;
    const city = event.city ?? event.venue?.city ?? null;
    const windowEnd = daysAfter(event.startsAt, EVENT_INTELLIGENCE_POST_WINDOW_DAYS);

    const [
      registeredCount,
      checkedInCount,
      artistFanCount,
      communityMemberCount,
      cityHistoricalAvgAttendance,
      ticketSupport,
      membershipSupport,
      newArtistFollows,
      newPersonFollows,
      communityJoinsPostEvent,
      participantCities,
    ] = await Promise.all([
      this.countParticipations(eventId, ['registered', 'checked_in']),
      this.countParticipations(eventId, ['checked_in']),
      artistId ? this.countArtistFollows(artistId) : Promise.resolve(0),
      artistId ? this.countArtistCommunityMembers(artistId) : Promise.resolve(0),
      city ? this.avgCityCheckIns(city, eventId) : Promise.resolve(0),
      this.sumEventTicketSupport(eventId),
      artistId ? this.sumArtistMembershipSupport(artistId) : Promise.resolve({ count: 0, amount: 0 }),
      artistId
        ? this.countArtistFollowsSince(artistId, event.startsAt, windowEnd)
        : Promise.resolve(0),
      artistId
        ? this.countPersonFollowsToArtistSince(artistId, event.startsAt, windowEnd)
        : Promise.resolve(0),
      artistId
        ? this.countCommunityJoinsSince(artistId, event.startsAt, windowEnd)
        : Promise.resolve(0),
      this.participantCityDensity(eventId),
    ]);

    return {
      event,
      venueCapacity,
      artistFanCount,
      communityMemberCount,
      cityHistoricalAvgAttendance,
      registeredCount,
      checkedInCount,
      ticketSupportCount: ticketSupport.count,
      ticketSupportAmount: ticketSupport.amount,
      membershipSupportAmount: membershipSupport.amount,
      newArtistFollows,
      newPersonFollows,
      communityJoinsPostEvent,
      participantCities,
    };
  }

  countParticipations(eventId: string, statuses: Array<'registered' | 'checked_in'>) {
    return this.prisma.client.eventParticipation.count({
      where: { eventId, status: { in: statuses } },
    });
  }

  countArtistFollows(artistId: string) {
    return this.prisma.client.artistFollow.count({ where: { artistId } });
  }

  countArtistCommunityMembers(artistId: string) {
    return this.prisma.client.communityMember.count({
      where: {
        status: 'active',
        community: { artistId },
      },
    });
  }

  async avgCityCheckIns(city: string, excludeEventId: string) {
    const events = await this.prisma.client.event.findMany({
      where: { city, id: { not: excludeEventId }, startsAt: { lt: new Date() } },
      select: { id: true },
      take: 20,
    });
    if (events.length === 0) return 0;
    const counts = await Promise.all(
      events.map((row) => this.countParticipations(row.id, ['checked_in'])),
    );
    return counts.reduce((sum, n) => sum + n, 0) / events.length;
  }

  async sumEventTicketSupport(eventId: string) {
    const rows = await this.prisma.client.supportAction.findMany({
      where: {
        targetType: 'Event',
        targetId: eventId,
        actionType: 'buy_ticket',
        status: 'recorded',
      },
      select: { amount: true },
    });
    return {
      count: rows.length,
      amount: rows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    };
  }

  async sumArtistMembershipSupport(artistId: string) {
    const communities = await this.prisma.client.community.findMany({
      where: { artistId },
      select: { id: true },
    });
    if (communities.length === 0) return { count: 0, amount: 0 };
    const rows = await this.prisma.client.supportAction.findMany({
      where: {
        targetType: 'Community',
        targetId: { in: communities.map((c) => c.id) },
        actionType: 'buy_membership',
        status: 'recorded',
      },
      select: { amount: true },
    });
    return {
      count: rows.length,
      amount: rows.reduce((sum, row) => sum + (row.amount ?? 0), 0),
    };
  }

  countArtistFollowsSince(artistId: string, from: Date, to: Date) {
    return this.prisma.client.artistFollow.count({
      where: { artistId, followedAt: { gte: from, lte: to } },
    });
  }

  async countPersonFollowsToArtistSince(artistId: string, from: Date, to: Date) {
    const artist = await this.prisma.client.artist.findUnique({
      where: { id: artistId },
      select: { personId: true },
    });
    if (!artist?.personId) return 0;
    return this.prisma.client.personFollow.count({
      where: {
        followingPersonId: artist.personId,
        createdAt: { gte: from, lte: to },
      },
    });
  }

  countCommunityJoinsSince(artistId: string, from: Date, to: Date) {
    return this.prisma.client.communityMember.count({
      where: {
        status: 'active',
        joinedAt: { gte: from, lte: to },
        community: { artistId },
      },
    });
  }

  async participantCityDensity(eventId: string): Promise<Record<string, number>> {
    const rows = await this.prisma.client.eventParticipation.findMany({
      where: { eventId, status: { in: ['registered', 'checked_in'] } },
      include: {
        person: {
          select: {
            fanProfile: { select: { cities: true } },
          },
        },
      },
    });
    const density: Record<string, number> = {};
    for (const row of rows) {
      const cities = row.person.fanProfile?.cities ?? [];
      for (const city of cities) {
        if (!city?.trim()) continue;
        density[city] = (density[city] ?? 0) + 1;
      }
    }
    return density;
  }

  async listCityFanDensity(limit: number) {
    const [profiles, events] = await Promise.all([
      this.prisma.client.fanProfile.findMany({
        select: { cities: true },
        take: 5000,
      }),
      this.prisma.client.event.groupBy({
        by: ['city'],
        where: { city: { not: null } },
        _count: { id: true },
      }),
    ]);

    const fanByCity = new Map<string, number>();
    for (const profile of profiles) {
      for (const city of profile.cities) {
        if (!city?.trim()) continue;
        fanByCity.set(city, (fanByCity.get(city) ?? 0) + 1);
      }
    }

    const eventByCity = new Map<string, number>();
    for (const row of events) {
      if (row.city) eventByCity.set(row.city, row._count.id);
    }

    const cities = new Set([...fanByCity.keys(), ...eventByCity.keys()]);
    return [...cities]
      .map((city) => {
        const fanCount = fanByCity.get(city) ?? 0;
        const eventCount = eventByCity.get(city) ?? 0;
        const densityScore = fanCount * 0.7 + eventCount * 3;
        return { city, fanCount, eventCount, densityScore };
      })
      .sort((a, b) => b.densityScore - a.densityScore)
      .slice(0, limit);
  }

  async listConversionLeaders(limit: number) {
    const artists = await this.prisma.client.artist.findMany({
      select: { id: true, displayName: true, slug: true, events: { select: { id: true } } },
      take: 100,
    });

    const leaders = await Promise.all(
      artists.map(async (artist) => {
        if (artist.events.length === 0) return null;
        let totalConversion = 0;
        let measured = 0;
        for (const event of artist.events) {
          const [registered, checkedIn] = await Promise.all([
            this.countParticipations(event.id, ['registered', 'checked_in']),
            this.countParticipations(event.id, ['checked_in']),
          ]);
          if (registered > 0) {
            totalConversion += (checkedIn / registered) * 100;
            measured += 1;
          }
        }
        if (measured === 0) return null;
        return {
          artistId: artist.id,
          name: artist.displayName ?? artist.slug ?? artist.id,
          slug: artist.slug,
          avgConversionRate: Math.round((totalConversion / measured) * 100) / 100,
          eventCount: artist.events.length,
        };
      }),
    );

    return leaders
      .filter((row): row is NonNullable<typeof row> => row !== null)
      .sort((a, b) => b.avgConversionRate - a.avgConversionRate)
      .slice(0, limit);
  }

  async listRepeatAttendanceCommunities(limit: number) {
    const communities = await this.prisma.client.community.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        artistId: true,
        members: { where: { status: 'active' }, select: { personId: true } },
      },
      take: 50,
    });

    const results = await Promise.all(
      communities.map(async (community) => {
        if (!community.artistId || community.members.length === 0) return null;
        const memberIds = community.members.map((m) => m.personId);
        const artistEvents = await this.prisma.client.event.findMany({
          where: { artistId: community.artistId },
          select: { id: true },
        });
        if (artistEvents.length < 2) return null;

        const eventIds = artistEvents.map((e) => e.id);
        const participations = await this.prisma.client.eventParticipation.groupBy({
          by: ['personId'],
          where: {
            eventId: { in: eventIds },
            personId: { in: memberIds },
            status: { in: ['registered', 'checked_in'] },
          },
          _count: { eventId: true },
        });

        const repeatAttendeeCount = participations.filter((row) => row._count.eventId >= 2).length;
        const repeatRate =
          community.members.length > 0
            ? Math.round((repeatAttendeeCount / community.members.length) * 10000) / 100
            : 0;

        return {
          communityId: community.id,
          name: community.name,
          slug: community.slug,
          repeatAttendeeCount,
          totalEvents: artistEvents.length,
          repeatRate,
        };
      }),
    );

    return results
      .filter((row): row is NonNullable<typeof row> => row !== null && row.repeatAttendeeCount > 0)
      .sort((a, b) => b.repeatRate - a.repeatRate || b.repeatAttendeeCount - a.repeatAttendeeCount)
      .slice(0, limit);
  }

  async listRecommendationVenues(city: string | null, limit: number) {
    return this.prisma.client.venue.findMany({
      where: city ? { city } : undefined,
      select: { id: true, name: true, city: true, capacity: true },
      take: limit,
      orderBy: { name: 'asc' },
    });
  }

  async listRecommendationPartners(artistId: string | null, limit: number) {
    if (!artistId) return [];
    const communities = await this.prisma.client.community.findMany({
      where: { artistId },
      select: { id: true, name: true, slug: true, _count: { select: { members: true } } },
      orderBy: { members: { _count: 'desc' } },
      take: limit,
    });
    return communities;
  }

  async listGraphEdges(entityType: GraphEntityType, entityId: string) {
    return this.prisma.client.relationship.findMany({
      where: {
        OR: [
          { sourceEntityType: entityType, sourceEntityId: entityId, effectiveTo: null },
          { targetEntityType: entityType, targetEntityId: entityId, effectiveTo: null },
        ],
      },
      take: 30,
    });
  }

  static parseSnapshotRow(row: SnapshotRow) {
    return {
      eventId: row.eventId,
      snapshotDate: row.snapshotDate.toISOString(),
      predictedAttendance: row.predictedAttendance,
      actualAttendance: row.actualAttendance,
      predictedRevenueStub: row.predictedRevenueStub,
      actualRevenueStub: row.actualRevenueStub,
      conversionRate: row.conversionRate,
      audienceGrowthImpact: row.audienceGrowthImpact,
      communityImpact: row.communityImpact,
      fanDensityByCity: parseCityMap(row.fanDensityByCity),
      metrics:
        row.metrics && typeof row.metrics === 'object' && !Array.isArray(row.metrics)
          ? (row.metrics as Record<string, unknown>)
          : {},
    };
  }
}

export { parseCityMap };
