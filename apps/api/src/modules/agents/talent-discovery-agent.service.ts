import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  EMERGING_CITY_SCENE_THRESHOLD,
  FAST_GROWING_ARTIST_THRESHOLD,
  TALENT_DISCOVERY_AGENT_SLUG,
  TALENT_DISCOVERY_ALERT_TYPE,
  TALENT_DISCOVERY_PERIOD_DAYS,
  buildTalentDiscoveryTitle,
  computeActivityFeedVelocityStub,
  computeCitySceneGrowth,
  computeSuperfanVelocityStub,
  isUndervaluedCommunity,
  scoreTalentDiscoveryAlert,
} from '@tsc/database';
import type {
  TalentDiscoveryAgentRunPayload,
  TalentDiscoveryAlertAckPayload,
  TalentDiscoveryAlertSummary,
  TalentDiscoveryAlertsPayload,
  TalentDiscoveryEmergingCitiesPayload,
  TalentDiscoveryFastGrowingArtistsPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type {
  TalentDiscoveryAgentRunInput,
  TalentDiscoveryAlertsQuery,
} from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import { AgentsRepository } from './agents.repository';
import { DecisionEngineService } from './decision-engine.service';

const PLATFORM_ENTITY_ID = 'tsc-platform';

@Injectable()
export class TalentDiscoveryAgentService {
  private readonly logger = new Logger(TalentDiscoveryAgentService.name);

  constructor(
    private readonly repository: AgentsRepository,
    private readonly decisionEngine: DecisionEngineService,
    private readonly activityService: ActivityService,
  ) {}

  async run(
    input: TalentDiscoveryAgentRunInput,
    ctx: MembershipContext,
  ): Promise<TalentDiscoveryAgentRunPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureTalentDiscoveryAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Talent discovery agent unavailable');
    }

    const task = await this.repository.createTask(agent.id, {
      limit: input.limit,
      cityLimit: input.cityLimit,
    });

    try {
      const [artistCandidates, communitySnapshots, citySeeds] = await Promise.all([
        this.repository.listTopGrowthArtistSnapshots(input.limit, FAST_GROWING_ARTIST_THRESHOLD),
        this.repository.listCommunityAudienceSnapshots(input.limit * 2),
        this.repository.listDistinctCommunityCities(input.cityLimit ?? 10),
      ]);

      const periodMs = TALENT_DISCOVERY_PERIOD_DAYS * 24 * 60 * 60 * 1000;
      const now = new Date();
      const currentStart = new Date(now.getTime() - periodMs);
      const previousStart = new Date(now.getTime() - periodMs * 2);

      const items: TalentDiscoveryAlertSummary[] = [];
      let artistAlerts = 0;
      let communityAlerts = 0;
      let cityAlerts = 0;

      for (const row of artistCandidates) {
        const alert = await this.buildArtistAlert(
          agent.id,
          task?.id ?? null,
          row,
          currentStart,
          previousStart,
          now,
        );
        if (alert) {
          items.push(alert);
          artistAlerts += 1;
        }
      }

      for (const row of communitySnapshots) {
        if (!isUndervaluedCommunity(row.memberGrowth, row.activeMembers, row.fanGrowth)) {
          continue;
        }
        const alert = await this.buildCommunityAlert(
          agent.id,
          task?.id ?? null,
          row,
          currentStart,
          previousStart,
          now,
        );
        if (alert) {
          items.push(alert);
          communityAlerts += 1;
        }
      }

      const cityAlertsBuilt = await this.buildCityAlerts(
        agent.id,
        task?.id ?? null,
        citySeeds,
        input.cityLimit ?? 10,
        currentStart,
        previousStart,
        now,
      );
      items.push(...cityAlertsBuilt);
      cityAlerts = cityAlertsBuilt.length;

      items.sort((a, b) => b.score - a.score);
      const trimmed = items.slice(0, input.limit);

      const decision = await this.decisionEngine.recordDecision({
        agentId: agent.id,
        entityType: 'Platform',
        entityId: PLATFORM_ENTITY_ID,
        decisionType: 'talent_discovery_scan',
        payload: {
          taskId: task?.id ?? null,
          alertCount: trimmed.length,
          artistAlerts,
          communityAlerts,
          cityAlerts,
          thresholdArtist: FAST_GROWING_ARTIST_THRESHOLD,
          thresholdCity: EMERGING_CITY_SCENE_THRESHOLD,
        },
        confidence: trimmed[0] ? trimmed[0].confidence : 0.5,
        status: 'pending',
      });

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          alertsCreated: trimmed.length,
          artistAlerts,
          communityAlerts,
          cityAlerts,
          decisionId: decision.id,
        });
      }

      const actorPersonId = ctx.personId ?? ctx.userId ?? null;
      if (actorPersonId) {
        await this.activityService.recordInternal({
          actorPersonId,
          action: 'talent_discovery_scan_completed',
          targetType: 'Platform',
          targetId: PLATFORM_ENTITY_ID,
          metadata: {
            agentId: agent.id,
            taskId: task?.id ?? null,
            decisionId: decision.id,
            alertsCreated: trimmed.length,
            artistAlerts,
            communityAlerts,
            cityAlerts,
          },
          visibility: 'private',
        });
      }

      return {
        taskId: task?.id ?? 'stub-task',
        decisionId: decision.id,
        alertsCreated: trimmed.length,
        artistAlerts,
        communityAlerts,
        cityAlerts,
        items: trimmed,
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

  async getAlerts(
    query: TalentDiscoveryAlertsQuery,
    ctx: MembershipContext,
  ): Promise<TalentDiscoveryAlertsPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureTalentDiscoveryAgent();
    const lastTask = agent
      ? await this.repository.findLatestTalentDiscoveryTask(agent.id)
      : null;
    const taskId = lastTask?.id ?? null;

    const [rows, pendingDecision] = await Promise.all([
      this.repository.listRecommendationsForTalentDiscovery(
        query.limit,
        query.status ?? 'active',
        taskId ?? undefined,
        query.entityType,
      ),
      agent ? this.repository.findPendingTalentDiscoveryDecision(agent.id) : Promise.resolve(null),
    ]);

    return {
      taskId,
      decision: pendingDecision ? this.decisionEngine.toDecisionSummary(pendingDecision) : null,
      items: rows.map((row) => this.toAlertSummary(row)),
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async acknowledgeAlert(
    id: string,
    ctx: MembershipContext,
  ): Promise<TalentDiscoveryAlertAckPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const existing = await this.repository.findRecommendation(id);
    if (!existing) throw new NotFoundException(`Alert ${id} not found`);
    if (existing.agent?.slug !== TALENT_DISCOVERY_AGENT_SLUG) {
      throw new NotFoundException(`Alert ${id} is not a talent discovery alert`);
    }

    const metadata = parseMetadata(existing.metadata);
    const entityType =
      typeof metadata.entityType === 'string' ? metadata.entityType : 'Artist';
    const entityId = typeof metadata.entityId === 'string' ? metadata.entityId : existing.id;
    const acknowledgedStub = `stub:talent_discovery_ack entityType=${entityType} entityId=${entityId}`;

    const row = await this.repository.updateRecommendationStatus(id, 'applied');
    if (!row) {
      throw new ServiceUnavailableException('AgentRecommendation model unavailable');
    }

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'talent_discovery_alert_acknowledged',
        targetType: 'AgentRecommendation',
        targetId: row.id,
        metadata: {
          recommendationId: row.id,
          entityType,
          entityId,
          acknowledgedStub,
        },
        visibility: 'private',
      });
    }

    this.logger.log(`Talent discovery alert acknowledged: id=${id} ${acknowledgedStub}`);

    return {
      id: row.id,
      status: 'applied',
      acknowledgedStub,
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  async getEmergingCities(
    limit: number,
    ctx: MembershipContext,
  ): Promise<TalentDiscoveryEmergingCitiesPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureTalentDiscoveryAgent();
    const lastTask = agent
      ? await this.repository.findLatestTalentDiscoveryTask(agent.id)
      : null;

    const alertRows = await this.repository.listRecommendationsForTalentDiscovery(
      limit,
      'active',
      lastTask?.id,
      'City',
    );

    const items = alertRows.map((row) => {
      const metadata = parseMetadata(row.metadata);
      const growthPercent =
        typeof metadata.growthPercent === 'number' ? metadata.growthPercent : row.score;
      return {
        city: typeof metadata.city === 'string' ? metadata.city : row.title,
        genre: typeof metadata.genre === 'string' ? metadata.genre : null,
        sceneKey:
          typeof metadata.entityId === 'string' ? metadata.entityId : row.id,
        growthPercent,
        eventDensityGrowth:
          typeof metadata.eventDensityGrowth === 'number'
            ? metadata.eventDensityGrowth
            : 0,
        memberGrowth:
          typeof metadata.memberGrowth === 'number' ? metadata.memberGrowth : 0,
        activityVelocity:
          typeof metadata.activityVelocityStub === 'number'
            ? metadata.activityVelocityStub
            : 0,
        heatScore: row.score,
        alertId: row.id,
      };
    });

    if (items.length > 0) {
      return {
        items,
        threshold: EMERGING_CITY_SCENE_THRESHOLD,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      items: mockEmergingCities(limit),
      threshold: EMERGING_CITY_SCENE_THRESHOLD,
      updatedAt: new Date().toISOString(),
    };
  }

  async getFastGrowingArtists(
    limit: number,
    ctx: MembershipContext,
  ): Promise<TalentDiscoveryFastGrowingArtistsPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureTalentDiscoveryAgent();
    const lastTask = agent
      ? await this.repository.findLatestTalentDiscoveryTask(agent.id)
      : null;

    const alertRows = await this.repository.listRecommendationsForTalentDiscovery(
      limit,
      'active',
      lastTask?.id,
      'Artist',
    );

    const items = alertRows.map((row) => {
      const metadata = parseMetadata(row.metadata);
      return {
        artistId:
          row.targetArtistId ??
          (typeof metadata.entityId === 'string' ? metadata.entityId : row.id),
        name: row.title.replace(/^Fast growing artist:\s*/i, ''),
        slug: typeof metadata.slug === 'string' ? metadata.slug : row.id,
        audienceGrowth:
          typeof metadata.growthPercent === 'number' ? metadata.growthPercent : row.score,
        superfanVelocityStub:
          typeof metadata.superfanVelocityStub === 'number'
            ? metadata.superfanVelocityStub
            : null,
        activityVelocityStub:
          typeof metadata.activityVelocityStub === 'number'
            ? metadata.activityVelocityStub
            : null,
        score: row.score,
        alertId: row.id,
      };
    });

    if (items.length > 0) {
      return {
        items,
        threshold: FAST_GROWING_ARTIST_THRESHOLD,
        updatedAt: new Date().toISOString(),
      };
    }

    const snapshots = await this.repository.listTopGrowthArtistSnapshots(
      limit,
      FAST_GROWING_ARTIST_THRESHOLD,
    );

    return {
      items: snapshots.map((row) => ({
        artistId: row.artist.id,
        name: row.artist.name,
        slug: row.artist.slug,
        audienceGrowth: row.audienceGrowth,
        superfanVelocityStub: null,
        activityVelocityStub: null,
        score: Math.min(100, Math.round(row.audienceGrowth * 2)),
        alertId: null,
      })),
      threshold: FAST_GROWING_ARTIST_THRESHOLD,
      updatedAt: new Date().toISOString(),
    };
  }

  private async buildArtistAlert(
    agentId: string,
    taskId: string | null,
    row: {
      artistId: string;
      audienceGrowth: number;
      fanRetention: number;
      artist: { id: string; name: string; slug: string };
    },
    currentStart: Date,
    previousStart: Date,
    now: Date,
  ): Promise<TalentDiscoveryAlertSummary | null> {
    const [superfansCurrent, superfansPrevious, activityCurrent, activityPrevious] =
      await Promise.all([
        this.repository.countSuperfanSnapshotsBetween(
          row.artistId,
          currentStart,
          now,
          ['gold', 'platinum', 'legend'],
        ),
        this.repository.countSuperfanSnapshotsBetween(
          row.artistId,
          previousStart,
          currentStart,
          ['gold', 'platinum', 'legend'],
        ),
        this.repository.countActivityForTargetBetween(
          'Artist',
          row.artistId,
          currentStart,
          now,
        ),
        this.repository.countActivityForTargetBetween(
          'Artist',
          row.artistId,
          previousStart,
          currentStart,
        ),
      ]);

    const superfanVelocityStub = computeSuperfanVelocityStub(
      superfansCurrent,
      superfansPrevious,
    );
    const activityVelocityStub = computeActivityFeedVelocityStub(
      activityCurrent,
      activityPrevious,
    );
    const reasonCodes = ['audience_growth_spike'];
    if (superfanVelocityStub >= 20) reasonCodes.push('superfan_velocity');
    if (activityVelocityStub >= 25) reasonCodes.push('activity_feed_velocity');

    const { score, confidence } = scoreTalentDiscoveryAlert({
      growthPercent: row.audienceGrowth,
      superfanVelocityStub,
      activityVelocityStub,
      entityType: 'Artist',
    });

    const title = buildTalentDiscoveryTitle('Artist', row.artist.name, row.audienceGrowth);
    const rationale = `${row.artist.name} audience +${row.audienceGrowth.toFixed(1)}% (30d) · retention ${row.fanRetention.toFixed(1)}% · superfan velocity ${superfanVelocityStub.toFixed(1)}% · activity ${activityVelocityStub.toFixed(1)}%`;

    const recommendation = await this.decisionEngine.recordRecommendation(
      {
        agentId,
        targetArtistId: row.artistId,
        title,
        rationale,
        score,
        confidence,
        status: 'active',
        metadata: {
          alertType: TALENT_DISCOVERY_ALERT_TYPE,
          entityType: 'Artist',
          entityId: row.artistId,
          entityName: row.artist.name,
          slug: row.artist.slug,
          growthPercent: row.audienceGrowth,
          reasonCodes,
          superfanVelocityStub,
          activityVelocityStub,
          fanRetention: row.fanRetention,
          taskId,
          source: 'talent_discovery_agent_v1',
        },
      },
      null,
    );

    return this.recommendationToAlert(recommendation);
  }

  private async buildCommunityAlert(
    agentId: string,
    taskId: string | null,
    row: {
      communityId: string;
      memberGrowth: number;
      activeMembers: number;
      fanGrowth: number;
      community: {
        id: string;
        name: string;
        slug: string;
        city: string | null;
        genres: string[];
      };
    },
    currentStart: Date,
    previousStart: Date,
    now: Date,
  ): Promise<TalentDiscoveryAlertSummary | null> {
    const [activityCurrent, activityPrevious] = await Promise.all([
      this.repository.countActivityForTargetBetween(
        'Community',
        row.communityId,
        currentStart,
        now,
      ),
      this.repository.countActivityForTargetBetween(
        'Community',
        row.communityId,
        previousStart,
        currentStart,
      ),
    ]);

    const activityVelocityStub = computeActivityFeedVelocityStub(
      activityCurrent,
      activityPrevious,
    );
    const reasonCodes = ['undervalued_community', 'member_growth'];
    if (activityVelocityStub >= 20) reasonCodes.push('activity_feed_velocity');

    const { score, confidence } = scoreTalentDiscoveryAlert({
      growthPercent: row.memberGrowth,
      superfanVelocityStub: row.fanGrowth,
      activityVelocityStub,
      entityType: 'Community',
    });

    const title = buildTalentDiscoveryTitle('Community', row.community.name, row.memberGrowth);
    const rationale = `${row.community.name} +${row.memberGrowth.toFixed(1)}% members · ${row.activeMembers} active · fan growth ${row.fanGrowth.toFixed(1)}% · still under radar`;

    const recommendation = await this.decisionEngine.recordRecommendation(
      {
        agentId,
        title,
        rationale,
        score,
        confidence,
        status: 'active',
        metadata: {
          alertType: TALENT_DISCOVERY_ALERT_TYPE,
          entityType: 'Community',
          entityId: row.communityId,
          entityName: row.community.name,
          slug: row.community.slug,
          city: row.community.city,
          genres: row.community.genres,
          growthPercent: row.memberGrowth,
          activeMembers: row.activeMembers,
          fanGrowth: row.fanGrowth,
          reasonCodes,
          superfanVelocityStub: row.fanGrowth,
          activityVelocityStub,
          taskId,
          source: 'talent_discovery_agent_v1',
        },
      },
      null,
    );

    return this.recommendationToAlert(recommendation);
  }

  private async buildCityAlerts(
    agentId: string,
    taskId: string | null,
    seeds: Array<{ city: string | null; genres: string[] }>,
    limit: number,
    currentStart: Date,
    previousStart: Date,
    now: Date,
  ): Promise<TalentDiscoveryAlertSummary[]> {
    const alerts: TalentDiscoveryAlertSummary[] = [];
    const seen = new Set<string>();

    for (const seed of seeds) {
      if (!seed.city || alerts.length >= limit) continue;
      const genres = seed.genres.length > 0 ? seed.genres : ['hip-hop'];

      for (const genre of genres.slice(0, 2)) {
        const sceneKey = `${seed.city.toLowerCase()}:${genre.toLowerCase()}`;
        if (seen.has(sceneKey)) continue;
        seen.add(sceneKey);

        const [
          eventsCurrent,
          eventsPrevious,
          memberGrowthAvg,
          activityCurrent,
          activityPrevious,
          artistAudienceGrowth,
        ] = await Promise.all([
          this.repository.countEventsInCityBetween(seed.city, currentStart, now, genre),
          this.repository.countEventsInCityBetween(
            seed.city,
            previousStart,
            currentStart,
            genre,
          ),
          this.avgCommunityMemberGrowthInCity(seed.city, genre),
          this.repository.countActivityForTargetBetween(
            'City',
            sceneKey,
            currentStart,
            now,
          ).catch(() => 0),
          this.repository.countActivityForTargetBetween(
            'City',
            sceneKey,
            previousStart,
            currentStart,
          ).catch(() => 0),
          this.repository.avgArtistAudienceGrowthInCity(seed.city, genre),
        ]);

        const eventDensityGrowth = computeActivityFeedVelocityStub(
          eventsCurrent,
          eventsPrevious,
        );
        const activityVelocityStub = computeActivityFeedVelocityStub(
          activityCurrent,
          activityPrevious,
        );
        const growthPercent = computeCitySceneGrowth({
          avgMemberGrowth: memberGrowthAvg,
          eventDensityGrowth,
          activityVelocity: activityVelocityStub,
          artistAudienceGrowth,
        });

        if (growthPercent < EMERGING_CITY_SCENE_THRESHOLD) continue;

        const reasonCodes = ['city_scene_growth', 'event_density'];
        if (eventDensityGrowth >= 50) reasonCodes.push('event_density_spike');
        if (memberGrowthAvg >= 20) reasonCodes.push('community_member_growth');

        const { score, confidence } = scoreTalentDiscoveryAlert({
          growthPercent,
          superfanVelocityStub: memberGrowthAvg,
          activityVelocityStub,
          entityType: 'City',
        });

        const title = buildTalentDiscoveryTitle('City', seed.city, growthPercent, genre);
        const rationale = `${seed.city} ${genre} scene +${growthPercent.toFixed(1)}% · events ${eventDensityGrowth.toFixed(1)}% · members ${memberGrowthAvg.toFixed(1)}% · artist audience ${artistAudienceGrowth.toFixed(1)}%`;

        const recommendation = await this.decisionEngine.recordRecommendation(
          {
            agentId,
            title,
            rationale,
            score,
            confidence,
            status: 'active',
            metadata: {
              alertType: TALENT_DISCOVERY_ALERT_TYPE,
              entityType: 'City',
              entityId: sceneKey,
              entityName: seed.city,
              city: seed.city,
              genre,
              growthPercent,
              eventDensityGrowth,
              memberGrowth: memberGrowthAvg,
              activityVelocityStub,
              artistAudienceGrowth,
              reasonCodes,
              taskId,
              source: 'talent_discovery_agent_v1',
            },
          },
          null,
        );

        alerts.push(this.recommendationToAlert(recommendation));
        if (alerts.length >= limit) break;
      }
    }

    return alerts.sort((a, b) => b.growthPercent - a.growthPercent);
  }

  private async avgCommunityMemberGrowthInCity(city: string, genre: string) {
    const snapshots = await this.repository.listCommunityAudienceSnapshots(50);
    const matching = snapshots.filter(
      (row) =>
        row.community.city?.toLowerCase() === city.toLowerCase() &&
        row.community.genres.some((g) => g.toLowerCase() === genre.toLowerCase()),
    );
    if (matching.length === 0) {
      const cityOnly = snapshots.filter(
        (row) => row.community.city?.toLowerCase() === city.toLowerCase(),
      );
      if (cityOnly.length === 0) return 0;
      return (
        Math.round(
          (cityOnly.reduce((sum, row) => sum + row.memberGrowth, 0) / cityOnly.length) * 100,
        ) / 100
      );
    }
    return (
      Math.round(
        (matching.reduce((sum, row) => sum + row.memberGrowth, 0) / matching.length) * 100,
      ) / 100
    );
  }

  private recommendationToAlert(
    recommendation: ReturnType<DecisionEngineService['toRecommendationSummary']>,
  ): TalentDiscoveryAlertSummary {
    return this.toAlertSummary({
      id: recommendation.id,
      title: recommendation.title,
      rationale: recommendation.rationale,
      score: recommendation.score,
      confidence: recommendation.confidence,
      status: recommendation.status,
      metadata: recommendation.metadata,
      targetArtistId: recommendation.targetArtistId,
      createdAt: new Date(recommendation.createdAt),
    });
  }

  private toAlertSummary(row: {
    id: string;
    title: string;
    rationale: string;
    score: number;
    confidence?: number;
    status: string;
    metadata: unknown;
    targetArtistId?: string | null;
    createdAt: Date;
  }): TalentDiscoveryAlertSummary {
    const metadata = parseMetadata(row.metadata);
    const entityType = (metadata.entityType as TalentDiscoveryAlertSummary['entityType']) ?? 'Artist';
    const growthPercent =
      typeof metadata.growthPercent === 'number' ? metadata.growthPercent : row.score;

    return {
      id: row.id,
      entityType,
      entityId:
        typeof metadata.entityId === 'string'
          ? metadata.entityId
          : row.targetArtistId ?? row.id,
      title: row.title,
      rationale: row.rationale,
      growthPercent,
      score: row.score,
      confidence:
        typeof row.confidence === 'number'
          ? row.confidence
          : typeof metadata.confidence === 'number'
            ? metadata.confidence
            : 0.5,
      status: row.status as TalentDiscoveryAlertSummary['status'],
      reasonCodes: Array.isArray(metadata.reasonCodes)
        ? metadata.reasonCodes.map(String)
        : [],
      superfanVelocityStub:
        typeof metadata.superfanVelocityStub === 'number'
          ? metadata.superfanVelocityStub
          : null,
      activityVelocityStub:
        typeof metadata.activityVelocityStub === 'number'
          ? metadata.activityVelocityStub
          : null,
      city: typeof metadata.city === 'string' ? metadata.city : null,
      genre: typeof metadata.genre === 'string' ? metadata.genre : null,
      metadata,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAdmin(ctx: MembershipContext) {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Platform admin role required for talent discovery');
    }
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Decision Layer models unavailable');
    }
  }
}

function parseMetadata(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function mockEmergingCities(limit: number) {
  const seeds = [
    {
      city: 'Nagpur',
      genre: 'hip-hop',
      sceneKey: 'nagpur:hip-hop',
      growthPercent: 300,
      eventDensityGrowth: 180,
      memberGrowth: 42,
      activityVelocity: 65,
      heatScore: 92,
      alertId: null,
    },
    {
      city: 'Indore',
      genre: 'indie',
      sceneKey: 'indore:indie',
      growthPercent: 86,
      eventDensityGrowth: 54,
      memberGrowth: 28,
      activityVelocity: 31,
      heatScore: 74,
      alertId: null,
    },
    {
      city: 'Shillong',
      genre: 'rock',
      sceneKey: 'shillong:rock',
      growthPercent: 62,
      eventDensityGrowth: 48,
      memberGrowth: 22,
      activityVelocity: 18,
      heatScore: 68,
      alertId: null,
    },
  ];
  return seeds.slice(0, limit);
}
