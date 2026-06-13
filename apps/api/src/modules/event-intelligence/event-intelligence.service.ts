import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { computeEventAnalysis, computeEventPrediction } from '@tsc/database';
import type {
  CityFanDensityPayload,
  ConversionLeadersPayload,
  EventIntelligencePredictPayload,
  EventIntelligenceRecommendationsPayload,
  EventIntelligenceRefreshPayload,
  EventIntelligenceSnapshotPayload,
  RepeatAttendancePayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import { canManageArtist } from '@tsc/permissions';
import { EventIntelligenceRepository } from './event-intelligence.repository';
import { EventRepository } from '../event/event.repository';

@Injectable()
export class EventIntelligenceService {
  constructor(
    private readonly repository: EventIntelligenceRepository,
    private readonly eventRepository: EventRepository,
  ) {}

  async getIntelligence(eventId: string): Promise<EventIntelligenceSnapshotPayload> {
    await this.requireEvent(eventId);

    const cached = await this.repository.findLatestSnapshot(eventId);
    const live = await this.computeLiveMetrics(eventId);

    if (cached) {
      const parsed = EventIntelligenceRepository.parseSnapshotRow(cached);
      return {
        ...parsed,
        ...this.mergeLiveIntoSnapshot(parsed, live),
        live: true,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      ...live,
      live: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async getPredict(eventId: string): Promise<EventIntelligencePredictPayload> {
    await this.requireEvent(eventId);
    const factors = await this.repository.buildFactorInput(eventId);
    if (!factors) throw new NotFoundException(`Event ${eventId} not found`);

    const prediction = computeEventPrediction({
      venueCapacity: factors.venueCapacity,
      artistFanCount: factors.artistFanCount,
      communityMemberCount: factors.communityMemberCount,
      cityHistoricalAvgAttendance: factors.cityHistoricalAvgAttendance,
      currentRegistrations: factors.registeredCount,
      ticketSupportCount: factors.ticketSupportCount,
      ticketSupportAmount: factors.ticketSupportAmount,
      membershipSupportAmount: factors.membershipSupportAmount,
    });

    return {
      eventId,
      predictedAttendance: prediction.predictedAttendance,
      predictedRevenueStub: prediction.predictedRevenueStub,
      factors: prediction.factors,
      updatedAt: new Date().toISOString(),
    };
  }

  async refreshIntelligence(
    eventId: string,
    ctx: MembershipContext,
  ): Promise<EventIntelligenceRefreshPayload> {
    const event = await this.requireEvent(eventId);
    this.assertCanManage(eventId, ctx, event.artistId);

    const previous = await this.repository.findLatestSnapshot(eventId);
    const payload = await this.computeAndPersist(eventId);

    return {
      ...payload,
      previousSnapshotDate: previous?.snapshotDate.toISOString() ?? null,
      recomputed: true,
    };
  }

  async getRecommendations(eventId: string): Promise<EventIntelligenceRecommendationsPayload> {
    const event = await this.requireEvent(eventId);
    const city = event.city ?? event.venue?.city ?? null;

    const [venues, partners, edges, cityDensity] = await Promise.all([
      this.repository.listRecommendationVenues(city, 5),
      this.repository.listRecommendationPartners(event.artistId, 5),
      this.repository.listGraphEdges('Event', eventId),
      this.repository.participantCityDensity(eventId),
    ]);

    const topCities = Object.entries(cityDensity)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count], index) => ({
        entityType: 'City' as const,
        entityId: name,
        title: name,
        reason: `${count} attendee fan profile(s) in city`,
        score: Math.round((count * 10 - index) * 100) / 100,
      }));

    if (topCities.length === 0 && city) {
      topCities.push({
        entityType: 'City',
        entityId: city,
        title: city,
        reason: 'Event host city from graph',
        score: 50,
      });
    }

    const venueRecs = venues.map((venue, index) => ({
      entityType: 'Venue' as const,
      entityId: venue.id,
      title: venue.name,
      reason: venue.city ? `Venue in ${venue.city}` : 'Venue in artist network',
      score: Math.round((60 - index * 3 + (venue.capacity ?? 0) / 100) * 100) / 100,
    }));

    const partnerRecs = partners.map((partner, index) => ({
      entityType: 'Partner' as const,
      entityId: partner.id,
      title: partner.name,
      reason: `${partner._count.members} community members — co-promotion stub`,
      score: Math.round((55 - index * 4 + partner._count.members / 20) * 100) / 100,
    }));

    for (const edge of edges.slice(0, 3)) {
      const isSource = edge.sourceEntityId === eventId;
      const entityType = isSource ? edge.targetEntityType : edge.sourceEntityType;
      const entityId = isSource ? edge.targetEntityId : edge.sourceEntityId;
      if (entityType === 'Community' || entityType === 'Venue') {
        partnerRecs.push({
          entityType: 'Partner',
          entityId,
          title: `${entityType} ${entityId.slice(0, 8)}`,
          reason: `Graph edge ${edge.relationshipType}`,
          score: 40,
        });
      }
    }

    return {
      eventId,
      cities: topCities,
      venues: venueRecs,
      partners: partnerRecs.slice(0, 8),
      updatedAt: new Date().toISOString(),
    };
  }

  async getCityInsights(limit: number): Promise<CityFanDensityPayload> {
    const cities = await this.repository.listCityFanDensity(limit);
    return {
      cities: cities.map((row) => ({
        ...row,
        densityScore: Math.round(row.densityScore * 100) / 100,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async getConversionLeaders(limit: number): Promise<ConversionLeadersPayload> {
    const artists = await this.repository.listConversionLeaders(limit);
    return { artists, updatedAt: new Date().toISOString() };
  }

  async getRepeatAttendance(limit: number): Promise<RepeatAttendancePayload> {
    const communities = await this.repository.listRepeatAttendanceCommunities(limit);
    return { communities, updatedAt: new Date().toISOString() };
  }

  private async computeLiveMetrics(eventId: string): Promise<EventIntelligenceSnapshotPayload> {
    const factors = await this.repository.buildFactorInput(eventId);
    if (!factors) throw new NotFoundException(`Event ${eventId} not found`);

    const prediction = computeEventPrediction({
      venueCapacity: factors.venueCapacity,
      artistFanCount: factors.artistFanCount,
      communityMemberCount: factors.communityMemberCount,
      cityHistoricalAvgAttendance: factors.cityHistoricalAvgAttendance,
      currentRegistrations: factors.registeredCount,
      ticketSupportCount: factors.ticketSupportCount,
      ticketSupportAmount: factors.ticketSupportAmount,
      membershipSupportAmount: factors.membershipSupportAmount,
    });

    const analysis = computeEventAnalysis({
      registeredCount: factors.registeredCount,
      checkedInCount: factors.checkedInCount,
      newArtistFollows: factors.newArtistFollows,
      newPersonFollows: factors.newPersonFollows,
      communityJoinsPostEvent: factors.communityJoinsPostEvent,
      ticketSupportCount: factors.ticketSupportCount,
      ticketSupportAmount: factors.ticketSupportAmount,
      membershipSupportAmount: factors.membershipSupportAmount,
      participantCities: factors.participantCities,
    });

    return {
      eventId,
      snapshotDate: new Date().toISOString(),
      predictedAttendance: prediction.predictedAttendance,
      actualAttendance: analysis.actualAttendance,
      predictedRevenueStub: prediction.predictedRevenueStub,
      actualRevenueStub: analysis.actualRevenueStub,
      conversionRate: analysis.conversionRate,
      audienceGrowthImpact: analysis.audienceGrowthImpact,
      communityImpact: analysis.communityImpact,
      fanDensityByCity: analysis.fanDensityByCity,
      metrics: {
        ...analysis.metrics,
        predictionFactors: prediction.factors,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  private async computeAndPersist(eventId: string): Promise<EventIntelligenceSnapshotPayload> {
    const live = await this.computeLiveMetrics(eventId);
    const row = await this.repository.upsertSnapshot(eventId, {
      predictedAttendance: live.predictedAttendance,
      actualAttendance: live.actualAttendance,
      predictedRevenueStub: live.predictedRevenueStub,
      actualRevenueStub: live.actualRevenueStub,
      conversionRate: live.conversionRate,
      audienceGrowthImpact: live.audienceGrowthImpact,
      communityImpact: live.communityImpact,
      fanDensityByCity: live.fanDensityByCity,
      metrics: live.metrics,
    });

    if (!row) {
      throw new ServiceUnavailableException(
        'EventIntelligenceSnapshot model unavailable — run phase8-step7 migration',
      );
    }

    const parsed = EventIntelligenceRepository.parseSnapshotRow(row);
    return {
      ...parsed,
      live: false,
      updatedAt: new Date().toISOString(),
    };
  }

  private mergeLiveIntoSnapshot(
    cached: Omit<EventIntelligenceSnapshotPayload, 'live' | 'updatedAt'>,
    live: EventIntelligenceSnapshotPayload,
  ): Partial<EventIntelligenceSnapshotPayload> {
    return {
      actualAttendance: live.actualAttendance,
      actualRevenueStub: live.actualRevenueStub,
      conversionRate: live.conversionRate,
      audienceGrowthImpact: live.audienceGrowthImpact,
      communityImpact: live.communityImpact,
      fanDensityByCity: live.fanDensityByCity,
      metrics: { ...cached.metrics, live: live.metrics },
    };
  }

  private async requireEvent(eventId: string) {
    const event = await this.eventRepository.findEvent(eventId);
    if (!event) throw new NotFoundException(`Event ${eventId} not found`);
    return event;
  }

  private async assertCanManage(
    eventId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.eventRepository.personOrganizesEvent(eventId, ctx.userId)) return;
    throw new ForbiddenException('Admin or event organizer access required');
  }
}
