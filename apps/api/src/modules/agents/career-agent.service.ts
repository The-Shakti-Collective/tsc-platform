import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { calculateCityIntelligence, scoreArtistOpportunities } from '@tsc/analytics';
import { CAREER_AGENT_SLUG, resolveListingType } from '@tsc/database';
import type {
  CareerActionDismissPayload,
  CareerActionsPayload,
  CareerAgentRunPayload,
  CareerDashboardPayload,
  CareerSuggestedActionType,
} from '@tsc/types';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import type { AgentRecommendationsQuery, CareerAgentRunInput } from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';

type ScoredCareerAction = {
  suggestedActionType: CareerSuggestedActionType;
  title: string;
  rationale: string;
  score: number;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  metadata: Record<string, unknown>;
  reasonCodes: string[];
};

@Injectable()
export class CareerAgentService {
  constructor(
    private readonly repository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
  ) {}

  async run(
    artistId: string,
    input: CareerAgentRunInput,
    ctx: MembershipContext,
  ): Promise<CareerAgentRunPayload> {
    this.assertAvailable();
    if (!canManageArtist(ctx, artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const artist = await this.repository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    const agent = await this.repository.ensureCareerAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Career agent unavailable');
    }

    const task = await this.repository.createTask(agent.id, {
      artistId,
      limit: input.limit,
    });

    try {
      const context = await this.buildArtistContext(artistId, artist);
      const candidates = await this.scoreCareerActions(context, input.limit);
      const actorPersonId = ctx.personId ?? ctx.userId ?? artist.personId ?? null;

      const items = [];
      let decisionsCreated = 0;

      for (const action of candidates) {
        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId: agent.id,
            targetArtistId: artistId,
            targetPersonId: artist.personId ?? undefined,
            title: action.title,
            rationale: action.rationale,
            score: action.score,
            confidence: action.confidence,
            status: 'active',
            metadata: {
              suggestedActionType: action.suggestedActionType,
              priority: action.priority,
              reasonCodes: action.reasonCodes,
              source: 'career_agent_v1',
              ...action.metadata,
            },
          },
          null,
        );

        await this.decisionEngine.recordDecision({
          agentId: agent.id,
          entityType: 'Artist',
          entityId: artistId,
          decisionType: 'career_action',
          payload: {
            recommendationId: recommendation.id,
            suggestedActionType: action.suggestedActionType,
            title: action.title,
            priority: action.priority,
            ...action.metadata,
          },
          confidence: action.confidence,
          status: 'pending',
        });
        decisionsCreated += 1;
        items.push(recommendation);
      }

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          recommendationsCreated: items.length,
          decisionsCreated,
          artistId,
        });
      }

      if (actorPersonId) {
        await this.activityService.recordInternal({
          actorPersonId,
          action: 'career_actions_generated',
          targetType: 'Artist',
          targetId: artistId,
          metadata: {
            artistId,
            agentId: agent.id,
            taskId: task?.id ?? null,
            count: items.length,
          },
          visibility: 'private',
        });
      }

      return {
        artistId,
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

  async listActions(
    artistId: string,
    query: AgentRecommendationsQuery,
    ctx: MembershipContext,
  ): Promise<CareerActionsPayload> {
    this.assertAvailable();
    if (!canManageArtist(ctx, artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const rows = await this.repository.listRecommendationsForArtist(
      artistId,
      query.limit,
      query.status ?? 'active',
      CAREER_AGENT_SLUG,
    );

    return {
      artistId,
      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async dismissAction(
    id: string,
    ctx: MembershipContext,
  ): Promise<CareerActionDismissPayload> {
    this.assertAvailable();

    const existing = await this.repository.findRecommendation(id);
    if (!existing) throw new NotFoundException(`Career action ${id} not found`);
    if (existing.agent?.slug !== CAREER_AGENT_SLUG) {
      throw new NotFoundException(`Recommendation ${id} is not a career action`);
    }
    if (!existing.targetArtistId) {
      throw new NotFoundException(`Career action ${id} has no artist target`);
    }
    if (
      !canManageArtist(ctx, existing.targetArtistId) &&
      !ctx.roles.includes('admin')
    ) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const row = await this.repository.updateRecommendationStatus(id, 'dismissed');
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      const metadata = parseMetadata(row.metadata);
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'career_action_dismissed',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          recommendationId: row.id,
          artistId: row.targetArtistId,
          suggestedActionType: metadata.suggestedActionType ?? null,
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

  async getDashboard(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<CareerDashboardPayload> {
    this.assertAvailable();
    if (!canManageArtist(ctx, artistId) && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const artist = await this.repository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    const agent = await this.repository.ensureCareerAgent();
    const [
      audienceHealth,
      reputation,
      trust,
      superfanCount,
      revenueStub,
      activeRows,
      lastTask,
      memberships,
    ] = await Promise.all([
      this.repository.findLatestAudienceHealth(artistId),
      this.repository.findLatestReputation('Artist', artistId),
      this.repository.findLatestTrust('Artist', artistId),
      this.repository.countArtistSuperfans(artistId),
      this.repository.sumArtistRevenueStub(artistId),
      this.repository.listRecommendationsForArtist(artistId, 12, 'active', CAREER_AGENT_SLUG),
      agent ? this.repository.findLatestCareerTask(agent.id) : Promise.resolve(null),
      artist.personId
        ? this.repository.listCommunityMemberships(artist.personId)
        : Promise.resolve([]),
    ]);

    const activeActions = activeRows.map((row) =>
      this.decisionEngine.toRecommendationSummary(row),
    );

    const actionCountsByType: Partial<Record<CareerSuggestedActionType, number>> = {};
    for (const item of activeActions) {
      const type = item.metadata?.suggestedActionType as CareerSuggestedActionType | undefined;
      if (type) {
        actionCountsByType[type] = (actionCountsByType[type] ?? 0) + 1;
      }
    }

    const healthScore = audienceHealth
      ? Math.round(
          (audienceHealth.audienceGrowth +
            audienceHealth.fanRetention +
            audienceHealth.fanConversion) /
            3,
        )
      : null;

    return {
      artistId,
      healthScore,
      audienceGrowth: audienceHealth?.audienceGrowth ?? null,
      reputationScore: reputation?.overallScore ?? null,
      trustScore: trust?.trustScore ?? null,
      superfanCount,
      communityCount: artist.communities.length + memberships.length,
      revenueStub,
      activeActions,
      actionCountsByType,
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  private async buildArtistContext(
    artistId: string,
    artist: NonNullable<Awaited<ReturnType<AgentsRepository['findArtist']>>>,
  ) {
    const profile = artist.person?.profile;
    const fanProfile = artist.person?.fanProfile;
    const artistGenres = profile?.genres ?? [];
    const artistCity = profile?.city ?? null;
    const personId = artist.personId ?? null;

    const cities = new Set<string>();
    if (artistCity) cities.add(artistCity);
    for (const city of fanProfile?.cities ?? []) cities.add(city);
    for (const community of artist.communities) {
      if (community.city) cities.add(community.city);
    }

    const [
      applications,
      memberships,
      superfanCount,
      audienceHealth,
      reputation,
      trust,
      revenueStub,
      collaboratedPersonIds,
    ] = await Promise.all([
      this.repository.listArtistApplications(artistId),
      personId
        ? this.repository.listCommunityMemberships(personId)
        : Promise.resolve([]),
      this.repository.countArtistSuperfans(artistId),
      this.repository.findLatestAudienceHealth(artistId),
      this.repository.findLatestReputation('Artist', artistId),
      this.repository.findLatestTrust('Artist', artistId),
      this.repository.sumArtistRevenueStub(artistId),
      personId
        ? this.repository.listCollaboratedPersonIds(personId)
        : Promise.resolve([] as string[]),
    ]);

    for (const membership of memberships) {
      if (membership.community.city) cities.add(membership.community.city);
    }

    const appliedOpportunityIds = new Set(
      applications
        .filter((row) => row.status !== 'saved')
        .map((row) => row.opportunityId),
    );

    const communityIds = [
      ...artist.communities.map((row) => row.id),
      ...memberships.map((row) => row.community.id),
    ];

    const healthScore = audienceHealth
      ? (audienceHealth.audienceGrowth +
          audienceHealth.fanRetention +
          audienceHealth.fanConversion) /
        3
      : 55;

    return {
      artistId,
      personId,
      artistGenres,
      artistCity,
      cities: [...cities],
      appliedOpportunityIds,
      communityIds: [...new Set(communityIds)],
      superfanCount,
      audienceHealth,
      healthScore,
      reputationScore: reputation?.overallScore ?? null,
      trustScore: trust?.trustScore ?? null,
      revenueStub,
      collaboratedPersonIds,
    };
  }

  private async scoreCareerActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
    limit: number,
  ): Promise<ScoredCareerAction[]> {
    const candidates: ScoredCareerAction[] = [];

    const playCityActions = await this.scorePlayCityActions(context);
    candidates.push(...playCityActions);

    const collabActions = await this.scoreCollaborateActions(context);
    candidates.push(...collabActions);

    const opportunityActions = await this.scoreApplyOpportunityActions(context);
    candidates.push(...opportunityActions);

    const communityActions = await this.scoreGrowCommunityActions(context);
    candidates.push(...communityActions);

    const healthActions = this.scoreImproveHealthActions(context);
    candidates.push(...healthActions);

    return candidates
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  private async scorePlayCityActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
  ): Promise<ScoredCareerAction[]> {
    const targetCities = context.cities.filter(
      (city) => !context.artistCity || city.toLowerCase() !== context.artistCity.toLowerCase(),
    );

    const actions: ScoredCareerAction[] = [];
    for (const city of targetCities.slice(0, 4)) {
      const metrics = await this.repository.getCityMetrics(city);
      const intel = calculateCityIntelligence({
        city,
        artistsCount: metrics.artistsCount,
        fansCount: metrics.fansCount,
        venuesCount: metrics.venuesCount,
        eventsCount: metrics.eventsCount,
        revenue: metrics.revenue ?? undefined,
        communityMembers: metrics.communityMembers,
      });

      const fanSignal = context.superfanCount > 0 ? Math.min(20, context.superfanCount * 2) : 0;
      const score = Math.min(95, Math.round(intel.heatScore * 0.7 + fanSignal));
      if (score < 45) continue;

      actions.push({
        suggestedActionType: 'play_city',
        title: `Play ${city}`,
        rationale: buildPlayCityRationale(city, intel.heatScore, context.superfanCount),
        score,
        confidence: Math.min(0.92, 0.55 + intel.heatScore / 200),
        priority: score >= 75 ? 'high' : score >= 58 ? 'medium' : 'low',
        metadata: { city, heatScore: intel.heatScore },
        reasonCodes: ['city_intelligence', 'audience_density'],
      });
    }

    return actions;
  }

  private async scoreCollaborateActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
  ): Promise<ScoredCareerAction[]> {
    const excludeIds = [
      ...(context.personId ? [context.personId] : []),
      ...context.collaboratedPersonIds,
    ];

    const [artists, openCollabs] = await Promise.all([
      this.repository.listCollaboratorArtistCandidates(
        context.artistId,
        context.personId,
        context.artistGenres,
        excludeIds,
        6,
      ),
      this.repository.listOpenCollaborations(
        context.artistGenres,
        context.artistCity,
        4,
      ),
    ]);

    const actions: ScoredCareerAction[] = [];

    for (const candidate of artists.slice(0, 2)) {
      const name =
        candidate.person?.displayName ??
        candidate.person?.name ??
        candidate.name ??
        'Artist';
      const sharedGenres = (candidate.person?.profile?.genres ?? []).filter((g) =>
        context.artistGenres.some((ag) => ag.toLowerCase() === g.toLowerCase()),
      );
      const genreBoost = sharedGenres.length * 8;
      const communityBoost = context.communityIds.length > 0 ? 10 : 0;
      const score = Math.min(90, 52 + genreBoost + communityBoost);

      actions.push({
        suggestedActionType: 'collaborate',
        title: `Collaborate with ${name}`,
        rationale: `Genre overlap (${sharedGenres.join(', ') || 'similar scene'}) and graph signals suggest a strong collab fit.`,
        score,
        confidence: Math.min(0.88, 0.5 + sharedGenres.length * 0.12),
        priority: score >= 72 ? 'high' : 'medium',
        metadata: {
          collaboratorArtistId: candidate.id,
          collaboratorPersonId: candidate.person?.id ?? null,
          collaboratorName: name,
          sharedGenres,
        },
        reasonCodes: ['genre_overlap', 'graph_signal'],
      });
    }

    for (const collab of openCollabs.slice(0, 1)) {
      const creatorName =
        collab.creator?.displayName ?? collab.creator?.name ?? 'Creator';
      actions.push({
        suggestedActionType: 'collaborate',
        title: `Apply: ${collab.title}`,
        rationale: `Open collaboration request from ${creatorName}${collab.city ? ` in ${collab.city}` : ''}.`,
        score: 68,
        confidence: 0.65,
        priority: 'medium',
        metadata: {
          collaborationId: collab.id,
          creatorPersonId: collab.creator?.id ?? null,
          city: collab.city,
        },
        reasonCodes: ['collaboration_marketplace'],
      });
    }

    return actions;
  }

  private async scoreApplyOpportunityActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
  ): Promise<ScoredCareerAction[]> {
    const listings = await this.repository.listOpenOpportunities(20);
    const candidates = listings
      .filter((row) => !context.appliedOpportunityIds.has(row.id))
      .map((row) => {
        const metadata = parseMetadata(row.metadata);
        const genre =
          typeof metadata.genre === 'string'
            ? metadata.genre
            : Array.isArray(metadata.genres) && typeof metadata.genres[0] === 'string'
              ? metadata.genres[0]
              : null;

        return {
          opportunityId: row.id,
          title: row.title,
          listingType: resolveListingType({
            listingType: row.listingType,
            category: row.category,
          }),
          city: row.city ?? null,
          genre,
          budget:
            row.value != null
              ? Number(row.value)
              : typeof metadata.budget === 'number'
                ? metadata.budget
                : null,
          brandId: row.brandId ?? null,
          brandTrustScore: row.brand?.trustScore ?? null,
          artistGenres: context.artistGenres,
          artistCity: context.artistCity,
          engagement: Math.min(95, 45 + context.superfanCount * 3),
        };
      });

    const scored = scoreArtistOpportunities(candidates, 3);
    const festivalFirst = scored.sort((a, b) => {
      const aFest = a.listingType === 'festival_slot' ? 1 : 0;
      const bFest = b.listingType === 'festival_slot' ? 1 : 0;
      return bFest - aFest || b.score - a.score;
    });

    return festivalFirst.slice(0, 2).map((match) => ({
      suggestedActionType: 'apply_opportunity' as const,
      title: `Apply for ${match.title}`,
      rationale: buildApplyRationale(match.reasonCodes, match.city),
      score: match.score,
      confidence: match.confidence,
      priority: match.score >= 78 ? 'high' : 'medium',
      metadata: {
        opportunityId: match.opportunityId,
        listingType: match.listingType,
        city: match.city,
        genre: match.genre,
        budget: match.budget,
      },
      reasonCodes: match.reasonCodes,
    }));
  }

  private async scoreGrowCommunityActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
  ): Promise<ScoredCareerAction[]> {
    if (context.communityIds.length >= 3) return [];

    const communities = await this.repository.listCommunityLaunchCandidates(
      context.artistCity,
      context.artistGenres,
      3,
    );

    if (communities.length > 0 && context.communityIds.length < 2) {
      const target = communities[0];
      return [
        {
          suggestedActionType: 'grow_community',
          title: `Join ${target.name}`,
          rationale: `Community gap detected — ${target._count.members} members in ${target.city ?? 'your scene'} align with your genres.`,
          score: 64,
          confidence: 0.62,
          priority: 'medium',
          metadata: {
            communityId: target.id,
            communityName: target.name,
            city: target.city,
            memberCount: target._count.members,
          },
          reasonCodes: ['community_gap'],
        },
      ];
    }

    const cityLabel = context.artistCity ?? 'your city';
    return [
      {
        suggestedActionType: 'grow_community',
        title: `Launch Community in ${cityLabel}`,
        rationale:
          'Low community footprint — launching a fan community can deepen retention and unlock membership revenue.',
        score: 58,
        confidence: 0.58,
        priority: 'medium',
        metadata: { city: context.artistCity, launchSuggested: true },
        reasonCodes: ['community_gap', 'retention'],
      },
    ];
  }

  private scoreImproveHealthActions(
    context: Awaited<ReturnType<CareerAgentService['buildArtistContext']>>,
  ): ScoredCareerAction[] {
    if (context.healthScore >= 65) return [];

    const weakest = context.audienceHealth
      ? pickWeakestMetric(context.audienceHealth)
      : {
          key: 'engagement',
          label: 'Engagement',
          value: 0,
          rationale:
            'Engagement signals are limited — post consistently and cross-promote with communities.',
        };

    return [
      {
        suggestedActionType: 'improve_health',
        title: `Improve ${weakest.label}`,
        rationale: weakest.rationale,
        score: Math.round(Math.max(50, 78 - context.healthScore / 2)),
        confidence: 0.6,
        priority: context.healthScore < 45 ? 'high' : 'medium',
        metadata: {
          healthScore: context.healthScore,
          focusMetric: weakest.key,
          audienceGrowth: context.audienceHealth?.audienceGrowth ?? null,
          fanRetention: context.audienceHealth?.fanRetention ?? null,
        },
        reasonCodes: ['audience_health', weakest.key],
      },
    ];
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function buildPlayCityRationale(city: string, heatScore: number, superfanCount: number): string {
  const parts = [`${city} heat score ${Math.round(heatScore)} — strong live market signal`];
  if (superfanCount > 0) {
    parts.push(`${superfanCount} superfans may travel or amplify`);
  }
  return parts.join('. ') + '.';
}

function buildApplyRationale(reasonCodes: string[], city: string | null): string {
  const parts: string[] = [];
  if (reasonCodes.includes('genre_match')) parts.push('Genre aligns with your profile');
  if (reasonCodes.includes('location_match') && city) {
    parts.push(`Festival fit for ${city}`);
  }
  if (reasonCodes.includes('high_value')) parts.push('High-value slot');
  if (parts.length === 0) parts.push('Festival opportunity matches career trajectory');
  return parts.join('. ') + '.';
}

function pickWeakestMetric(health: {
  audienceGrowth: number;
  fanRetention: number;
  fanConversion: number;
}) {
  const metrics = [
    {
      key: 'audience_growth',
      label: 'Audience Growth',
      value: health.audienceGrowth,
      rationale: 'Audience growth is lagging — post consistently and cross-promote with communities.',
    },
    {
      key: 'fan_retention',
      label: 'Fan Retention',
      value: health.fanRetention,
      rationale: 'Fan retention is soft — run a superfan activation or exclusive drop.',
    },
    {
      key: 'fan_conversion',
      label: 'Fan Conversion',
      value: health.fanConversion,
      rationale: 'Conversion from listeners to supporters is low — add a clear support CTA.',
    },
  ];
  metrics.sort((a, b) => a.value - b.value);
  return metrics[0];
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}
