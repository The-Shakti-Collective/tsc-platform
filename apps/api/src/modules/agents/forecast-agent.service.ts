import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  FORECAST_METRIC_LABELS,
  computeConfidenceBounds,
  projectRateMetric,
  projectRunRate,
  type ForecastHorizonValue,
  type ForecastMetricValue,
} from '@tsc/database';
import type {
  EntityForecastsPayload,
  ForecastAgentRunPayload,
  ForecastSnapshotSummary,
  ForecastSummary,
  InsightActionExecutePayload,
  InsightSummary,
  InsightsFeedPayload,
  PlatformForecastRollupEntry,
  PlatformForecastRollupPayload,
} from '@tsc/types';
import type { MembershipContext } from '@tsc/permissions';
import type { ForecastAgentRunInput, InsightsFeedQuery } from '@tsc/contracts/agents';
import { ActivityService } from '../activity/activity.service';
import {
  ForecastRepository,
  PLATFORM_ENTITY_ID,
  PLATFORM_ENTITY_TYPE,
} from './forecast.repository';

@Injectable()
export class ForecastAgentService {
  private readonly logger = new Logger(ForecastAgentService.name);

  constructor(
    private readonly repository: ForecastRepository,
    private readonly activityService: ActivityService,
  ) {}

  async run(
    input: ForecastAgentRunInput,
    ctx: MembershipContext,
  ): Promise<ForecastAgentRunPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureForecastAgent();
    if (!agent) {
      throw new ServiceUnavailableException('Forecast agent unavailable');
    }

    const { entityType, entityId } = this.repository.resolveEntityScope(
      input.entityType,
      input.entityId,
    );
    const metrics = this.repository.resolveMetrics(input.metrics);
    const horizons = this.repository.resolveHorizons(input.horizons);

    const task = await this.repository.createTask(agent.id, {
      entityType,
      entityId,
      metrics,
      horizons,
    });

