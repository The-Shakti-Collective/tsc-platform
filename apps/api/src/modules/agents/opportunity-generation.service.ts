import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  COLLABORATION_ARTIST_CLUSTER_MIN,
  COLLABORATION_MEMBER_GROWTH_THRESHOLD,
  EMERGING_CITY_SCENE_THRESHOLD,
  GRANT_EMERGING_ARTIST_GROWTH_THRESHOLD,
  OPPORTUNITY_GENERATION_RULE_IDS,
  SHOWCASE_AUDIENCE_GROWTH_THRESHOLD,
  SHOWCASE_COMMUNITY_ACTIVITY_THRESHOLD,
  TALENT_DISCOVERY_PERIOD_DAYS,
  buildCollaborationTitle,
  buildGrantTitle,
  buildShowcaseEventTitle,
  computeActivityFeedVelocityStub,
  computeCitySceneGrowth,
  scoreCollaborationConfidence,
  scoreGrantConfidence,
  scoreShowcaseConfidence,
  type GeneratedOpportunityTypeValue,
  type OpportunityGenerationSignalSnapshot,
} from '@tsc/database';
import type {
  GeneratedOpportunitySummary,
  OpportunityGenerationApprovePayload,
  OpportunityGenerationDismissPayload,
  OpportunityGenerationDraftsPayload,
  OpportunityGenerationHotSignal,
  OpportunityGenerationRunPayload,
  OpportunityGenerationSignalsPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type {
  OpportunityGenerationApproveInput,
  OpportunityGenerationDraftsQuery,
  OpportunityGenerationRunInput,
  OpportunityGenerationSignalsQuery,
} from '@tsc/contracts/opportunity-generation';
import { ActivityService } from '../activity/activity.service';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';
import { OpportunityGenerationRepository } from './opportunity-generation.repository';

const CATEGORY_BY_TYPE: Record<
  GeneratedOpportunityTypeValue,
  { category: string; listingType: string }
> = {
  showcase_event: { category: 'festival_slot', listingType: 'festival_slot' },
  collaboration_open_call: { category: 'collaboration', listingType: 'collaboration' },
  grant_opportunity: { category: 'funding', listingType: 'grant' },
};

@Injectable()
export class OpportunityGenerationService {
  private readonly logger = new Logger(OpportunityGenerationService.name);

  constructor(
    private readonly repository: OpportunityGenerationRepository,
    private readonly agentsRepository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
  ) {}

  async run(
    input: OpportunityGenerationRunInput,
    ctx: MembershipContext,
  ): Promise<OpportunityGenerationRunPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const scope = {
      cityLimit: 10,
      limit: 20,
      ...(input.scope ?? {}),
    };
    const cityLimit = scope.cityLimit;
    const limit = scope.limit;
    const triggeredBy = input.triggeredBy ?? ctx.personId ?? ctx.userId ?? 'admin';

    const signals = await this.collectHotSignals(cityLimit);
    const scopedSignals = this.applyScopeFilter(signals, scope.city, scope.genre);

    const drafts: GeneratedOpportunitySummary[] = [];
    const seen = new Set<string>();

    for (const signal of scopedSignals) {
      if (drafts.length >= limit) break;
      const key = `${signal.ruleId}:${signal.id}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const draft = await this.materializeDraftFromSignal(signal);
      if (draft) drafts.push(draft);
    }

    const run = await this.repository.createRun({
      triggeredBy,
      scope: scope as Record<string, unknown>,
      signals: { hot: scopedSignals, evaluated: signals.length },
      generatedCount: drafts.length,
    });

    if (ctx.personId ?? ctx.userId) {
      await this.activityService.recordInternal({
        actorPersonId: (ctx.personId ?? ctx.userId)!,
        action: 'opportunity_generated',
        targetType: 'OpportunityGenerationRun',
        targetId: run?.id ?? 'stub-run',
        metadata: {
          generatedCount: drafts.length,
          triggeredBy,
          scope,
        },
        visibility: 'private',
      });
    }

    return {
      runId: run?.id ?? 'stub-run',
      triggeredBy,
      generatedCount: drafts.length,
      drafts,
      signals: scopedSignals,
      updatedAt: new Date().toISOString(),
    };
  }

  async listDrafts(
    query: OpportunityGenerationDraftsQuery,
    ctx: MembershipContext,
  ): Promise<OpportunityGenerationDraftsPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const rows = await this.repository.listDrafts({
      status: query.status,
      limit: query.limit,
      city: query.city,
      genre: query.genre,
    });

    return {
      items: rows.map((row) => this.toSummary(row)),
      total: rows.length,
      updatedAt: new Date().toISOString(),
    };
  }

  async getSignals(
    query: OpportunityGenerationSignalsQuery,
    ctx: MembershipContext,
  ): Promise<OpportunityGenerationSignalsPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const items = await this.collectHotSignals(query.limit ?? 15);
    return {
      items,
      updatedAt: new Date().toISOString(),
    };
  }

  async approveDraft(
    id: string,
    input: OpportunityGenerationApproveInput,
    ctx: MembershipContext,
  ): Promise<OpportunityGenerationApprovePayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const draft = await this.repository.findDraft(id);
    if (!draft) throw new NotFoundException(`Generated opportunity ${id} not found`);
    if (draft.status === 'published') {
      throw new NotFoundException(`Draft ${id} is already published`);
    }
    if (draft.status === 'dismissed') {
      throw new NotFoundException(`Draft ${id} was dismissed`);
    }

    const mapping = CATEGORY_BY_TYPE[draft.suggestedType as GeneratedOpportunityTypeValue];
    const signal = parseJsonRecord(draft.signalSnapshot);
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + (input.deadlineDays ?? 45));

    const opportunity = await this.repository.createMarketplaceOpportunity({
      title: draft.title,
      description: draft.description,
      category: mapping.category,
      listingType: mapping.listingType,
      city: draft.city,
      genre: draft.genre,
      brandId: typeof signal.brandId === 'string' ? signal.brandId : null,
      value: input.value ?? null,
      deadline,
      metadata: {
        generatedOpportunityId: draft.id,
        suggestedType: draft.suggestedType,
        signalSnapshot: signal,
        generationReason: draft.generationReason,
      },
    });

    await this.repository.createOpportunityActivity({
      opportunityId: opportunity.id,
      type: 'launched',
      summary: 'Published from opportunity generation engine',
      metadata: { generatedOpportunityId: draft.id },
    });

    const approverId = ctx.personId ?? ctx.userId ?? null;
    const updated = await this.repository.updateDraft(id, {
      status: 'published',
      opportunityId: opportunity.id,
      approvedAt: new Date(),
      approvedBy: approverId,
    });

    let decisionId: string | null = null;
    if (input.requireDecision) {
      const agent = await this.agentsRepository.ensureOpportunityAgent();
      if (agent) {
        const decision = await this.decisionEngine.recordDecision({
          agentId: agent.id,
          entityType: 'GeneratedOpportunity',
          entityId: id,
          decisionType: 'publish_generated_opportunity',
          payload: {
            opportunityId: opportunity.id,
            title: draft.title,
            suggestedType: draft.suggestedType,
          },
          confidence: draft.confidence,
          status: 'pending',
        });
        decisionId = decision.id;
      }
    }

    if (approverId) {
      await this.activityService.recordInternal({
        actorPersonId: approverId,
        action: 'opportunity_generation_published',
        targetType: 'Opportunity',
        targetId: opportunity.id,
        metadata: {
          generatedOpportunityId: id,
          suggestedType: draft.suggestedType,
          city: draft.city,
          genre: draft.genre,
          decisionId,
        },
        visibility: 'public',
      });
    }

    return {
      draft: this.toSummary(updated ?? draft),
      opportunityId: opportunity.id,
      decisionId,
      updatedAt: new Date().toISOString(),
    };
  }

  async dismissDraft(
    id: string,
    ctx: MembershipContext,
  ): Promise<OpportunityGenerationDismissPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const draft = await this.repository.findDraft(id);
    if (!draft) throw new NotFoundException(`Generated opportunity ${id} not found`);
    if (draft.status === 'published') {
      throw new NotFoundException(`Draft ${id} is already published`);
    }

    const updated = await this.repository.updateDraft(id, { status: 'dismissed' });
    return {
      draft: this.toSummary(updated ?? draft),
      updatedAt: new Date().toISOString(),
    };
  }

  /** Automation V2 stub — trigger generation when insight rule matches. */
  async stubRunOnInsightMatch(
    insight: Record<string, unknown>,
    actorPersonId?: string | null,
  ): Promise<{ stubbed: true; wouldRun: boolean; insightKeys: string[] }> {
    const keys = Object.keys(insight);
    const wouldRun =
      keys.includes('cityHeat') ||
      keys.includes('communityGrowth') ||
      keys.includes('talentDiscoveryAlert');

    this.logger.log(
      `[Automation V2 stub] opportunity_generation_on_insight match=${wouldRun} keys=${keys.join(',')}`,
    );

    if (wouldRun && actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'automation_action_stubbed',
        targetType: 'OpportunityGenerationRun',
        targetId: 'stub-insight-trigger',
        metadata: {
          workflow: 'opportunity_generation_on_insight',
          insight,
        },
        visibility: 'private',
      });
    }

    return { stubbed: true, wouldRun, insightKeys: keys };
  }

  async listPublishedForMatching(limit = 30) {
    if (!this.repository.isAvailable()) return [];
    const rows = await this.repository.listPublished(limit);
    return rows.map((row) => this.toSummary(row));
  }

  private async collectHotSignals(limit: number): Promise<OpportunityGenerationHotSignal[]> {
    const periodMs = TALENT_DISCOVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000;
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodMs);
    const previousStart = new Date(now.getTime() - periodMs * 2);

    const [citySeeds, communitySnapshots, artistCandidates, brandStubs] = await Promise.all([
      this.agentsRepository.listDistinctCommunityCities(Math.max(limit, 10)),
      this.agentsRepository.listCommunityAudienceSnapshots(limit * 2),
      this.agentsRepository.listTopGrowthArtistSnapshots(
        limit,
        GRANT_EMERGING_ARTIST_GROWTH_THRESHOLD,
      ),
      this.repository.listBrandFundStubs(5),
    ]);

    const signals: OpportunityGenerationHotSignal[] = [];

    for (const seed of citySeeds) {
      const city = seed.city?.trim();
      if (!city) continue;
      const genres = seed.genres?.length ? seed.genres : ['hip-hop'];

      for (const genre of genres.slice(0, 2)) {
        const citySignal = await this.evaluateCityGenreShowcase(
          city,
          genre,
          communitySnapshots,
          currentStart,
          previousStart,
          now,
        );
        if (citySignal) signals.push(citySignal);
      }
    }

    for (const row of communitySnapshots) {
      const collaboration = await this.evaluateCommunityCollaboration(row);
      if (collaboration) signals.push(collaboration);
    }

    for (const artist of artistCandidates.slice(0, 3)) {
      for (const brand of brandStubs.slice(0, 1)) {
        const grant = this.evaluateBrandGrant(artist, brand);
        if (grant) signals.push(grant);
      }
    }

    signals.sort((a, b) => b.confidence - a.confidence);
    return signals.slice(0, limit);
  }

  private async evaluateCityGenreShowcase(
    city: string,
    genre: string,
    communitySnapshots: Awaited<
      ReturnType<AgentsRepository['listCommunityAudienceSnapshots']>
    >,
    currentStart: Date,
    previousStart: Date,
    now: Date,
  ): Promise<OpportunityGenerationHotSignal | null> {
    const cityCommunities = communitySnapshots.filter(
      (row) =>
        row.community.city?.toLowerCase() === city.toLowerCase() &&
        (row.community.genres ?? []).some((g) => g.toLowerCase() === genre.toLowerCase()),
    );

    const avgMemberGrowth =
      cityCommunities.length > 0
        ? cityCommunities.reduce((sum, row) => sum + row.memberGrowth, 0) / cityCommunities.length
        : 0;

    const [eventsCurrent, eventsPrevious, activityCurrent, activityPrevious] =
      await Promise.all([
        this.agentsRepository.countEventsInCityBetween(city, currentStart, now, genre),
        this.agentsRepository.countEventsInCityBetween(city, previousStart, currentStart, genre),
        this.agentsRepository.countActivityForTargetBetween('City', city, currentStart, now),
        this.agentsRepository.countActivityForTargetBetween(
          'City',
          city,
          previousStart,
          currentStart,
        ),
      ]);

    const eventDensityGrowth = computeActivityFeedVelocityStub(eventsCurrent, eventsPrevious);
    const activityVelocity = computeActivityFeedVelocityStub(activityCurrent, activityPrevious);
    const audienceGrowth = computeCitySceneGrowth({
      avgMemberGrowth,
      eventDensityGrowth,
      activityVelocity,
    });
    const communityActivity = Math.max(avgMemberGrowth, activityVelocity);

    if (
      audienceGrowth < SHOWCASE_AUDIENCE_GROWTH_THRESHOLD ||
      communityActivity < SHOWCASE_COMMUNITY_ACTIVITY_THRESHOLD
    ) {
      return null;
    }

    const confidence = scoreShowcaseConfidence(audienceGrowth, communityActivity);
    const reasonCodes = ['city_growth', 'genre_activity', 'event_density'];
    if (audienceGrowth >= EMERGING_CITY_SCENE_THRESHOLD) reasonCodes.push('emerging_scene');

    return {
      id: `signal-${city}-${genre}-showcase`.toLowerCase().replace(/\s+/g, '-'),
      ruleId: OPPORTUNITY_GENERATION_RULE_IDS.cityGenreShowcase,
      label: `${city} ${genre} — showcase window`,
      city,
      genre,
      audienceGrowth: round2(audienceGrowth),
      communityActivity: round2(communityActivity),
      memberGrowth: round2(avgMemberGrowth),
      confidence,
      suggestedType: 'showcase_event',
      reasonCodes,
      updatedAt: now.toISOString(),
    };
  }

  private async evaluateCommunityCollaboration(
    row: Awaited<ReturnType<AgentsRepository['listCommunityAudienceSnapshots']>>[number],
  ): Promise<OpportunityGenerationHotSignal | null> {
    if (row.memberGrowth < COLLABORATION_MEMBER_GROWTH_THRESHOLD) return null;

    const city = row.community.city;
    const genre = row.community.genres?.[0] ?? null;
    if (!city || !genre) return null;

    const artistClusterCount = await this.repository.countArtistsInCityGenre(city, genre);
    if (artistClusterCount < COLLABORATION_ARTIST_CLUSTER_MIN) return null;

    const confidence = scoreCollaborationConfidence(row.memberGrowth, artistClusterCount);

    return {
      id: `signal-community-${row.communityId}`,
      ruleId: OPPORTUNITY_GENERATION_RULE_IDS.communityCollaboration,
      label: `${row.community.name} collaboration spike`,
      city,
      genre,
      communityId: row.communityId,
      audienceGrowth: null,
      communityActivity: round2(row.fanGrowth),
      memberGrowth: round2(row.memberGrowth),
      confidence,
      suggestedType: 'collaboration_open_call',
      reasonCodes: ['community_spike', 'artist_cluster'],
      updatedAt: new Date().toISOString(),
    };
  }

  private evaluateBrandGrant(
    artist: Awaited<ReturnType<AgentsRepository['listTopGrowthArtistSnapshots']>>[number],
    brand: Awaited<ReturnType<OpportunityGenerationRepository['listBrandFundStubs']>>[number],
  ): OpportunityGenerationHotSignal | null {
    if (artist.audienceGrowth < GRANT_EMERGING_ARTIST_GROWTH_THRESHOLD) return null;

    const confidence = scoreGrantConfidence(artist.audienceGrowth, true);
    return {
      id: `signal-grant-${brand.id}-${artist.artistId}`,
      ruleId: OPPORTUNITY_GENERATION_RULE_IDS.brandGrantEmerging,
      label: `${brand.name} grant × ${artist.artist.name}`,
      city: null,
      genre: null,
      audienceGrowth: round2(artist.audienceGrowth),
      communityActivity: null,
      memberGrowth: null,
      confidence,
      suggestedType: 'grant_opportunity',
      reasonCodes: ['brand_fund_stub', 'emerging_artist'],
      updatedAt: new Date().toISOString(),
    };
  }

  private async materializeDraftFromSignal(
    signal: OpportunityGenerationHotSignal,
  ): Promise<GeneratedOpportunitySummary | null> {
    const snapshot: OpportunityGenerationSignalSnapshot = {
      ruleId: signal.ruleId,
      city: signal.city,
      genre: signal.genre,
      audienceGrowth: signal.audienceGrowth ?? undefined,
      communityActivity: signal.communityActivity ?? undefined,
      memberGrowth: signal.memberGrowth ?? undefined,
      reasonCodes: signal.reasonCodes,
    };

    let title = signal.label;
    let description = '';
    let targetEntityType: string | null = null;
    let targetEntityId: string | null = null;
    let source: 'system' | 'brand' | 'community' = 'system';

    if (signal.suggestedType === 'showcase_event' && signal.city && signal.genre) {
      title = buildShowcaseEventTitle(signal.city, signal.genre);
      description = `Audience growth +${Math.round(signal.audienceGrowth ?? 0)}% and community activity +${Math.round(signal.communityActivity ?? 0)}% suggest a curated showcase in ${signal.city}.`;
      targetEntityType = 'City';
      targetEntityId = signal.city;
    } else if (signal.suggestedType === 'collaboration_open_call') {
      const communityId = signal.communityId ?? signal.id.replace('signal-community-', '');
      targetEntityType = 'Community';
      targetEntityId = communityId;
      title = buildCollaborationTitle(
        signal.label.replace(' collaboration spike', ''),
        signal.city,
      );
      description = `Community member growth +${Math.round(signal.memberGrowth ?? 0)}% with a local artist cluster — open call for collaborations.`;
      source = 'community';
    } else if (signal.suggestedType === 'grant_opportunity') {
      const parts = signal.id.split('-');
      const brandId = parts[2];
      const artistId = parts[3];
      targetEntityType = 'Artist';
      targetEntityId = artistId;
      const brandName = signal.label.split(' grant × ')[0] ?? 'Brand partner';
      title = buildGrantTitle(brandName, signal.genre);
      description = `Brand fund stub aligned with fast-growing artist (+${Math.round(signal.audienceGrowth ?? 0)}% audience).`;
      snapshot.brandId = brandId;
      snapshot.brandName = brandName;
      source = 'brand';
    }

    const generationReason = signal.reasonCodes.join(', ');

    const row = await this.repository.createDraft({
      source,
      generationReason,
      signalSnapshot: snapshot as unknown as Record<string, unknown>,
      suggestedType: signal.suggestedType,
      title,
      description,
      city: signal.city,
      genre: signal.genre,
      targetEntityType,
      targetEntityId,
      confidence: signal.confidence,
      status: 'pending_approval',
    });

    return row ? this.toSummary(row) : null;
  }

  private applyScopeFilter(
    signals: OpportunityGenerationHotSignal[],
    city?: string,
    genre?: string,
  ) {
    return signals.filter((signal) => {
      if (city && signal.city?.toLowerCase() !== city.toLowerCase()) return false;
      if (genre && signal.genre?.toLowerCase() !== genre.toLowerCase()) return false;
      return true;
    });
  }

  private toSummary(row: {
    id: string;
    source: string;
    generationReason: string;
    signalSnapshot: unknown;
    suggestedType: string;
    title: string;
    description: string | null;
    city: string | null;
    genre: string | null;
    targetEntityType: string | null;
    targetEntityId: string | null;
    confidence: number;
    status: string;
    opportunityId: string | null;
    createdAt: Date;
    approvedAt: Date | null;
    approvedBy: string | null;
  }): GeneratedOpportunitySummary {
    return {
      id: row.id,
      source: row.source as GeneratedOpportunitySummary['source'],
      generationReason: row.generationReason,
      signalSnapshot: parseJsonRecord(row.signalSnapshot),
      suggestedType: row.suggestedType as GeneratedOpportunitySummary['suggestedType'],
      title: row.title,
      description: row.description,
      city: row.city,
      genre: row.genre,
      targetEntityType: row.targetEntityType,
      targetEntityId: row.targetEntityId,
      confidence: row.confidence,
      status: row.status as GeneratedOpportunitySummary['status'],
      opportunityId: row.opportunityId,
      createdAt: row.createdAt.toISOString(),
      approvedAt: row.approvedAt?.toISOString() ?? null,
      approvedBy: row.approvedBy,
    };
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Opportunity generation models unavailable');
    }
  }

  private assertAdmin(ctx: MembershipContext) {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required');
    }
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
