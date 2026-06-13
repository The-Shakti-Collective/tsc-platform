import {
  ForbiddenException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  COPILOT_AGENT_SLUG,
  COPILOT_FALLBACK_MESSAGE,
  COPILOT_INTENT_CATALOG,
  COPILOT_STARTER_PROMPTS,
  type CopilotIntentValue,
} from '@tsc/database';
import type {
  CopilotFeedbackPayload,
  CopilotQueryPayload,
  CopilotSuggestionsPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { CopilotFeedbackInput, CopilotQueryInput } from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { AudienceService } from '../audience/audience.service';
import { CollaborationService } from '../collaboration/collaboration.service';
import { AgentsRepository } from './agents.repository';
import { CareerAgentService } from './career-agent.service';
import { ForecastAgentService } from './forecast-agent.service';
import { OpportunityAgentService } from './opportunity-agent.service';
import { TalentDiscoveryAgentService } from './talent-discovery-agent.service';

const FOLLOW_UPS: Record<Exclude<CopilotIntentValue, 'fallback'>, string[]> = {
  artists_at_risk: [
    'Which communities are growing fastest?',
    'What is the revenue forecast?',
  ],
  communities_growing: [
    'Show artists at risk',
    'Who should I collaborate with?',
  ],
  opportunities_for_me: [
    'Who should I collaborate with?',
    'Show artists at risk',
  ],
  collaboration_matches: [
    'What opportunities should I apply to?',
    'Which communities are growing fastest?',
  ],
  revenue_forecast: [
    'Show artists at risk',
    'What opportunities should I apply to?',
  ],
};

@Injectable()
export class CopilotAgentService {
  constructor(
    private readonly repository: AgentsRepository,
    private readonly audienceService: AudienceService,
    private readonly opportunityAgent: OpportunityAgentService,
    private readonly careerAgent: CareerAgentService,
    private readonly talentDiscoveryAgent: TalentDiscoveryAgentService,
    private readonly forecastAgent: ForecastAgentService,
    private readonly collaborationService: CollaborationService,
    private readonly activityService: ActivityService,
  ) {}

  getSuggestions(): CopilotSuggestionsPayload {
    const items = COPILOT_INTENT_CATALOG.map((entry) => ({
      prompt:
        COPILOT_STARTER_PROMPTS.find((prompt) =>
          entry.patterns.some((pattern) => pattern.test(prompt)),
        ) ?? entry.label,
      intent: entry.intent,
      label: entry.label,
    }));

    return {
      items,
      updatedAt: new Date().toISOString(),
    };
  }

  async query(
    input: CopilotQueryInput,
    ctx: MembershipContext,
  ): Promise<CopilotQueryPayload> {
    this.assertAvailable();

    const agent = await this.repository.ensureCopilotAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Copilot agent unavailable');
    }

    const personId = input.personId ?? ctx.personId ?? ctx.userId ?? null;
    const artistId = input.artistId ?? ctx.artistMemberships[0] ?? null;
    const intent = detectIntent(input.message);

    const task = await this.repository.createTask(agent.id, {
      message: input.message,
      intent,
      personId,
      artistId,
      context: input.context,
    });

    try {
      const response = await this.routeIntent(intent, input.message, {
        personId,
        artistId,
        ctx,
      });

      const sessionId = task?.id ?? `stub-session-${Date.now()}`;
      const payload: CopilotQueryPayload = {
        ...response,
        message: input.message,
        taskId: task?.id ?? null,
        sessionId,
        llmHook: 'stub',
        updatedAt: new Date().toISOString(),
      };

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          intent,
          answer: payload.answer,
          sources: payload.sources,
          copilotSession: {
            sessionId,
            message: input.message,
            intent,
            personId,
            artistId,
            suggestedFollowUps: payload.suggestedFollowUps,
            feedback: null,
          },
        });
      }

      if (personId) {
        await this.activityService.recordInternal({
          actorPersonId: personId,
          action: 'copilot_query_answered',
          targetType: 'AgentTask',
          targetId: task?.id ?? agent.id,
          metadata: {
            agentId: agent.id,
            agentSlug: COPILOT_AGENT_SLUG,
            intent,
            message: input.message,
            taskId: task?.id ?? null,
            artistId,
          },
          visibility: 'private',
        });
      }

      return payload;
    } catch (error) {
      if (task) {
        await this.repository.completeTask(task.id, 'failed', {
          intent,
          error: error instanceof Error ? error.message : 'unknown',
        });
      }
      throw error;
    }
  }

  async recordFeedback(
    input: CopilotFeedbackInput,
    ctx: MembershipContext,
  ): Promise<CopilotFeedbackPayload> {
    this.assertAvailable();

    const personId = ctx.personId ?? ctx.userId;
    if (!personId) {
      throw new ForbiddenException('Authenticated person required');
    }

    const agent = await this.repository.ensureCopilotAgent();
    const recordedStub = `stub:copilot_feedback rating=${input.rating} intent=${input.intent ?? 'unknown'} taskId=${input.taskId ?? 'none'}`;

    if (input.taskId && agent) {
      await this.repository.createTask(agent.id, {
        feedback: {
          rating: input.rating,
          comment: input.comment ?? null,
          intent: input.intent ?? null,
          message: input.message ?? null,
          personId,
          recordedStub,
        },
      });
    }

    return {
      status: 'recorded',
      rating: input.rating,
      taskId: input.taskId ?? null,
      recordedStub,
      updatedAt: new Date().toISOString(),
    };
  }

  private async routeIntent(
    intent: CopilotIntentValue,
    message: string,
    scope: {
      personId: string | null;
      artistId: string | null;
      ctx: MembershipContext;
    },
  ): Promise<Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>> {
    switch (intent) {
      case 'artists_at_risk':
        return this.handleArtistsAtRisk();
      case 'communities_growing':
        return this.handleCommunitiesGrowing(scope.ctx);
      case 'opportunities_for_me':
        return this.handleOpportunitiesForMe(scope.artistId, scope.ctx);
      case 'collaboration_matches':
        return this.handleCollaborationMatches(scope.artistId, scope.ctx);
      case 'revenue_forecast':
        return this.handleRevenueForecast(scope.ctx);
      default:
        return this.handleFallback(message);
    }
  }

  private async handleArtistsAtRisk(): Promise<
    Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>
  > {
    const [churnPayload, healthRows] = await Promise.all([
      this.audienceService.getChurnRiskArtists(10),
      this.repository.listArtistsBelowHealthScore(60, 10),
    ]);

    const atRiskFromChurn = churnPayload.artists.map((row) => ({
      artistId: row.artistId,
      name: row.name,
      healthScore: null,
      fanRetention: row.fanRetention,
      audienceChurn: row.audienceChurn,
      riskLevel: row.riskLevel,
      source: 'audience_churn',
    }));

    const lowHealthArtists = healthRows.map((row) => ({
      artistId: row.artist.id,
      name: row.artist.name,
      healthScore: row.healthScore,
      fanRetention: null,
      audienceChurn: null,
      riskLevel: (row.healthScore < 45 ? 'high' : 'elevated') as 'high' | 'elevated',
      source: 'command_center_health',
    }));

    const merged = [...atRiskFromChurn];
    for (const row of lowHealthArtists) {
      if (!merged.some((existing) => existing.artistId === row.artistId)) {
        merged.push(row);
      }
    }

    const rows = merged.slice(0, 10);

    return {
      intent: 'artists_at_risk',
      answer:
        rows.length > 0
          ? `Found ${rows.length} artist${rows.length === 1 ? '' : 's'} with elevated churn or low health scores. Review retention and outreach priorities below.`
          : 'No artists currently flagged at elevated risk. Audience health looks stable.',
      data: {
        table: {
          columns: [
            { key: 'name', label: 'Artist' },
            { key: 'fanRetention', label: 'Retention %' },
            { key: 'audienceChurn', label: 'Churn %' },
            { key: 'riskLevel', label: 'Risk' },
          ],
          rows: rows.map((row) => ({
            artistId: row.artistId,
            name: row.name,
            fanRetention: row.fanRetention,
            audienceChurn: row.audienceChurn,
            riskLevel: row.riskLevel,
            healthScore: row.healthScore,
          })),
        },
        summary: {
          threshold: churnPayload.threshold,
          count: rows.length,
        },
      },
      sources: [
        { label: 'Audience churn insights', route: '/audience/insights/churn-risk' },
        { label: 'Command Center', route: '/intelligence/command-center' },
      ],
      suggestedFollowUps: FOLLOW_UPS.artists_at_risk,
    };
  }

  private async handleCommunitiesGrowing(
    ctx: MembershipContext,
  ): Promise<
    Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>
  > {
    const [snapshots, emergingCities] = await Promise.all([
      this.repository.listCommunityAudienceSnapshots(12),
      this.talentDiscoveryAgent.getEmergingCities(6, ctx).catch(() => ({
        items: [],
        updatedAt: new Date().toISOString(),
      })),
    ]);

    const rows = snapshots
      .map((row) => ({
        communityId: row.community.id,
        name: row.community.name,
        city: row.community.city,
        memberGrowth: row.memberGrowth,
        fanGrowth: row.fanGrowth,
        activeMembers: row.activeMembers,
      }))
      .sort((a, b) => b.memberGrowth - a.memberGrowth || b.fanGrowth - a.fanGrowth)
      .slice(0, 8);

    return {
      intent: 'communities_growing',
      answer:
        rows.length > 0
          ? `Top ${rows.length} communities by member and fan growth. ${emergingCities.items.length} emerging city scenes also surfaced from talent discovery.`
          : 'No community growth snapshots available yet. Run talent discovery or refresh audience data.',
      data: {
        table: {
          columns: [
            { key: 'name', label: 'Community' },
            { key: 'city', label: 'City' },
            { key: 'memberGrowth', label: 'Member growth' },
            { key: 'fanGrowth', label: 'Fan growth' },
            { key: 'activeMembers', label: 'Active' },
          ],
          rows,
        },
        summary: {
          emergingCities: emergingCities.items.slice(0, 4),
        },
      },
      sources: [
        { label: 'Participation dashboard', route: '/intelligence/participation-dashboard' },
        {
          label: 'Talent Discovery',
          route: '/agents/talent-discovery/emerging-cities',
          agentSlug: 'talent-discovery-agent',
        },
      ],
      suggestedFollowUps: FOLLOW_UPS.communities_growing,
    };
  }

  private async handleOpportunitiesForMe(
    artistId: string | null,
    ctx: MembershipContext,
  ): Promise<
    Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>
  > {
    const payload = artistId
      ? await this.opportunityAgent.getRecommendationsForArtist(artistId, { limit: 8 }, ctx)
      : await this.opportunityAgent.getRecommendationsForMe(ctx, { limit: 8 });

    const rows = payload.items.map((item) => ({
      id: item.id,
      title: item.title,
      score: item.score,
      confidence: Math.round(item.confidence * 100),
      status: item.status,
      opportunityId:
        typeof item.metadata.opportunityId === 'string' ? item.metadata.opportunityId : null,
    }));

    return {
      intent: 'opportunities_for_me',
      answer:
        rows.length > 0
          ? `Found ${rows.length} opportunity recommendation${rows.length === 1 ? '' : 's'} from the Opportunity Agent. Review and apply via the marketplace — copilot does not auto-apply.`
          : 'No active opportunity recommendations yet. Run the Opportunity Agent for your artist profile or browse the marketplace.',
      data: {
        table: {
          columns: [
            { key: 'title', label: 'Opportunity' },
            { key: 'score', label: 'Score' },
            { key: 'confidence', label: 'Confidence %' },
            { key: 'status', label: 'Status' },
          ],
          rows,
        },
        summary: {
          artistId: payload.artistId,
          personId: payload.personId,
        },
      },
      sources: [
        {
          label: 'Opportunity Agent',
          route: '/agents/opportunity/recommendations',
          agentSlug: 'opportunity-agent',
        },
        { label: 'Opportunity marketplace', route: '/operating/opportunities' },
      ],
      suggestedFollowUps: FOLLOW_UPS.opportunities_for_me,
    };
  }

  private async handleCollaborationMatches(
    artistId: string | null,
    ctx: MembershipContext,
  ): Promise<
    Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>
  > {
    const [collaborations, careerActions] = await Promise.all([
      this.collaborationService
        .browse({ status: 'open', limit: 6 })
        .catch(() => ({ items: [], filters: {}, updatedAt: new Date().toISOString() })),
      artistId
        ? this.careerAgent
            .listActions(artistId, { limit: 6, status: 'active' }, ctx)
            .catch(() => ({ items: [], updatedAt: new Date().toISOString(), artistId }))
        : Promise.resolve({ items: [], updatedAt: new Date().toISOString(), artistId: null }),
    ]);

    const collabRows = collaborations.items.map((item, index) => ({
      type: 'collaboration',
      title: item.title,
      matchScore: 70 - index * 3,
      reason: `${item.type.replace(/_/g, ' ')} · ${item.city ?? 'remote'}`,
      city: item.city,
    }));

    const careerRows = careerActions.items
      .filter((item) => item.metadata.suggestedActionType === 'collaborate')
      .map((item) => ({
        type: 'career_action',
        title: item.title,
        matchScore: item.score,
        reason: item.rationale,
        city: null,
      }));

    const rows = [...careerRows, ...collabRows]
      .sort((a, b) => (b.matchScore as number) - (a.matchScore as number))
      .slice(0, 8);

    return {
      intent: 'collaboration_matches',
      answer:
        rows.length > 0
          ? `Surfaced ${rows.length} collaboration match${rows.length === 1 ? '' : 'es'} from the marketplace and Career Agent.`
          : 'No collaboration matches found yet. Post a collaboration listing or run the Career Agent for your artist.',
      data: {
        table: {
          columns: [
            { key: 'title', label: 'Match' },
            { key: 'type', label: 'Source' },
            { key: 'matchScore', label: 'Score' },
            { key: 'reason', label: 'Why' },
          ],
          rows,
        },
        summary: {
          artistId,
          collaborationCount: collabRows.length,
          careerCount: careerRows.length,
        },
      },
      sources: [
        { label: 'Collaboration marketplace', route: '/collaboration' },
        { label: 'Discovery', route: '/discovery/collaborations', agentSlug: null },
        { label: 'Career Agent', route: '/agents/career/actions', agentSlug: 'career-agent' },
      ],
      suggestedFollowUps: FOLLOW_UPS.collaboration_matches,
    };
  }

  private async handleRevenueForecast(
    ctx: MembershipContext,
  ): Promise<
    Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'>
  > {
    const rollup = await this.forecastAgent.getPlatformRollup(ctx).catch(() => ({
      entityType: 'Platform',
      entityId: 'tsc-platform',
      rollups: [],
      lastRunAt: null,
      updatedAt: new Date().toISOString(),
    }));
    const revenue = rollup.rollups.find((row) => row.metric === 'revenue');

    const rows = rollup.rollups.map((entry) => ({
      metric: entry.label,
      horizon30: entry.horizon30?.predictedValue ?? null,
      horizon90: entry.horizon90?.predictedValue ?? null,
      lower30: entry.horizon30?.lowerBound ?? null,
      upper30: entry.horizon30?.upperBound ?? null,
    }));

    const projected30 = revenue?.horizon30?.predictedValue ?? null;

    return {
      intent: 'revenue_forecast',
      answer:
        projected30 != null
          ? `Platform revenue forecast: ~₹${formatCompactInr(projected30)} over the next 30 days (90d upper band in table). Rollup from Forecast Agent snapshots.`
          : 'Revenue forecast data is not available yet. Run the Forecast Agent from Command Center.',
      data: {
        table: {
          columns: [
            { key: 'metric', label: 'Metric' },
            { key: 'horizon30', label: '30d' },
            { key: 'horizon90', label: '90d' },
            { key: 'lower30', label: '30d low' },
            { key: 'upper30', label: '30d high' },
          ],
          rows,
        },
        summary: {
          lastRunAt: rollup.lastRunAt,
          entityType: rollup.entityType,
        },
      },
      sources: [
        {
          label: 'Forecast Agent',
          route: '/agents/forecast/platform',
          agentSlug: 'forecast-agent',
        },
        { label: 'Command Center', route: '/intelligence/command-center' },
      ],
      suggestedFollowUps: FOLLOW_UPS.revenue_forecast,
    };
  }

  private handleFallback(
    message: string,
  ): Omit<CopilotQueryPayload, 'message' | 'taskId' | 'sessionId' | 'llmHook' | 'updatedAt'> {
    return {
      intent: 'fallback',
      answer: COPILOT_FALLBACK_MESSAGE,
      data: {
        summary: {
          receivedMessage: message,
          supportedIntents: COPILOT_INTENT_CATALOG.map((entry) => entry.intent),
        },
      },
      sources: [{ label: 'Copilot suggestions', route: '/agents/copilot/suggestions' }],
      suggestedFollowUps: [...COPILOT_STARTER_PROMPTS],
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function detectIntent(message: string): CopilotIntentValue {
  const normalized = message.trim();
  for (const entry of COPILOT_INTENT_CATALOG) {
    if (entry.patterns.some((pattern) => pattern.test(normalized))) {
      return entry.intent;
    }
  }
  return 'fallback';
}

function formatCompactInr(amount: number): string {
  if (amount >= 100000) return `${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(0)}K`;
  return Math.round(amount).toLocaleString();
}
