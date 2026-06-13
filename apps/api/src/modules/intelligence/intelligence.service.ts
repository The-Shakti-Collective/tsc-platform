import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  calculateAudienceScores,
  calculateCityIntelligence,
  summarizeEntityGraph,
  toSnapshotScores,
} from '@tsc/analytics';
import type { GraphEntityType } from '@tsc/database';
import {
  canManageArtist,
  type MembershipContext,
} from '@tsc/permissions';
import {
  IntelligenceAnalyticsRepository,
  parseSnapshotScores,
} from './intelligence-analytics.repository';
import { AudienceService } from '../audience/audience.service';
import { AutonomousWorkflowService } from '../agents/autonomous-workflow.service';
import { CareerAgentService } from '../agents/career-agent.service';
import { ForecastAgentService } from '../agents/forecast-agent.service';
import { AutomationEngineV2Service } from './automation-engine-v2.service';
import { CommandCenterV3Repository } from './command-center-v3.repository';
import { CommandCenterV4Repository } from './command-center-v4.repository';
import { ParticipationAnalyticsRepository } from './participation-analytics.repository';
import { opportunityArtistIdFromRow } from '../opportunity/application-metadata';
import type {
  ArtistHealthPayload,
  CityIntelligencePayload,
  CityRecommendationsPayload,
  CommandCenterPayload,
  CommandCenterV3Payload,
  CommandCenterV4AudienceKpis,
  CommandCenterV4Payload,
  CommandCenterV5Payload,
  CommandCenterV5ActionableInsight,
  CommunityIntelligencePayload,
  EcosystemGraphPayload,
  ExecutiveAggregatePayload,
  FanScoresPayload,
  FanSegmentMember,
  FanSegmentsPayload,
  IntelligenceActionResult,
  OpportunityHeat,
  OpportunityScoreItem,
  OpportunityScoresPayload,
  ParticipationDashboardPayload,
  RecommendationListPayload,
  RiskAlert,
  SuggestedOpportunity,
} from './types';

const DEFAULT_PERIOD_DAYS = 30;

@Injectable()
export class IntelligenceService {
  constructor(
    private readonly intelligenceRepository: IntelligenceAnalyticsRepository,
    private readonly commandCenterV3Repository: CommandCenterV3Repository,
    private readonly commandCenterV4Repository: CommandCenterV4Repository,
    private readonly participationRepository: ParticipationAnalyticsRepository,
    private readonly audienceService: AudienceService,
    private readonly workflowService: AutonomousWorkflowService,
    private readonly forecastAgent: ForecastAgentService,
    private readonly careerAgent: CareerAgentService,
    private readonly automationEngineV2: AutomationEngineV2Service,
  ) {}

  async getSuggestedOpportunities(
    artistId: string | undefined,
    ctx: MembershipContext,
  ): Promise<{ artistId: string | null; suggestions: SuggestedOpportunity[]; updatedAt: string }> {
    if (artistId) this.assertArtistAccess(ctx, artistId);

    const rows = artistId
      ? await this.intelligenceRepository.listSuggestedOpportunities(artistId)
      : await this.intelligenceRepository.listOpenOpportunities();

    const suggestions: SuggestedOpportunity[] = rows.slice(0, 10).map((row, index) => ({
      id: row.id,
      title: row.title,
      reason: opportunityArtistIdFromRow(row) ? 'Linked to artist pipeline' : 'Open marketplace opportunity',
      score: round2(scoreOpportunity(row) - index * 0.5),
      source: row.source ?? 'pipeline',
    }));

    return {
      artistId: artistId ?? null,
      suggestions,
      updatedAt: new Date().toISOString(),
    };
  }