    try {
      const baselines = await this.loadBaselines(entityType, entityId, metrics);
      const items: ForecastSummary[] = [];
      let insightsCreated = 0;

      for (const metric of metrics) {
        for (const horizon of horizons) {
          const projection = this.projectMetric(metric, horizon, baselines[metric]);
          const bounds = computeConfidenceBounds(projection.predictedValue);

          const row = await this.repository.createForecastWithSnapshot({
            entityType,
            entityId,
            metric,
            horizon,
            predictedValue: projection.predictedValue,
            lowerBound: bounds.lowerBound,
            upperBound: bounds.upperBound,
            factors: projection.factors,
          });

          if (row) {
            items.push(this.toForecastSummary(row, {
              snapshotDate: new Date().toISOString().slice(0, 10),
              predictedValue: projection.predictedValue,
              lowerBound: bounds.lowerBound,
              upperBound: bounds.upperBound,
              factors: projection.factors,
            }));
          }
        }

        const insight = await this.maybeCreateInsight(
          entityType,
          entityId,
          metric,
          baselines[metric],
          horizons,
        );
        if (insight) insightsCreated += 1;
      }

      if (task) {
        await this.repository.completeTask(task.id, 'completed', {
          forecastsCreated: items.length,
          insightsCreated,
          entityType,
          entityId,
        });
      }

      const actorPersonId = ctx.personId ?? ctx.userId ?? null;
      if (actorPersonId) {
        await this.activityService.recordInternal({
          actorPersonId,
          action: 'forecast_generated',
          targetType: entityType,
          targetId: entityId,
          metadata: {
            agentId: agent.id,
            taskId: task?.id ?? null,
            forecastsCreated: items.length,
            insightsCreated,
            metrics,
          },
          visibility: 'private',
        });
      }

      return {
        taskId: task?.id ?? 'stub-task',
        entityType,
        entityId,
        forecastsCreated: items.length,
        insightsCreated,
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

  async getEntityForecasts(
    entityType: string,
    entityId: string,
    ctx: MembershipContext,
  ): Promise<EntityForecastsPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureForecastAgent();
    const lastTask = agent ? await this.repository.findLatestTask(agent.id) : null;
    const rows = await this.repository.findLatestForecastsByEntity(entityType, entityId);

    const items = this.dedupeLatestForecasts(rows.map((row) => this.toForecastSummary(row)));

    if (items.length === 0) {
      return {
        entityType,
        entityId,
        items: mockEntityForecasts(entityType, entityId),
        lastRunAt: null,
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      entityType,
      entityId,
      items,
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async getPlatformRollup(ctx: MembershipContext): Promise<PlatformForecastRollupPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const agent = await this.repository.ensureForecastAgent();
    const lastTask = agent ? await this.repository.findLatestTask(agent.id) : null;
    const rows = await this.repository.findLatestPlatformForecasts();
    const items = this.dedupeLatestForecasts(rows.map((row) => this.toForecastSummary(row)));

    if (items.length === 0) {
      return {
        entityType: PLATFORM_ENTITY_TYPE,
        entityId: PLATFORM_ENTITY_ID,
        rollups: mockPlatformRollups(),
        lastRunAt: null,
        updatedAt: new Date().toISOString(),
      };
    }

    const rollups = buildPlatformRollups(items);

    return {
      entityType: PLATFORM_ENTITY_TYPE,
      entityId: PLATFORM_ENTITY_ID,
      rollups,
      lastRunAt: lastTask?.completedAt?.toISOString() ?? null,
      updatedAt: new Date().toISOString(),
    };
  }

  async getInsights(
    query: InsightsFeedQuery,
    ctx: MembershipContext,
  ): Promise<InsightsFeedPayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const rows = await this.repository.listInsights(
      query.limit,
      query.severity,
      query.category,
    );

    if (rows.length === 0) {
      return {
        items: mockInsights(query.limit),
        updatedAt: new Date().toISOString(),
      };
    }

    return {
      items: rows.map((row) => this.toInsightSummary(row)),
      updatedAt: new Date().toISOString(),
    };
  }

  async executeInsightAction(
    insightId: string,
    actionType: string,
    ctx: MembershipContext,
  ): Promise<InsightActionExecutePayload> {
    this.assertAvailable();
    this.assertAdmin(ctx);

    const insight = await this.repository.findInsight(insightId);
    if (!insight) throw new NotFoundException(`Insight ${insightId} not found`);

    const executedStub = `stub:insight_action insightId=${insightId} actionType=${actionType}`;
    await this.repository.executeInsightAction(insightId, actionType);

    const actorPersonId = ctx.personId ?? ctx.userId;
    if (actorPersonId) {
      await this.activityService.recordInternal({
        actorPersonId,
        action: 'insight_action_executed',
        targetType: 'Insight',
        targetId: insightId,
        metadata: {
          insightId,
          actionType,
          executedStub,
          category: insight.category,
        },
        visibility: 'private',
      });
    }

    this.logger.log(`Insight action executed: ${executedStub}`);

    return {
      insightId,
      actionType,
      status: 'executed',
      executedStub,
      updatedAt: new Date().toISOString(),
    };
  }

  private async loadBaselines(
    entityType: string,
    entityId: string,
    metrics: ForecastMetricValue[],
  ) {
    const baselines: Record<
      ForecastMetricValue,
      Record<string, unknown> & { baseline30d: number }
    > = {
      revenue: { baseline30d: 0 },
      attendance: { baseline30d: 0 },
      growth: { baseline30d: 0 },
      demand: { baseline30d: 0 },
      membership_churn: { baseline30d: 0 },
    };

    const loaders: Partial<
      Record<ForecastMetricValue, () => Promise<Record<string, unknown> & { baseline30d: number }>>
    > = {
      revenue: () => this.repository.sumRevenueBaseline30d(entityType, entityId),
      attendance: () => this.repository.sumAttendanceBaseline30d(entityType, entityId),
      growth: () => this.repository.avgGrowthBaseline30d(entityType, entityId),
      demand: () => this.repository.demandBaseline30d(entityType, entityId),
      membership_churn: () => this.repository.membershipChurnBaseline30d(entityType, entityId),
    };

    await Promise.all(
      metrics.map(async (metric) => {
        const loader = loaders[metric];
        if (loader) baselines[metric] = await loader();
      }),
    );

    return baselines;
  }

  private projectMetric(
    metric: ForecastMetricValue,
    horizon: ForecastHorizonValue,
    baseline: Record<string, unknown> & { baseline30d: number },
  ) {
    const base = baseline.baseline30d ?? 0;
    const isRate = metric === 'growth' || metric === 'membership_churn';
    const predictedValue = isRate
      ? projectRateMetric(base, horizon)
      : projectRunRate(base, horizon);

    return {
      predictedValue,
      factors: {
        ...baseline,
        metric,
        horizon,
        projectionMethod: isRate ? 'rate_hold' : 'linear_run_rate',
        confidenceBand: '±15%',
      },
    };
  }

  private async maybeCreateInsight(
    entityType: string,
    entityId: string,
    metric: ForecastMetricValue,
    baseline: Record<string, unknown> & { baseline30d: number },
    horizons: ForecastHorizonValue[],
  ) {
    const value = baseline.baseline30d ?? 0;

    if (metric === 'growth' && value >= 12) {
      return this.repository.createInsight({
        entityType,
        entityId,
        category: 'audience_growth',
        title: `Strong audience growth trend (+${value.toFixed(1)}%)`,
        severity: 'info',
        payload: { metric, baseline: baseline, horizons },
        actionTypes: ['scale_community_programs'],
      });
    }

    if (metric === 'growth' && value < 0) {
      return this.repository.createInsight({
        entityType,
        entityId,
        category: 'audience_decline',
        title: `Audience contraction detected (${value.toFixed(1)}%)`,
        severity: 'warning',
        payload: { metric, baseline, horizons },
        actionTypes: ['launch_retention_campaign'],
      });
    }

    if (metric === 'membership_churn' && value >= 5) {
      return this.repository.createInsight({
        entityType,
        entityId,
        category: 'membership_churn',
        title: `Elevated membership churn (${value.toFixed(1)}%)`,
        severity: 'critical',
        payload: { metric, baseline, horizons },
        actionTypes: ['launch_retention_campaign', 'review_membership_pricing'],
      });
    }

    if (metric === 'membership_churn' && value >= 3) {
      return this.repository.createInsight({
        entityType,
        entityId,
        category: 'membership_churn',
        title: `Membership churn above target (${value.toFixed(1)}%)`,
        severity: 'warning',
        payload: { metric, baseline, horizons },
        actionTypes: ['launch_retention_campaign'],
      });
    }

    if (metric === 'demand') {
      const velocity = Number(baseline.velocityPercent ?? 0);
      if (velocity >= 20) {
        return this.repository.createInsight({
          entityType,
          entityId,
          category: 'marketplace_demand',
          title: `Marketplace demand accelerating (+${velocity.toFixed(1)}% applications)`,
          severity: 'info',
          payload: { metric, baseline, horizons },
          actionTypes: ['scale_opportunities', 'invite_brands'],
        });
      }
    }

    if (metric === 'revenue' && value <= 0) {
      return this.repository.createInsight({
        entityType,
        entityId,
        category: 'revenue_pipeline',
        title: 'Revenue run-rate flat — review deal pipeline',
        severity: 'warning',
        payload: { metric, baseline, horizons },
        actionTypes: ['review_pipeline'],
      });
    }

    return null;
  }

  private dedupeLatestForecasts(items: ForecastSummary[]): ForecastSummary[] {
    const map = new Map<string, ForecastSummary>();
    for (const item of items) {
      const key = `${item.metric}:${item.horizon}`;
      if (!map.has(key)) map.set(key, item);
    }
    return [...map.values()];
  }

  private toForecastSummary(
    row: {
      id: string;
      entityType: string;
      entityId: string;
      metric: string;
      horizon: string;
      modelVersion: string;
      createdAt: Date;
      snapshots?: Array<{
        snapshotDate: Date;
        predictedValue: number;
        lowerBound: number;
        upperBound: number;
        factors: unknown;
      }>;
    },
    fallbackSnapshot?: ForecastSnapshotSummary,
  ): ForecastSummary {
    const snap = row.snapshots?.[0];
    const latestSnapshot: ForecastSnapshotSummary | null = snap
      ? {
          snapshotDate: snap.snapshotDate.toISOString().slice(0, 10),
          predictedValue: snap.predictedValue,
          lowerBound: snap.lowerBound,
          upperBound: snap.upperBound,
          factors: parseJsonRecord(snap.factors),
        }
      : fallbackSnapshot ?? null;

    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      metric: row.metric as ForecastSummary['metric'],
      horizon: row.horizon as ForecastSummary['horizon'],
      modelVersion: row.modelVersion,
      latestSnapshot,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private toInsightSummary(row: {
    id: string;
    entityType: string;
    entityId: string;
    category: string;
    title: string;
    severity: string;
    payload: unknown;
    createdAt: Date;
    actions?: Array<{
      id: string;
      actionType: string;
      status: string;
      executedAt: Date | null;
    }>;
  }): InsightSummary {
    return {
      id: row.id,
      entityType: row.entityType,
      entityId: row.entityId,
      category: row.category,
      title: row.title,
      severity: row.severity as InsightSummary['severity'],
      payload: parseJsonRecord(row.payload),
      actions: (row.actions ?? []).map((action) => ({
        id: action.id,
        actionType: action.actionType,
        status: action.status as InsightSummary['actions'][number]['status'],
        executedAt: action.executedAt?.toISOString() ?? null,
      })),
      createdAt: row.createdAt.toISOString(),
    };
  }

  private assertAdmin(ctx: MembershipContext) {
    if (!ctx.roles.includes('admin')) {
      throw new ForbiddenException('Platform admin role required for forecast agent');
    }
  }

  private assertAvailable() {
    if (!this.repository.isAvailable()) {
      throw new ServiceUnavailableException('Forecast models unavailable');
    }
  }
}

function parseJsonRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  return value as Record<string, unknown>;
}

function buildPlatformRollups(items: ForecastSummary[]): PlatformForecastRollupEntry[] {
  const byMetric = new Map<ForecastMetricValue, PlatformForecastRollupEntry>();

  for (const item of items) {
    const metric = item.metric;
    let entry = byMetric.get(metric);
    if (!entry) {
      entry = {
        metric,
        label: FORECAST_METRIC_LABELS[metric],
        horizon30: null,
        horizon90: null,
      };
      byMetric.set(metric, entry);
    }
    if (item.horizon === 'd30') entry.horizon30 = item.latestSnapshot;
    if (item.horizon === 'd90') entry.horizon90 = item.latestSnapshot;
  }

  return [...byMetric.values()];
}

function mockEntityForecasts(entityType: string, entityId: string): ForecastSummary[] {
  const now = new Date().toISOString();
  const today = now.slice(0, 10);
  return [
    mockForecast('rev-d30', entityType, entityId, 'revenue', 'd30', 4200000, today, now),
    mockForecast('rev-d90', entityType, entityId, 'revenue', 'd90', 12600000, today, now),
    mockForecast('att-d30', entityType, entityId, 'attendance', 'd30', 18500, today, now),
    mockForecast('att-d90', entityType, entityId, 'attendance', 'd90', 55500, today, now),
    mockForecast('gr-d30', entityType, entityId, 'growth', 'd30', 14.2, today, now),
    mockForecast('gr-d90', entityType, entityId, 'growth', 'd90', 14.2, today, now),
    mockForecast('dm-d30', entityType, entityId, 'demand', 'd30', 186, today, now),
    mockForecast('dm-d90', entityType, entityId, 'demand', 'd90', 558, today, now),
    mockForecast('ch-d30', entityType, entityId, 'membership_churn', 'd30', 3.8, today, now),
    mockForecast('ch-d90', entityType, entityId, 'membership_churn', 'd90', 3.8, today, now),
  ];
}

function mockForecast(
  id: string,
  entityType: string,
  entityId: string,
  metric: ForecastSummary['metric'],
  horizon: ForecastSummary['horizon'],
  predicted: number,
  snapshotDate: string,
  createdAt: string,
): ForecastSummary {
  const band = predicted * 0.15;
  return {
    id,
    entityType,
    entityId,
    metric,
    horizon,
    modelVersion: 'linear_run_rate_v1',
    latestSnapshot: {
      snapshotDate,
      predictedValue: predicted,
      lowerBound: Math.round((predicted - band) * 100) / 100,
      upperBound: Math.round((predicted + band) * 100) / 100,
      factors: { source: 'mock' },
    },
    createdAt,
  };
}

function mockPlatformRollups(): PlatformForecastRollupEntry[] {
  const mocks = mockEntityForecasts(PLATFORM_ENTITY_TYPE, PLATFORM_ENTITY_ID);
  return buildPlatformRollups(mocks);
}

function mockInsights(limit: number): InsightSummary[] {
  const items: InsightSummary[] = [
    {
      id: 'insight-demand-1',
      entityType: PLATFORM_ENTITY_TYPE,
      entityId: PLATFORM_ENTITY_ID,
      category: 'marketplace_demand',
      title: 'Marketplace demand accelerating (+28.4% applications)',
      severity: 'info',
      payload: { metric: 'demand', velocityPercent: 28.4 },
      actions: [
        { id: 'ia-1', actionType: 'scale_opportunities', status: 'pending', executedAt: null },
        { id: 'ia-2', actionType: 'invite_brands', status: 'pending', executedAt: null },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-churn-1',
      entityType: PLATFORM_ENTITY_TYPE,
      entityId: PLATFORM_ENTITY_ID,
      category: 'membership_churn',
      title: 'Membership churn above target (3.8%)',
      severity: 'warning',
      payload: { metric: 'membership_churn', rate: 3.8 },
      actions: [
        {
          id: 'ia-3',
          actionType: 'launch_retention_campaign',
          status: 'pending',
          executedAt: null,
        },
      ],
      createdAt: new Date().toISOString(),
    },
    {
      id: 'insight-growth-1',
      entityType: PLATFORM_ENTITY_TYPE,
      entityId: PLATFORM_ENTITY_ID,
      category: 'audience_growth',
      title: 'Strong audience growth trend (+14.2%)',
      severity: 'info',
      payload: { metric: 'growth', avgGrowth: 14.2 },
      actions: [
        {
          id: 'ia-4',
          actionType: 'scale_community_programs',
          status: 'pending',
          executedAt: null,
        },
      ],
      createdAt: new Date().toISOString(),
    },
  ];
  return items.slice(0, limit);
}
