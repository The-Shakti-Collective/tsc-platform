import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { EVENT_AGENT_SLUG } from '@tsc/database';
import type {
  EventAgentAnalysisSummary,
  EventAgentInsightsPayload,
  EventAgentPhase,
  EventAgentPredictSummary,
  EventAgentRunPayload,
  EventSuggestionApprovePayload,
  EventSuggestionDismissPayload,
  EventSuggestionType,
} from '@tsc/types';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import type { AgentRecommendationsQuery, EventAgentRunInput } from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { EventIntelligenceService } from '../event-intelligence/event-intelligence.service';
import { EventRepository } from '../event/event.repository';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';

type ScoredEventSuggestion = {
  suggestionType: EventSuggestionType;
  title: string;
  rationale: string;
  score: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  metadata: Record<string, unknown>;
  reasonCodes: string[];
};

@Injectable()
export class EventAgentService {
  private readonly logger = new Logger(EventAgentService.name);

  constructor(
    private readonly repository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
    private readonly eventIntelligence: EventIntelligenceService,
    private readonly eventRepository: EventRepository,
  ) {}

  async run(
    eventId: string,
    input: EventAgentRunInput,
    ctx: MembershipContext,
  ): Promise<EventAgentRunPayload> {
    this.assertAvailable();

    const event = await this.requireEvent(eventId);
    await this.assertCanManage(eventId, ctx, event.artist?.id ?? null);

    const phase = resolvePhase(event.startsAt);
    const agent = await this.repository.ensureEventAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Event agent unavailable');
    }

    const task = await this.repository.createTask(agent.id, {
      eventId,
      phase,
      limit: input.limit,
    });

    try {
      const context = await this.buildEventContext(eventId, phase, event);
      const candidates = this.scoreSuggestions(context, phase, input.limit);
      const actorPersonId = ctx.personId ?? ctx.userId ?? null;

      const items = [];
      let decisionsCreated = 0;

      for (const suggestion of candidates) {
        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId: agent.id,
            targetArtistId: event.artist?.id ?? undefined,
            title: suggestion.title,
            rationale: suggestion.rationale,
            score: suggestion.score,
            confidence: suggestion.confidence,
            status: 'active',
            metadata: {
              eventId,
              phase,
              suggestionType: suggestion.suggestionType,
              priority: suggestion.priority,
              reasonCodes: suggestion.reasonCodes,
              source: 'event_agent_v1',
              ...suggestion.metadata,
            },
          },
          null,
        );