  async getOpportunityScores(ctx: MembershipContext): Promise<OpportunityScoresPayload> {
    if (!ctx.roles.includes('admin') && ctx.artistMemberships.length === 0) {
      throw new ForbiddenException('Artist or admin access required');
    }

    const artistId =
      ctx.roles.includes('admin') || ctx.artistMemberships.length === 0
        ? undefined
        : ctx.artistMemberships[0];
    const rows = await this.intelligenceRepository.listOpenOpportunities(artistId);

    const items: OpportunityScoreItem[] = rows.map((row) => {
      const score = scoreOpportunity(row);
      return {
        id: row.id,
        title: row.title,
        status: row.status,
        score,
        bucket: bucketOpportunity(score),
        artistId: opportunityArtistIdFromRow(row),
        value: row.value ? Number(row.value) : null,
        updatedAt: row.updatedAt.toISOString(),
      };
    });

    return {
      hot: items.filter((item) => item.bucket === 'hot'),
      warm: items.filter((item) => item.bucket === 'warm'),
      cold: items.filter((item) => item.bucket === 'cold'),
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtistHealth(artistId: string, ctx: MembershipContext): Promise<ArtistHealthPayload> {
    this.assertArtistAccess(ctx, artistId);

    const artist = await this.intelligenceRepository.findArtist(artistId);
    if (!artist) throw new NotFoundException(`Artist ${artistId} not found`);

    const periodStart = daysAgo(DEFAULT_PERIOD_DAYS);
    const previousStart = daysAgo(DEFAULT_PERIOD_DAYS * 2);

    const [
      followerCount,
      currentFollowers,
      previousFollowers,
      communityMembers,
      activeMembers,
      eventCount,
    ] = await Promise.all([
      this.intelligenceRepository.countFollowers(artistId),
      this.intelligenceRepository.countFollowersSince(artistId, periodStart),
      this.intelligenceRepository.countFollowersBetween(artistId, previousStart, periodStart),
      this.intelligenceRepository.countCommunityMembers(artistId),
      this.intelligenceRepository.countActiveMembers(artistId, periodStart),
      this.intelligenceRepository.countArtistEvents(artistId),
    ]);

    const growthPercent =
      previousFollowers > 0
        ? round2(((currentFollowers - previousFollowers) / previousFollowers) * 100)
        : currentFollowers > 0
          ? 100
          : 0;
    const engagementRate =
      communityMembers > 0 ? round2((activeMembers / communityMembers) * 100) : 0;

    const healthScore = clamp(
      40 +
        Math.min(growthPercent, 20) +
        engagementRate * 0.3 +
        Math.min(eventCount * 5, 15) +
        Math.min(followerCount / 100, 10),
    );

    return {
      artistId,
      healthScore: round2(healthScore),
      status: healthScore >= 70 ? 'healthy' : healthScore >= 45 ? 'watch' : 'at_risk',
      followerCount,
      communityMembers,
      engagementRate,
      growthPercent,
      eventCount,
      updatedAt: new Date().toISOString(),
    };
  }

  async getArtistRiskAlerts(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<{ artistId: string; alerts: RiskAlert[]; updatedAt: string }> {
    const [health, segments] = await Promise.all([
      this.getArtistHealth(artistId, ctx),
      this.getFanSegments(artistId, ctx),
    ]);

    const alerts: RiskAlert[] = [];
    const now = new Date().toISOString();

    if (health.growthPercent < 0) {
      alerts.push({
        id: `${artistId}-growth-decline`,
        severity: health.growthPercent < -10 ? 'high' : 'medium',
        code: 'FOLLOWER_DECLINE',
        message: `Follower growth is ${health.growthPercent}% over the last ${DEFAULT_PERIOD_DAYS} days.`,
        detectedAt: now,
      });
    }

    if (health.engagementRate < 20 && health.communityMembers > 0) {
      alerts.push({
        id: `${artistId}-low-engagement`,
        severity: health.engagementRate < 10 ? 'high' : 'medium',
        code: 'LOW_ENGAGEMENT',
        message: `Community engagement rate is ${health.engagementRate}%.`,
        detectedAt: now,
      });
    }

    if (segments.dormant.length > segments.super.length + segments.active.length) {
      alerts.push({
        id: `${artistId}-dormant-majority`,
        severity: 'medium',
        code: 'DORMANT_FANS',
        message: `${segments.dormant.length} dormant fans exceed active segments.`,
        detectedAt: now,
      });
    }

    if (health.eventCount === 0) {
      alerts.push({
        id: `${artistId}-no-events`,
        severity: 'low',
        code: 'NO_EVENTS',
        message: 'No scheduled or historical events found for this artist.',
        detectedAt: now,
      });
    }

    return { artistId, alerts, updatedAt: now };
  }

  async getFanScores(
    personId: string,
    ctx: MembershipContext,
  ): Promise<FanScoresPayload> {
    if (ctx.userId !== personId && !ctx.roles.includes('admin')) {
      const managesArtist = ctx.artistMemberships.length > 0;
      if (!managesArtist) {
        throw new ForbiddenException('Cannot view fan scores for this person');
      }
    }

    const snapshot = await this.intelligenceRepository.findLatestAudienceSnapshot(personId);
    if (snapshot) {
      const parsed = parseSnapshotScores(snapshot.metadata);
      if (parsed) {
        return {
          personId,
          artistId: snapshot.artistId,
          scores: parsed,
          snapshotDate: snapshot.snapshotDate.toISOString().slice(0, 10),
          calculatedAt: parsed.calculatedAt,
        };
      }
    }

    const input = await this.intelligenceRepository.buildAudienceInput(personId);
    const scores = calculateAudienceScores(input);
    return {
      personId,
      artistId: null,
      scores,
      snapshotDate: null,
      calculatedAt: new Date().toISOString(),
    };
  }

  async getFanSegments(
    artistId: string,
    ctx: MembershipContext,
  ): Promise<FanSegmentsPayload> {
    this.assertArtistAccess(ctx, artistId);

    const rows = await this.intelligenceRepository.listFanSegmentRows(artistId);
    const buckets = {
      super: [] as FanSegmentMember[],
      active: [] as FanSegmentMember[],
      casual: [] as FanSegmentMember[],
      dormant: [] as FanSegmentMember[],
    };

    for (const row of rows) {
      const scores = calculateAudienceScores(row.input);
      const member: FanSegmentMember = {
        personId: row.personId,
        name: row.name,
        compositeScore: scores.compositeScore,
        lastActiveDays: row.lastActiveDays,
      };

      if (row.lastActiveDays >= 30 || scores.compositeScore < 20) {
        buckets.dormant.push(member);
      } else if (scores.compositeScore >= 80) {
        buckets.super.push(member);
      } else if (scores.compositeScore >= 50) {
        buckets.active.push(member);
      } else {
        buckets.casual.push(member);
      }
    }

    for (const key of Object.keys(buckets) as Array<keyof typeof buckets>) {
      buckets[key].sort((a, b) => b.compositeScore - a.compositeScore);
    }

    return {
      artistId,
      ...buckets,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCityIntelligence(city: string): Promise<CityIntelligencePayload> {
    const decoded = decodeURIComponent(city);
    const snapshot = await this.intelligenceRepository.findLatestCitySnapshot(decoded);

    const input = snapshot
      ? {
          city: snapshot.city,
          artistsCount: snapshot.artistsCount,
          fansCount: snapshot.fansCount,
          venuesCount: snapshot.venuesCount,
          eventsCount: snapshot.eventsCount,
          revenue: snapshot.revenue ? Number(snapshot.revenue) : undefined,
          communityMembers: snapshot.communityMembers,
        }
      : await this.intelligenceRepository.computeLiveCityCounts(decoded);

    const metrics = calculateCityIntelligence(input);
    return {
      ...metrics,
      snapshotDate: snapshot
        ? snapshot.snapshotDate.toISOString().slice(0, 10)
        : null,
      live: !snapshot,
    };
  }

  async getCityRecommendations(city: string): Promise<CityRecommendationsPayload> {
    const decoded = decodeURIComponent(city);
    const [cityIntel, [venues, events, curators]] = await Promise.all([
      this.getCityIntelligence(decoded),
      this.intelligenceRepository.listCityRecommendations(decoded),
    ]);

    const recommendations = [
      ...venues.map((venue, index) => ({
        entityType: 'Venue',
        entityId: venue.id,
        title: venue.name,
        reason: 'Active venue in city',
        score: round2(cityIntel.heatScore - index),
      })),
      ...events.map((event, index) => ({
        entityType: 'Event',
        entityId: event.id,
        title: event.title,
        reason: 'Upcoming city event',
        score: round2(cityIntel.heatScore - index - 5),
      })),
      ...curators.map((curator, index) => ({
        entityType: 'Curator',
        entityId: curator.id,
        title: curator.name,
        reason: 'Local curator network',
        score: round2(cityIntel.heatScore - index - 10),
      })),
    ]
      .sort((a, b) => b.score - a.score)
      .slice(0, 15);

    return {
      city: decoded,
      heatScore: cityIntel.heatScore,
      recommendations,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCommunityIntelligence(
    communityId: string,
    ctx: MembershipContext,
  ): Promise<CommunityIntelligencePayload> {
    const community = await this.intelligenceRepository.findCommunity(communityId);
    if (!community) throw new NotFoundException(`Community ${communityId} not found`);

    if (
      community.artistId &&
      !canManageArtist(ctx, community.artistId) &&
      !ctx.roles.includes('admin')
    ) {
      throw new ForbiddenException('Cannot view intelligence for this community');
    }

    const since = daysAgo(30);
    const [postCount30d, activeAuthors, members] = await Promise.all([
      this.intelligenceRepository.countCommunityPostsSince(communityId, since),
      this.intelligenceRepository.countActiveCommunityMembers(communityId, since),
      this.intelligenceRepository.listCommunityMemberGenres(communityId),
    ]);

    const memberCount = community._count.members;
    const engagementRate =
      memberCount > 0 ? round2((activeAuthors.length / memberCount) * 100) : 0;
    const genreCounts = new Map<string, number>();
    for (const member of members) {
      for (const genre of member.person.profile?.genres ?? []) {
        genreCounts.set(genre, (genreCounts.get(genre) ?? 0) + 1);
      }
    }

    return {
      communityId,
      memberCount,
      activeMemberCount: activeAuthors.length,
      postCount30d,
      engagementRate,
      topGenres: [...genreCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([genre]) => genre),
      updatedAt: new Date().toISOString(),
    };
  }

  async getRecommendations(
    kind: 'artists' | 'events' | 'workshops',
    personId: string,
    ctx: MembershipContext,
  ): Promise<RecommendationListPayload> {
    if (ctx.userId !== personId && !ctx.roles.includes('admin')) {
      throw new ForbiddenException('Cannot view recommendations for this person');
    }

    const entityType = kind === 'artists' ? 'Artist' : 'Event';
    const candidates = await this.intelligenceRepository.listRecommendationCandidates(
      personId,
      entityType,
    );
    const filtered =
      kind === 'workshops'
        ? candidates.filter((row) =>
            row.reasonCodes.some((code) => code.toLowerCase().includes('workshop')) ||
            row.metadata &&
              typeof row.metadata === 'object' &&
              !Array.isArray(row.metadata) &&
              String((row.metadata as Record<string, unknown>).eventType ?? '')
                .toLowerCase()
                .includes('workshop'),
          )
        : candidates;

    const titleById = await this.intelligenceRepository.resolveRecommendationTitles(
      entityType,
      filtered.map((row) => row.entityId),
    );

    return {
      personId,
      entityType: kind,
      items: filtered.map((row) => ({
        entityId: row.entityId,
        score: row.score,
        reasonCodes: row.reasonCodes,
        title: titleById.get(row.entityId) ?? null,
      })),
      updatedAt: new Date().toISOString(),
    };
  }

  async getEcosystemGraph(
    entityType: GraphEntityType,
    entityId: string,
    ctx: MembershipContext,
  ): Promise<EcosystemGraphPayload> {
    if (entityType === 'Artist') this.assertArtistAccess(ctx, entityId);
    if (!ctx.roles.includes('admin') && entityType !== 'Artist') {
      throw new ForbiddenException('Admin or artist manager access required');
    }

    const edges = await this.intelligenceRepository.listEntityGraphEdges(
      entityType,
      entityId,
    );
    const summary = summarizeEntityGraph(edges, entityType, entityId);
    return { ...summary, updatedAt: new Date().toISOString() };
  }

  async getCommandCenter(
    period: 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<CommandCenterPayload> {
    const execPeriod = period === 'monthly' ? 'monthly' : 'weekly';
    const periodDays = period === 'monthly' ? 30 : 7;
    const periodStart = daysAgo(periodDays);

    const [executive, opportunityScores, artists, citySnapshots, communities, revenueAgg] =
      await Promise.all([
        this.getExecutiveAggregate(execPeriod, ctx),
        this.getOpportunityScores(ctx),
        this.intelligenceRepository.listArtistsWithMetrics(30),
        this.intelligenceRepository.listTopCitySnapshots(12),
        this.intelligenceRepository.listCommunitiesForDashboard(15),
        this.intelligenceRepository.aggregateRevenueSince(periodStart),
      ]);

    const topOpportunities = [...opportunityScores.hot, ...opportunityScores.warm]
      .sort((a, b) => b.score - a.score)
      .slice(0, 8);

    const artistRiskRows = await Promise.all(
      artists.map(async (artist) => {
        const healthScore = await this.buildArtistHealthScore(artist.id);
        const status: 'healthy' | 'watch' | 'at_risk' =
          healthScore >= 70 ? 'healthy' : healthScore >= 45 ? 'watch' : 'at_risk';
        let alertCount = 0;
        let topAlert: string | null = null;
        if (status !== 'healthy') {
          try {
            const risk = await this.getArtistRiskAlerts(artist.id, ctx);
            alertCount = risk.alerts.length;
            topAlert = risk.alerts[0]?.message ?? null;
          } catch {
            alertCount = 0;
          }
        }
        return {
          artistId: artist.id,
          name: artist.displayName ?? artist.slug ?? artist.id,
          healthScore: round2(healthScore),
          status,
          alertCount,
          topAlert,
        };
      }),
    );

    const artistsAtRisk = artistRiskRows
      .filter((row) => row.status === 'at_risk' || row.status === 'watch')
      .sort((a, b) => a.healthScore - b.healthScore)
      .slice(0, 10);

    const citiesHeatingUp = (
      citySnapshots as Array<{
        city: string;
        artistsCount: number;
        fansCount: number;
        venuesCount: number;
        eventsCount: number;
        revenue: number | null;
        communityMembers: number;
      }>
    )
      .map((row) => {
        const metrics = calculateCityIntelligence({
          city: row.city,
          artistsCount: row.artistsCount,
          fansCount: row.fansCount,
          venuesCount: row.venuesCount,
          eventsCount: row.eventsCount,
          revenue: row.revenue ? Number(row.revenue) : undefined,
          communityMembers: row.communityMembers,
        });
        return {
          city: row.city,
          heatScore: metrics.heatScore,
          artistsCount: row.artistsCount,
          eventsCount: row.eventsCount,
          fansCount: row.fansCount,
        };
      })
      .sort((a, b) => b.heatScore - a.heatScore)
      .slice(0, 6);

    const communitiesGrowingFast = (
      await Promise.all(
        communities.map(async (community) => {
          const memberCount = community._count.members;
          const newMembers = await this.intelligenceRepository.countCommunityMembersSince(
            community.id,
            periodStart,
          );
          const growthPct =
            memberCount > 0 ? round2((newMembers / memberCount) * 100) : newMembers > 0 ? 100 : 0;
          const intel = await this.getCommunityIntelligence(community.id, ctx);
          return {
            communityId: community.id,
            name: community.name,
            memberCount,
            newMembers,
            growthPct,
            engagementRate: intel.engagementRate,
          };
        }),
      )
    )
      .sort((a, b) => b.growthPct - a.growthPct || b.memberCount - a.memberCount)
      .slice(0, 6);

    const periodRevenue = revenueAgg._sum.amount ? Number(revenueAgg._sum.amount) : 0;
    const revenueMultiplier = period === 'monthly' ? 1 : 4.3;
    const revenueProjection = round2(periodRevenue * revenueMultiplier);

    const bookingBase = executive.metrics.openOpportunities + executive.metrics.hotOpportunities * 2;
    const bookingProjection = round2(bookingBase * (period === 'monthly' ? 1.2 : 1.5));
    const participation = await this.getParticipationDashboard(period, ctx);
    const v3 = await this.buildCommandCenterV3(period, artistsAtRisk.length);

    return {
      period,
      topOpportunities,
      artistsAtRisk,
      citiesHeatingUp,
      communitiesGrowingFast,
      participation,
      v3,
      revenueForecast: {
        projection: revenueProjection,
        currency: 'INR',
        period: period === 'monthly' ? '30d' : '7d',
        label: 'Revenue projection',
        basedOn: `Platform revenue aggregate over last ${periodDays} days`,
        disclaimer: 'Projection from existing aggregates — not a new forecasting model.',
      },
      bookingDemandForecast: {
        projection: bookingProjection,
        currency: 'INR',
        period: period === 'monthly' ? '30d' : '7d',
        label: 'Booking demand projection',
        basedOn: 'Open and hot marketplace opportunities',
        disclaimer: 'Projection from pipeline counts — not a new forecasting model.',
        openOpportunities: executive.metrics.openOpportunities,
        hotOpportunities: executive.metrics.hotOpportunities,
      },
      executive,
      updatedAt: new Date().toISOString(),
    };
  }

  async getCommandCenterV3(
    period: 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<CommandCenterPayload> {
    return this.getCommandCenter(period, ctx);
  }

  async getCommandCenterV4(
    period: 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<CommandCenterV4Payload> {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required for command center v4');
    }

    const [base, audienceKpis, audienceInsights] = await Promise.all([
      this.getCommandCenter(period, ctx),
      this.buildCommandCenterV4AudienceKpis(),
      this.audienceService.getCommandCenterAudienceBlock(5),
    ]);

    return {
      period: base.period,
      audienceKpis,
      insights: {
        mostLoyalCommunities: audienceInsights.mostLoyalCommunities,
        highestGrowthArtists: audienceInsights.highestGrowthArtists,
        highestChurnRisk: audienceInsights.highestChurnRisk,
      },
      topOpportunities: base.topOpportunities,
      artistsAtRisk: base.artistsAtRisk,
      citiesHeatingUp: base.citiesHeatingUp,
      communitiesGrowingFast: base.communitiesGrowingFast,
      revenueForecast: base.revenueForecast,
      bookingDemandForecast: base.bookingDemandForecast,
      executive: base.executive,
      participation: base.participation,
      v3: base.v3,
      updatedAt: new Date().toISOString(),
    };
  }

  private async buildCommandCenterV4AudienceKpis(): Promise<CommandCenterV4AudienceKpis> {
    const [
      totalFans,
      monthlyActiveFans,
      superfans,
      membershipRevenue,
      healthMetrics,
    ] = await Promise.all([
      this.commandCenterV4Repository.countTotalFans(),
      this.commandCenterV4Repository.countMonthlyActiveFans(),
      this.commandCenterV4Repository.countSuperfansGoldPlus(),
      this.commandCenterV4Repository.sumMembershipMrrStub(),
      this.commandCenterV4Repository.avgAudienceHealthMetrics(),
    ]);

    return {
      totalFans,
      monthlyActiveFans,
      superfans,
      membershipRevenue: {
        mrrStub: membershipRevenue.mrrStub,
        currency: 'INR',
        activeSubscriptions: membershipRevenue.activeSubscriptions,
      },
      audienceGrowth: healthMetrics.avgGrowth,
      audienceChurn: {
        avgChurn: healthMetrics.avgChurn,
        churnRiskArtistCount: healthMetrics.churnRiskArtistCount,
      },
    };
  }

  private async buildCommandCenterV3(
    period: 'weekly' | 'monthly',
    atRiskCount: number,
  ): Promise<CommandCenterV3Payload> {
    const periodDays = period === 'monthly' ? 30 : 7;
    const periodStart = daysAgo(periodDays);
    const weekStart = daysAgo(7);

    const [
      openPipelineValue,
      closedThisPeriod,
      activeCount,
      closingSoon,
      activeBrands,
      newThisWeek,
      pipelineFunnel,
      highGrowthCount,
      topBrands,
      audience,
    ] = await Promise.all([
      this.commandCenterV3Repository.sumOpenPipelineValue(),
      this.commandCenterV3Repository.sumClosedRevenueSince(periodStart),
      this.commandCenterV3Repository.countActiveOpportunities(),
      this.commandCenterV3Repository.countOpportunitiesClosingSoon(7),
      this.commandCenterV3Repository.countActiveBrands(),
      this.commandCenterV3Repository.countBrandsCreatedSince(weekStart),
      this.commandCenterV3Repository.groupDealsByStage(),
      this.commandCenterV3Repository.countHighGrowthArtists(),
      this.commandCenterV3Repository.listTopActiveBrands(5),
      this.audienceService.getCommandCenterAudienceBlock(5),
    ]);

    const byStage: Record<string, number> = {};
    let totalOpen = 0;
    for (const row of pipelineFunnel) {
      byStage[row.stage] = row.count;
      if (!['completed', 'paid'].includes(row.stage)) {
        totalOpen += row.count;
      }
    }

    return {
      revenue: {
        openPipelineValue: round2(openPipelineValue),
        closedThisPeriod: round2(closedThisPeriod),
        currency: 'INR',
      },
      opportunities: {
        activeCount,
        closingSoon,
      },
      brands: {
        activeCount: activeBrands,
        newThisWeek,
        topBrands: topBrands.map((brand) => ({
          id: brand.id,
          name: brand.name,
          trustScore: brand.trustScore,
          verified: brand.verified,
          opportunityCount: brand._count?.opportunities ?? 0,
        })),
      },
      artists: {
        highGrowthCount,
        atRiskCount,
      },
      deals: {
        byStage,
        pipelineFunnel,
        totalOpen,
      },
      audience,
      updatedAt: new Date().toISOString(),
    };
  }

  async getParticipationDashboard(
    period: 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<ParticipationDashboardPayload> {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required for participation dashboard');
    }

    const periodDays = period === 'monthly' ? 30 : 7;
    const periodStart = daysAgo(periodDays);
    const activeSince = daysAgo(30);

    const [
      dailyActiveMembers,
      totalMembers,
      communityGrowth,
      newCollaborations,
      topContributors,
      ecosystemHealth,
    ] = await Promise.all([
      this.participationRepository.countDailyActiveMembers(activeSince),
      this.participationRepository.countTotalActiveMembers(),
      this.participationRepository.countCommunityJoinsSince(periodStart),
      this.participationRepository.countPostedCollaborationsSince(periodStart),
      this.participationRepository.listTopContributors(periodStart, 8),
      this.participationRepository.averageReputationScore(),
    ]);

    const participationRate =
      totalMembers > 0 ? round2((dailyActiveMembers / totalMembers) * 100) : 0;

    return {
      period,
      dailyActiveMembers,
      newCollaborations,
      communityGrowth,
      participationRate,
      topContributors,
      ecosystemHealth: round2(ecosystemHealth),
      updatedAt: new Date().toISOString(),
    };
  }

  async getCommandCenterV5(
    period: 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<CommandCenterV5Payload> {
    const [v4, workflowBlock, insightFeed] = await Promise.all([
      this.getCommandCenterV4(period, ctx),
      this.workflowService.getCommandCenterBlock(),
      this.forecastAgent.getInsights({ limit: 8 }, ctx),
    ]);

    const actionableInsights: CommandCenterV5ActionableInsight[] = (
      insightFeed.items ?? []
    ).map((item) => ({
      id: item.id,
      category: item.category,
      title: item.title,
      severity: item.severity,
      actionType: item.actions?.[0]?.actionType ?? null,
      actionLabel: item.actions?.[0]?.actionType?.replace(/_/g, ' ') ?? null,
      executed: item.actions?.[0]?.status === 'executed',
    }));

    return {
      period: v4.period,
      audienceKpis: v4.audienceKpis,
      insights: v4.insights,
      actionableInsights,
      workflows: {
        pendingDecisionsCount: workflowBlock.pendingDecisionsCount,
        activeRunsCount: workflowBlock.activeRunsCount,
        recentRuns: workflowBlock.recentRuns,
      },
      topOpportunities: v4.topOpportunities,
      artistsAtRisk: v4.artistsAtRisk,
      citiesHeatingUp: v4.citiesHeatingUp,
      communitiesGrowingFast: v4.communitiesGrowingFast,
      revenueForecast: v4.revenueForecast,
      bookingDemandForecast: v4.bookingDemandForecast,
      executive: v4.executive,
      participation: v4.participation,
      v3: v4.v3,
      updatedAt: new Date().toISOString(),
    } as unknown as CommandCenterV5Payload;
  }

  async runCommandCenterV5Action(
    action: string,
    payload: Record<string, unknown>,
    ctx: MembershipContext,
  ): Promise<IntelligenceActionResult & { details?: Record<string, unknown> }> {
    const actorPersonId = ctx.personId ?? ctx.userId ?? null;

    switch (action) {
      case 'review-recovery-plan': {
        const artistId = String(payload.artistId ?? payload.targetId ?? '');
        if (!artistId) {
          return {
            success: true,
            action,
            stubbed: true,
            message: 'artistId required for recovery plan review.',
            receivedAt: new Date().toISOString(),
            payload,
          };
        }
        const [careerRun, automationEval] = await Promise.all([
          this.careerAgent.run(artistId, { limit: 8 }, ctx),
          this.automationEngineV2.evaluateArtist(artistId, actorPersonId),
        ]);
        return {
          success: true,
          action,
          stubbed: false,
          message: `Recovery plan generated for ${artistId} — career actions + automation evaluate complete.`,
          receivedAt: new Date().toISOString(),
          payload,
          details: {
            careerTaskId: careerRun.taskId,
            recommendationsCreated: careerRun.recommendationsCreated,
            automationFired: automationEval.fired,
          },
        };
      }
      case 'apply-recommended': {
        const opportunityIds = Array.isArray(payload.opportunityIds)
          ? payload.opportunityIds
          : payload.targetId
            ? [String(payload.targetId)]
            : [];
        const stub = `stub:batch_apply_opportunities count=${opportunityIds.length}`;
        return {
          success: true,
          action,
          stubbed: true,
          message:
            opportunityIds.length > 0
              ? `${opportunityIds.length} opportunity application(s) queued (stub).`
              : 'No opportunities selected — navigate to marketplace to apply.',
          receivedAt: new Date().toISOString(),
          payload: { ...payload, opportunityIds, stub },
        };
      }
      case 'launch-community-campaign': {
        const communityId = String(payload.communityId ?? payload.targetId ?? '');
        const brandId = String(payload.brandId ?? 'brand-tsc');
        const workflow = await this.workflowService.runWorkflow(
          {
            workflowSlug: 'brand_campaign_outreach',
            payload: {
              brandId,
              communityId,
              city: payload.city,
              genre: payload.genre,
              limit: 8,
            },
            approveStart: Boolean(payload.approveStart),
          },
          ctx,
        );
        return {
          success: true,
          action,
          stubbed: workflow.awaitingApproval,
          message: workflow.awaitingApproval
            ? `Campaign workflow started — awaiting approval (${workflow.approvalGate}).`
            : 'Community campaign workflow completed.',
          receivedAt: new Date().toISOString(),
          payload,
          details: {
            runId: workflow.run.id,
            status: workflow.run.status,
          },
        };
      }
      default:
        return this.runIntelligenceAction(action, payload);
    }
  }

  runIntelligenceAction(
    action: string,
    payload: Record<string, unknown>,
  ): IntelligenceActionResult {
    return {
      success: true,
      action,
      stubbed: true,
      message: `${action} queued (stub) — wire to automation when ready.`,
      receivedAt: new Date().toISOString(),
      payload,
    };
  }

  async getExecutiveAggregate(
    period: 'today' | 'weekly' | 'monthly',
    ctx: MembershipContext,
  ): Promise<ExecutiveAggregatePayload> {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Admin access required for executive aggregates');
    }

    const periodDays = period === 'today' ? 1 : period === 'weekly' ? 7 : 30;
    const periodStart = daysAgo(periodDays);
    const periodEnd = new Date();

    const [newFollowers, newMembers, openOpportunities, artistCount, citySnapshots, artists] =
      await this.intelligenceRepository.countPlatformMetrics(periodStart);

    const healthScores = await Promise.all(
      (artists ?? []).slice(0, 20).map((artist) => this.buildArtistHealthScore(artist.id)),
    );
    const avgArtistHealth =
      healthScores.length > 0
        ? round2(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : 0;
    const atRiskArtists = healthScores.filter((score) => score < 45).length;

    const hotRows = await this.intelligenceRepository.listOpenOpportunities();
    const hotOpportunities = hotRows.filter(
      (row) => bucketOpportunity(scoreOpportunity(row)) === 'hot',
    ).length;

    const heatScores = citySnapshots.map((row) =>
      calculateCityIntelligence({
        city: row.city,
        artistsCount: row.artistsCount,
        fansCount: row.fansCount,
        venuesCount: row.venuesCount,
        eventsCount: row.eventsCount,
        revenue: row.revenue ? Number(row.revenue) : undefined,
        communityMembers: row.communityMembers,
      }).heatScore,
    );
    const cityHeatAvg =
      heatScores.length > 0
        ? round2(heatScores.reduce((sum, score) => sum + score, 0) / heatScores.length)
        : 0;

    return {
      period,
      periodStart: periodStart.toISOString(),
      periodEnd: periodEnd.toISOString(),
      metrics: {
        newFollowers,
        newMembers,
        openOpportunities,
        hotOpportunities,
        activeArtists: artistCount,
        atRiskArtists,
        avgArtistHealth,
        cityHeatAvg,
      },
      updatedAt: new Date().toISOString(),
    };
  }

  /** Persist computed fan scores as an audience snapshot payload helper. */
  buildSnapshotPayload(personId: string, artistId?: string) {
    return this.intelligenceRepository
      .buildAudienceInput(personId, artistId)
      .then((input) => toSnapshotScores(calculateAudienceScores(input)));
  }

  private async buildArtistHealthScore(artistId: string): Promise<number> {
    const periodStart = daysAgo(DEFAULT_PERIOD_DAYS);
    const previousStart = daysAgo(DEFAULT_PERIOD_DAYS * 2);
    const [
      followerCount,
      currentFollowers,
      previousFollowers,
      communityMembers,
      activeMembers,
      eventCount,
    ] = await Promise.all([
      this.intelligenceRepository.countFollowers(artistId),
      this.intelligenceRepository.countFollowersSince(artistId, periodStart),
      this.intelligenceRepository.countFollowersBetween(artistId, previousStart, periodStart),
      this.intelligenceRepository.countCommunityMembers(artistId),
      this.intelligenceRepository.countActiveMembers(artistId, periodStart),
      this.intelligenceRepository.countArtistEvents(artistId),
    ]);

    const growthPercent =
      previousFollowers > 0
        ? ((currentFollowers - previousFollowers) / previousFollowers) * 100
        : currentFollowers > 0
          ? 100
          : 0;
    const engagementRate =
      communityMembers > 0 ? (activeMembers / communityMembers) * 100 : 0;

    return clamp(
      40 +
        Math.min(growthPercent, 20) +
        engagementRate * 0.3 +
        Math.min(eventCount * 5, 15) +
        Math.min(followerCount / 100, 10),
    );
  }

  private assertArtistAccess(ctx: MembershipContext, artistId: string): void {
    if (!canManageArtist(ctx, artistId)) {
      throw new ForbiddenException('Cannot view intelligence for this artist');
    }
  }
}

function scoreOpportunity(row: {
  value: unknown;
  updatedAt: Date;
  _count: { activities: number; applications: number };
}): number {
  const valueScore = row.value ? Math.min(Number(row.value) / 10_000, 40) : 10;
  const activityScore = Math.min(row._count.activities * 5, 30);
  const participantScore = Math.min(row._count.applications * 8, 20);
  const recencyDays = Math.floor(
    (Date.now() - row.updatedAt.getTime()) / 86_400_000,
  );
  const recencyScore = Math.max(0, 10 - recencyDays);
  return round2(valueScore + activityScore + participantScore + recencyScore);
}

function bucketOpportunity(score: number): OpportunityHeat {
  if (score >= 70) return 'hot';
  if (score >= 40) return 'warm';
  return 'cold';
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function clamp(value: number): number {
  return Math.max(0, Math.min(100, value));
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
