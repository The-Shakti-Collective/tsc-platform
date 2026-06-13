import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { BRAND_MATCH_AGENT_SLUG } from '@tsc/database';
import type {
  BrandMatchAgentResultsPayload,
  BrandMatchAgentRunPayload,
  BrandMatchCampaignBrief,
  BrandMatchCampaignHistoryPayload,
  BrandMatchInvitePayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { AgentRecommendationsQuery, BrandMatchAgentRunInput } from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { TrustService } from '../trust/trust.service';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';

@Injectable()
export class BrandMatchAgentService {
  private readonly logger = new Logger(BrandMatchAgentService.name);

  constructor(
    private readonly repository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
    private readonly trustService: TrustService,
  ) {}

  async run(
    input: BrandMatchAgentRunInput,
    ctx: MembershipContext,
  ): Promise<BrandMatchAgentRunPayload> {
    this.assertAvailable();

    const brand = await this.requireBrand(input.brandId);
    await this.assertCanManage(brand.personId, ctx);

    const agent = await this.repository.ensureBrandMatchAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Brand match agent unavailable');
    }

    const brief = toBrief(input);
    const task = await this.repository.createTask(agent.id, {
      brandId: input.brandId,
      ...brief,
      limit: input.limit,
    });

    try {
      const matchResult = await this.trustService.brandMatch(
        {
          brandId: input.brandId,
          genre: input.genre,
          city: input.city,
          budget: input.budget,
          audienceAge: input.audienceAge,
        },
        ctx,
      );

      const topItems = matchResult.items.slice(0, input.limit ?? 20);
      const items = [];
      const actorPersonId = ctx.personId ?? ctx.userId ?? null;

      for (const match of topItems) {
        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId: agent.id,
            targetArtistId: match.artistId,
            title: match.artistName ?? match.artistId,
            rationale: buildMatchRationale(match),
            score: match.score,
            confidence: normalizeConfidence(match.confidence),
            status: 'active',
            metadata: {
              brandId: input.brandId,
              taskId: task?.id ?? null,
              artistId: match.artistId,
              artistName: match.artistName,
              slug: match.slug,
              city: match.city,
              genres: match.genres,
              trustScore: match.trustScore,
              reasonCodes: match.reasonCodes,
              factors: match.factors,
              brief,
              source: 'brand_match_agent_v1',
            },
          },
          null,
        );
        items.push(recommendation);
      }

      const decision = await this.decisionEngine.recordDecision({
        agentId: agent.id,
        entityType: 'Brand',
        entityId: input.brandId,
        decisionType: 'brand_match_campaign',
        payload: {
          brandId: input.brandId,
          taskId: task?.id ?? null,
          brief,
          recommendationCount: items.length,
          topArtistIds: items.slice(0, 5).map((item) => item.targetArtistId ?? item.metadata?.artistId),
        },
        confidence: items[0] ? items[0].confidence : 0.5,
        status: 'pending',
      });

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          recommendationsCreated: items.length,
          brandId: input.brandId,
          brief,
          decisionId: decision.id,
        });
      }

      if (actorPersonId) {
        await this.activityService.recordInternal({
          actorPersonId,
          action: 'brand_match_run_completed',
          targetType: 'Brand',
          targetId: input.brandId,
          metadata: {
            brandId: input.brandId,
            agentId: agent.id,
            taskId: task?.id ?? null,
            decisionId: decision.id,
            count: items.length,
            brief,
          },
          visibility: 'private',
        });
      }

      return {
        brandId: input.brandId,
        taskId: task?.id ?? 'stub-task',
        decisionId: decision.id,
        recommendationsCreated: items.length,
        brief,
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

  async getResults(
    brandId: string,
    query: AgentRecommendationsQuery,
    ctx: MembershipContext,
  ): Promise<BrandMatchAgentResultsPayload> {
    this.assertAvailable();

    const brand = await this.requireBrand(brandId);
    await this.assertCanManage(brand.personId, ctx);

    const agent = await this.repository.ensureBrandMatchAgent();
    const [lastTask, pendingDecision] = await Promise.all([
      agent ? this.repository.findLatestBrandMatchTask(agent.id, brandId) : Promise.resolve(null),
      agent ? this.repository.findPendingBrandMatchDecision(agent.id, brandId) : Promise.resolve(null),
    ]);

    const taskId = lastTask?.id ?? null;
    const brief = parseBrief(lastTask?.input) ?? emptyBrief();
    const rows =
      agent && taskId
        ? await this.repository.listRecommendationsForBrand(
            brandId,
            query.limit,
            query.status ?? 'active',
            BRAND_MATCH_AGENT_SLUG,
            taskId,
          )
        : [];

    return {
      brandId,
      brief,
      taskId,
      decision: pendingDecision ? this.decisionEngine.toDecisionSummary(pendingDecision) : null,
      items: rows.map((row) => this.decisionEngine.toRecommendationSummary(row)),
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async inviteArtist(
    recommendationId: string,
    ctx: MembershipContext,
  ): Promise<BrandMatchInvitePayload> {
    this.assertAvailable();

    const existing = await this.repository.findRecommendation(recommendationId);
    if (!existing) throw new NotFoundException(`Recommendation ${recommendationId} not found`);
    if (existing.agent?.slug !== BRAND_MATCH_AGENT_SLUG) {
      throw new NotFoundException(`Recommendation ${recommendationId} is not a brand match result`);
    }

    const metadata = parseMetadata(existing.metadata);
    const brandId = typeof metadata.brandId === 'string' ? metadata.brandId : null;
    if (!brandId) {
      throw new NotFoundException(`Recommendation ${recommendationId} has no brand target`);
    }

    const brand = await this.requireBrand(brandId);
    await this.assertCanManage(brand.personId, ctx);

    const artistId =
      existing.targetArtistId ??
      (typeof metadata.artistId === 'string' ? metadata.artistId : 'unknown');
    const artistName =
      typeof metadata.artistName === 'string' ? metadata.artistName : existing.title;
    const invitedStub = `stub:campaign_artist_invite brandId=${brandId} artistId=${artistId}`;

    const row = await this.repository.updateRecommendationStatus(recommendationId, 'applied');
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'brand_match_invite_sent',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          recommendationId: row.id,
          brandId,
          artistId,
          artistName,
          invitedStub,
        },
        visibility: 'private',
      });
    }

    this.logger.log(`Brand match invite stub: id=${recommendationId} ${invitedStub}`);

    return {
      id: row.id,
      status: 'applied',
      invitedStub,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getCampaignHistory(
    brandId: string,
    ctx: MembershipContext,
  ): Promise<BrandMatchCampaignHistoryPayload> {
    this.assertAvailable();

    const brand = await this.requireBrand(brandId);
    await this.assertCanManage(brand.personId, ctx);

    const agent = await this.repository.ensureBrandMatchAgent();
    const tasks = agent
      ? await this.repository.listBrandMatchTasks(agent.id, brandId, 20)
      : [];

    const campaigns = tasks.map((task) => {
      const output = parseMetadata(task.output);
      const brief = parseBrief(task.input) ?? emptyBrief();
      return {
        taskId: task.id,
        brief,
        recommendationsCreated:
          typeof output.recommendationsCreated === 'number' ? output.recommendationsCreated : 0,
        topArtistName: null,
        completedAt: task.completedAt?.toISOString() ?? task.updatedAt.toISOString(),
      };
    });

    return {
      brandId,
      campaigns,
      updatedAt: new Date().toISOString(),
    };
  }

  private async requireBrand(brandId: string) {
    const brand = await this.repository.findBrand(brandId);
    if (!brand) throw new NotFoundException(`Brand ${brandId} not found`);
    return brand;
  }

  private async assertCanManage(ownerPersonId: string | null, ctx: MembershipContext) {
    if (ctx.roles.includes('admin')) return;
    if (ownerPersonId && ctx.personId === ownerPersonId) return;
    throw new ForbiddenException('Brand management access required');
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function normalizeConfidence(value: number): number {
  if (value <= 1) return value;
  return Math.min(1, value / 100);
}

function buildMatchRationale(match: {
  artistName: string | null;
  city: string | null;
  genres: string[];
  reasonCodes: string[];
  trustScore: number | null;
}): string {
  const codes = match.reasonCodes.slice(0, 3).join(', ') || 'explore';
  return `${match.artistName ?? 'Artist'} — ${match.city ?? 'city n/a'} · ${match.genres.slice(0, 2).join(', ') || 'genre n/a'} · trust ${match.trustScore ?? 'n/a'} · ${codes.replace(/_/g, ' ')}`;
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function parseBrief(value: unknown): BrandMatchCampaignBrief | null {
  const raw = parseMetadata(value);
  if (Object.keys(raw).length === 0) return null;
  return {
    genre: typeof raw.genre === 'string' ? raw.genre : null,
    audienceAge: typeof raw.audienceAge === 'string' ? raw.audienceAge : null,
    city: typeof raw.city === 'string' ? raw.city : null,
    budget: typeof raw.budget === 'number' ? raw.budget : null,
  };
}

function toBrief(input: BrandMatchAgentRunInput): BrandMatchCampaignBrief {
  return {
    genre: input.genre ?? null,
    audienceAge: input.audienceAge ?? null,
    city: input.city ?? null,
    budget: input.budget ?? null,
  };
}

function emptyBrief(): BrandMatchCampaignBrief {
  return { genre: null, audienceAge: null, city: null, budget: null };
}