        await this.decisionEngine.recordDecision({
          agentId: agent.id,
          entityType: 'Event',
          entityId: eventId,
          decisionType: 'event_suggestion',
          payload: {
            recommendationId: recommendation.id,
            eventId,
            phase,
            suggestionType: suggestion.suggestionType,
            title: suggestion.title,
            priority: suggestion.priority,
            ...suggestion.metadata,
          },
          confidence: suggestion.confidence,
          status: 'pending',
        });
        decisionsCreated += 1;
        items.push(recommendation);
      }

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          recommendationsCreated: items.length,
          decisionsCreated,
          eventId,
          phase,
        });
      }

      if (actorPersonId) {
        await this.activityService.recordInternal({
          actorPersonId,
          action: 'event_agent_insights_generated',
          targetType: 'Event',
          targetId: eventId,
          metadata: {
            eventId,
            agentId: agent.id,
            taskId: task?.id ?? null,
            phase,
            count: items.length,
          },
          visibility: 'private',
        });
      }

      return {
        eventId,
        phase,
        taskId: task?.id ?? 'stub-task',
        recommendationsCreated: items.length,
        decisionsCreated,
        items,
        updatedAt: new Date().toISOString(),
      };
    } catch (error) {
      if (task) {
        await this.repository.completeTask(task.id, 'failed', {
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
      throw error;
    }
  }

  async getInsights(
    eventId: string,
    query: AgentRecommendationsQuery,
    ctx: MembershipContext,
  ): Promise<EventAgentInsightsPayload> {
    this.assertAvailable();

    const event = await this.requireEvent(eventId);
    await this.assertCanManage(eventId, ctx, event.artist?.id ?? null);

    const phase = resolvePhase(event.startsAt);
    const agent = await this.repository.ensureEventAgent();

    const [intelligence, intelligenceRecommendations, rows, lastTask] = await Promise.all([
      this.eventIntelligence.getIntelligence(eventId),
      this.eventIntelligence.getRecommendations(eventId),
      this.repository.listRecommendationsForEvent(
        eventId,
        query.limit,
        query.status ?? 'active',
        EVENT_AGENT_SLUG,
      ),
      agent ? this.repository.findLatestEventTask(agent.id) : Promise.resolve(null),
    ]);

    const predictions =
      phase === 'pre'
        ? await this.eventIntelligence.getPredict(eventId).then(toPredictSummary)
        : toPredictFromSnapshot(intelligence);
    const analysis = toAnalysisSummary(intelligence);

    return {
      eventId,
      phase,
      eventStartsAt: event.startsAt?.toISOString() ?? null,
      predictions,
      analysis,
      intelligenceRecommendations: {
        cities: intelligenceRecommendations.cities,
        venues: intelligenceRecommendations.venues,
        partners: intelligenceRecommendations.partners,
      },
      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async approveSuggestion(
    id: string,
    ctx: MembershipContext,
  ): Promise<EventSuggestionApprovePayload> {
    this.assertAvailable();

    const existing = await this.repository.findRecommendation(id);
    if (!existing) throw new NotFoundException(`Event suggestion ${id} not found`);
    if (existing.agent?.slug !== EVENT_AGENT_SLUG) {
      throw new NotFoundException(`Recommendation ${id} is not an event suggestion`);
    }

    const metadata = parseMetadata(existing.metadata);
    const eventId = typeof metadata.eventId === 'string' ? metadata.eventId : null;
    if (!eventId) {
      throw new NotFoundException(`Event suggestion ${id} has no event target`);
    }

    const event = await this.requireEvent(eventId);
    await this.assertCanManage(eventId, ctx, event.artist?.id ?? null);

    const decision = await this.repository.findPendingDecisionForRecommendation(id);
    const suggestionType = metadata.suggestionType as EventSuggestionType | undefined;
    const executedStub = this.stubExecuteSuggestion(suggestionType, metadata);

    if (decision) {
      await this.repository.updateDecisionStatus(decision.id, 'approved');
      await this.repository.updateDecisionStatus(decision.id, 'executed');
    }

    const row = await this.repository.updateRecommendationStatus(id, 'applied');
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'event_suggestion_approved',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          recommendationId: row.id,
          eventId,
          suggestionType: suggestionType ?? null,
          title: row.title,
          executedStub,
        },
        visibility: 'private',
      });
    }

    this.logger.log(
      `Event suggestion approved: id=${id} type=${suggestionType ?? 'unknown'} stub=${executedStub}`,
    );

    return {
      id: row.id,
      status: 'applied',
      decisionStatus: 'executed',
      executedStub,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async dismissSuggestion(
    id: string,
    ctx: MembershipContext,
  ): Promise<EventSuggestionDismissPayload> {
    this.assertAvailable();

    const existing = await this.repository.findRecommendation(id);
    if (!existing) throw new NotFoundException(`Event suggestion ${id} not found`);
    if (existing.agent?.slug !== EVENT_AGENT_SLUG) {
      throw new NotFoundException(`Recommendation ${id} is not an event suggestion`);
    }

    const metadata = parseMetadata(existing.metadata);
    const eventId = typeof metadata.eventId === 'string' ? metadata.eventId : null;
    if (!eventId) {
      throw new NotFoundException(`Event suggestion ${id} has no event target`);
    }

    const event = await this.requireEvent(eventId);
    await this.assertCanManage(eventId, ctx, event.artist?.id ?? null);

    const decision = await this.repository.findPendingDecisionForRecommendation(id);
    if (decision) {
      await this.repository.updateDecisionStatus(decision.id, 'rejected');
    }

    const row = await this.repository.updateRecommendationStatus(id, 'dismissed');
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'event_suggestion_dismissed',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          recommendationId: row.id,
          eventId,
          suggestionType: metadata.suggestionType ?? null,
          title: row.title,
        },
        visibility: 'private',
      });
    }

    return {
      id: row.id,
      status: 'dismissed',
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async buildEventContext(
    eventId: string,
    phase: EventAgentPhase,
    event: NonNullable<Awaited<ReturnType<AgentsRepository['findEvent']>>>,
  ) {
    const [predict, intelligence, recommendations] = await Promise.all([
      this.eventIntelligence.getPredict(eventId),
      this.eventIntelligence.getIntelligence(eventId),
      this.eventIntelligence.getRecommendations(eventId),
    ]);

    return {
      eventId,
      phase,
      eventTitle: event.title ?? 'Event',
      venueName: event.venue?.name ?? null,
      venueId: event.venue?.id ?? null,
      city: event.city ?? event.venue?.city ?? null,
      venueCapacity: event.venue?.capacity ?? predict.factors.venueCapacity ?? 300,
      predict,
      intelligence,
      recommendations,
    };
  }

  private scoreSuggestions(
    context: Awaited<ReturnType<EventAgentService['buildEventContext']>>,
    phase: EventAgentPhase,
    limit: number,
  ): ScoredEventSuggestion[] {
    const candidates =
      phase === 'pre'
        ? this.scorePreEventSuggestions(context)
        : this.scorePostEventSuggestions(context);

    return candidates.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  private scorePreEventSuggestions(
    context: Awaited<ReturnType<EventAgentService['buildEventContext']>>,
  ): ScoredEventSuggestion[] {
    const suggestions: ScoredEventSuggestion[] = [];
    const { predict, recommendations } = context;
    const registrations = predict.factors.currentRegistrations ?? 0;
    const predicted = predict.predictedAttendance;
    const capacity = context.venueCapacity;
    const fillRatio = predicted / Math.max(1, capacity);
    const registrationGap = predicted > 0 ? registrations / predicted : 1;

    if (registrationGap < 0.55) {
      suggestions.push({
        suggestionType: 'optimize_marketing',
        title: 'Boost marketing to close attendance gap',
        rationale: `${registrations} registrations vs ${Math.round(predicted)} predicted — ramp social, community drops, and retargeting before show day.`,
        score: Math.min(90, 60 + Math.round((1 - registrationGap) * 35)),
        confidence: Math.min(0.88, 0.55 + (1 - registrationGap) * 0.3),
        priority: registrationGap < 0.35 ? 'high' : 'medium',
        metadata: {
          eventId: context.eventId,
          currentRegistrations: registrations,
          predictedAttendance: predicted,
          predictedRevenueStub: predict.predictedRevenueStub,
        },
        reasonCodes: ['registration_gap', 'pre_event_marketing'],
      });
    }

    if (fillRatio >= 0.82) {
      suggestions.push({
        suggestionType: 'adjust_capacity',
        title: 'Review capacity and overflow plan',
        rationale: `Forecast ${Math.round(predicted)} attendees (${Math.round(fillRatio * 100)}% of ${capacity} capacity) — consider waitlist, second room, or venue swap.`,
        score: Math.min(88, 58 + Math.round(fillRatio * 30)),
        confidence: 0.72,
        priority: fillRatio >= 0.95 ? 'high' : 'medium',
        metadata: {
          eventId: context.eventId,
          venueCapacity: capacity,
          predictedAttendance: predicted,
          fillRatio: Math.round(fillRatio * 100) / 100,
        },
        reasonCodes: ['capacity_pressure', 'attendance_forecast'],
      });
    }

    const topPartner = recommendations.partners[0];
    const topVenue = recommendations.venues[0];
    const partnerTarget = topPartner ?? topVenue;
    if (partnerTarget) {
      suggestions.push({
        suggestionType: 'partner_venue',
        title: `Partner with ${partnerTarget.title}`,
        rationale: `${partnerTarget.reason} — co-promote to lift pre-sale momentum.`,
        score: Math.min(82, Math.round(partnerTarget.score)),
        confidence: 0.65,
        priority: 'medium',
        metadata: {
          eventId: context.eventId,
          entityType: partnerTarget.entityType,
          entityId: partnerTarget.entityId,
          entityTitle: partnerTarget.title,
        },
        reasonCodes: ['graph_recommendation', 'co_promotion'],
      });
    }

    return suggestions;
  }

  private scorePostEventSuggestions(
    context: Awaited<ReturnType<EventAgentService['buildEventContext']>>,
  ): ScoredEventSuggestion[] {
    const suggestions: ScoredEventSuggestion[] = [];
    const { intelligence, recommendations } = context;
    const conversion = intelligence.conversionRate;
    const audienceGrowth = intelligence.audienceGrowthImpact;
    const communityImpact = intelligence.communityImpact;

    const topCityEntry = Object.entries(intelligence.fanDensityByCity ?? {})
      .sort((a, b) => b[1] - a[1])[0];
    const topCity = topCityEntry?.[0] ?? context.city ?? recommendations.cities[0]?.title;

    if (conversion >= 65 && topCity) {
      suggestions.push({
        suggestionType: 'repeat_in_city',
        title: `Repeat show in ${topCity}`,
        rationale: `${conversion.toFixed(1)}% conversion with strong fan density in ${topCity} — book a follow-up date while momentum is high.`,
        score: Math.min(92, 55 + Math.round(conversion * 0.35)),
        confidence: Math.min(0.9, 0.5 + conversion / 200),
        priority: conversion >= 80 ? 'high' : 'medium',
        metadata: {
          eventId: context.eventId,
          city: topCity,
          conversionRate: conversion,
          fanDensity: topCityEntry?.[1] ?? null,
        },
        reasonCodes: ['high_conversion', 'city_density'],
      });
    }

    if (conversion >= 70 && context.venueName) {
      suggestions.push({
        suggestionType: 'book_venue_again',
        title: `Rebook ${context.venueName}`,
        rationale: `${conversion.toFixed(1)}% check-in conversion at ${context.venueName} — venue fit validated for encore.`,
        score: Math.min(86, 50 + Math.round(conversion * 0.4)),
        confidence: 0.7,
        priority: 'medium',
        metadata: {
          eventId: context.eventId,
          venueId: context.venueId,
          venueName: context.venueName,
          conversionRate: conversion,
        },
        reasonCodes: ['venue_fit', 'repeat_booking'],
      });
    }

    if (communityImpact >= 8 || audienceGrowth >= 12) {
      suggestions.push({
        suggestionType: 'expand_community',
        title: 'Expand community after strong event impact',
        rationale: `Community impact ${communityImpact.toFixed(1)} · audience growth ${audienceGrowth.toFixed(1)} — launch welcome series for new members.`,
        score: Math.min(84, 48 + Math.round((communityImpact + audienceGrowth) / 2)),
        confidence: 0.62,
        priority: communityImpact >= 15 ? 'high' : 'medium',
        metadata: {
          eventId: context.eventId,
          communityImpact,
          audienceGrowthImpact: audienceGrowth,
        },
        reasonCodes: ['community_growth', 'post_event_retention'],
      });
    }

    return suggestions;
  }

  private stubExecuteSuggestion(
    suggestionType: EventSuggestionType | undefined,
    metadata: Record<string, unknown>,
  ): string {
    switch (suggestionType) {
      case 'optimize_marketing':
        return `stub:marketing_boost_intent eventId=${String(metadata.eventId ?? 'unknown')}`;
      case 'adjust_capacity':
        return `stub:capacity_adjustment_intent fillRatio=${String(metadata.fillRatio ?? 'unknown')}`;
      case 'partner_venue':
        return `stub:venue_partner_outreach entityId=${String(metadata.entityId ?? 'unknown')}`;
      case 'repeat_in_city':
        return `stub:repeat_city_booking_intent city=${String(metadata.city ?? 'unknown')}`;
      case 'book_venue_again':
        return `stub:venue_rebook_intent venueId=${String(metadata.venueId ?? 'unknown')}`;
      case 'expand_community':
        return `stub:community_expansion_intent impact=${String(metadata.communityImpact ?? 'unknown')}`;
      default:
        return 'stub:event_suggestion_executed';
    }
  }

  private async requireEvent(eventId: string) {
    const event = await this.repository.findEvent(eventId);
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

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function resolvePhase(startsAt: Date | null | undefined): EventAgentPhase {
  if (!startsAt) return 'pre';
  return startsAt.getTime() > Date.now() ? 'pre' : 'post';
}

function toPredictSummary(
  payload: Awaited<ReturnType<EventIntelligenceService['getPredict']>>,
): EventAgentPredictSummary {
  return {
    predictedAttendance: payload.predictedAttendance,
    predictedRevenueStub: payload.predictedRevenueStub,
    factors: payload.factors,
  };
}

function toAnalysisSummary(
  payload: Awaited<ReturnType<EventIntelligenceService['getIntelligence']>>,
): EventAgentAnalysisSummary {
  return {
    conversionRate: payload.conversionRate,
    audienceGrowthImpact: payload.audienceGrowthImpact,
    communityImpact: payload.communityImpact,
    actualAttendance: payload.actualAttendance,
    actualRevenueStub: payload.actualRevenueStub,
    fanDensityByCity: payload.fanDensityByCity,
  };
}

function toPredictFromSnapshot(
  payload: Awaited<ReturnType<EventIntelligenceService['getIntelligence']>>,
): EventAgentPredictSummary | null {
  if (payload.predictedAttendance == null && payload.predictedRevenueStub == null) {
    return null;
  }
  const factors =
    payload.metrics?.predictionFactors &&
    typeof payload.metrics.predictionFactors === 'object' &&
    !Array.isArray(payload.metrics.predictionFactors)
      ? (payload.metrics.predictionFactors as Record<string, number>)
      : {};
  return {
    predictedAttendance: payload.predictedAttendance ?? 0,
    predictedRevenueStub: payload.predictedRevenueStub ?? 0,
    factors,
  };
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
