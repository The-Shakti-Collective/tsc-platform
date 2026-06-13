import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import {
  FORECAST_AGENT_SLUG,
  FORECAST_HORIZONS,
  FORECAST_METRICS,
  FORECAST_MODEL_VERSION,
  type ForecastHorizonValue,
  type ForecastMetricValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { toInputJson } from '../../common/json';

const PLATFORM_ENTITY_TYPE = 'Platform';
const PLATFORM_ENTITY_ID = 'tsc-platform';

type ForecastRow = {
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
    factors: Prisma.JsonValue;
  }>;
};

type InsightRow = {
  id: string;
  entityType: string;
  entityId: string;
  category: string;
  title: string;
  severity: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
  actions?: Array<{
    id: string;
    actionType: string;
    status: string;
    executedAt: Date | null;
  }>;
};

@Injectable()
export class ForecastRepository {
  constructor(private readonly prisma: PrismaService) {}

  private get forecastClient() {
    return (this.prisma.client as unknown as {
      forecast?: {
        create: (args: unknown) => Promise<ForecastRow>;
        findMany: (args: unknown) => Promise<ForecastRow[]>;
        findFirst: (args: unknown) => Promise<ForecastRow | null>;
      };
    }).forecast ?? null;
  }

  private get snapshotClient() {
    return (this.prisma.client as unknown as {
      forecastSnapshot?: {
        create: (args: unknown) => Promise<unknown>;
      };
    }).forecastSnapshot ?? null;
  }

  private get insightClient() {
    return (this.prisma.client as unknown as {
      insight?: {
        create: (args: unknown) => Promise<InsightRow>;
        findMany: (args: unknown) => Promise<InsightRow[]>;
        findUnique: (args: unknown) => Promise<InsightRow | null>;
      };
    }).insight ?? null;
  }

  private get actionClient() {
    return (this.prisma.client as unknown as {
      insightAction?: {
        create: (args: unknown) => Promise<unknown>;
        upsert: (args: unknown) => Promise<unknown>;
        findFirst: (args: unknown) => Promise<{
          id: string;
          insightId: string;
          actionType: string;
          status: string;
          executedAt: Date | null;
        } | null>;
      };
    }).insightAction ?? null;
  }

  private get agentClient() {
    return (this.prisma.client as unknown as {
      agent?: {
        findFirst: (args: unknown) => Promise<{ id: string } | null>;
        create: (args: unknown) => Promise<{ id: string }>;
      };
    }).agent ?? null;
  }

  private get taskClient() {
    return (this.prisma.client as unknown as {
      agentTask?: {
        create: (args: unknown) => Promise<{ id: string }>;
        update: (args: unknown) => Promise<unknown>;
        findFirst: (args: unknown) => Promise<{ id: string; completedAt: Date | null } | null>;
      };
    }).agentTask ?? null;
  }

  isAvailable(): boolean {
    return Boolean(this.forecastClient && this.insightClient);
  }

  resolveEntityScope(entityType?: string, entityId?: string) {
    return {
      entityType: entityType ?? PLATFORM_ENTITY_TYPE,
      entityId: entityId ?? PLATFORM_ENTITY_ID,
    };
  }

  resolveMetrics(metrics?: ForecastMetricValue[]): ForecastMetricValue[] {
    if (metrics && metrics.length > 0) return metrics;
    return [...FORECAST_METRICS];
  }

  resolveHorizons(horizons?: ForecastHorizonValue[]): ForecastHorizonValue[] {
    if (horizons && horizons.length > 0) return horizons;
    return [...FORECAST_HORIZONS];
  }

  async ensureForecastAgent() {
    if (!this.agentClient) return null;
    const existing = await this.agentClient.findFirst({ where: { slug: FORECAST_AGENT_SLUG } });
    if (existing) return existing;
    return this.agentClient.create({
      data: {
        slug: FORECAST_AGENT_SLUG,
        name: 'Forecast Agent',
        type: 'forecast',
        config: toInputJson({ version: 1, module: 'forecast' }),
        isActive: true,
      },
    });
  }

  createTask(agentId: string, input: Record<string, unknown>) {
    if (!this.taskClient) return Promise.resolve(null);
    return this.taskClient.create({
      data: {
        agentId,
        status: 'running',
        input: toInputJson(input),
        startedAt: new Date(),
      },
    });
  }

  completeTask(taskId: string, status: string, output: Record<string, unknown>) {
    if (!this.taskClient) return Promise.resolve();
    return this.taskClient.update({
      where: { id: taskId },
      data: {
        status,
        output: toInputJson(output),
        completedAt: new Date(),
      },
    });
  }

  findLatestTask(agentId: string) {
    if (!this.taskClient) return Promise.resolve(null);
    return this.taskClient.findFirst({
      where: { agentId, status: 'completed' },
      orderBy: { completedAt: 'desc' },
    });
  }

  async createForecastWithSnapshot(input: {
    entityType: string;
    entityId: string;
    metric: ForecastMetricValue;
    horizon: ForecastHorizonValue;
    predictedValue: number;
    lowerBound: number;
    upperBound: number;
    factors: Record<string, unknown>;
  }): Promise<ForecastRow | null> {
    if (!this.forecastClient || !this.snapshotClient) return null;

    const forecast = await this.forecastClient.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        metric: input.metric,
        horizon: input.horizon,
        modelVersion: FORECAST_MODEL_VERSION,
      },
    });

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    await this.snapshotClient.create({
      data: {
        forecastId: forecast.id,
        snapshotDate: today,
        predictedValue: input.predictedValue,
        lowerBound: input.lowerBound,
        upperBound: input.upperBound,
        factors: toInputJson(input.factors),
      },
    });

    return forecast;
  }

  findLatestForecastsByEntity(entityType: string, entityId: string, limit = 20) {
    if (!this.forecastClient) return Promise.resolve([]);
    return this.forecastClient.findMany({
      where: { entityType, entityId },
      include: {
        snapshots: {
          orderBy: { snapshotDate: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ metric: 'asc' }, { horizon: 'asc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  findLatestPlatformForecasts() {
    return this.findLatestForecastsByEntity(PLATFORM_ENTITY_TYPE, PLATFORM_ENTITY_ID, 20);
  }

  createInsight(input: {
    entityType: string;
    entityId: string;
    category: string;
    title: string;
    severity: 'info' | 'warning' | 'critical';
    payload: Record<string, unknown>;
    actionTypes?: string[];
  }) {
    if (!this.insightClient) return Promise.resolve(null);

    return this.insightClient.create({
      data: {
        entityType: input.entityType,
        entityId: input.entityId,
        category: input.category,
        title: input.title,
        severity: input.severity,
        payload: toInputJson(input.payload),
        actions: input.actionTypes?.length
          ? {
              create: input.actionTypes.map((actionType) => ({
                actionType,
                status: 'pending',
              })),
            }
          : undefined,
      },
      include: { actions: true },
    });
  }

  listInsights(limit: number, severity?: string, category?: string) {
    if (!this.insightClient) return Promise.resolve([]);
    const where: Record<string, unknown> = {};
    if (severity) where.severity = severity;
    if (category) where.category = category;

    return this.insightClient.findMany({
      where,
      include: { actions: true },
      orderBy: [{ severity: 'desc' }, { createdAt: 'desc' }],
      take: limit,
    });
  }

  findInsight(id: string) {
    if (!this.insightClient) return Promise.resolve(null);
    return this.insightClient.findUnique({
      where: { id },
      include: { actions: true },
    });
  }

  async executeInsightAction(insightId: string, actionType: string) {
    if (!this.actionClient) return null;

    const existing = await this.actionClient.findFirst({
      where: { insightId, actionType },
    });

    if (existing) {
      await (this.prisma.client as unknown as {
        insightAction?: { update: (args: unknown) => Promise<unknown> };
      }).insightAction?.update({
        where: { id: existing.id },
        data: { status: 'executed', executedAt: new Date() },
      });
      return { ...existing, status: 'executed', executedAt: new Date() };
    }

    await this.actionClient.create({
      data: {
        insightId,
        actionType,
        status: 'executed',
        executedAt: new Date(),
      },
    });

    return {
      id: `${insightId}:${actionType}`,
      insightId,
      actionType,
      status: 'executed',
      executedAt: new Date(),
    };
  }

  /** Revenue: RevenueTransaction sum + open Deal pipeline stub (last 30d). */
  async sumRevenueBaseline30d(entityType: string, entityId: string) {
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const start = new Date(now.getTime() - periodMs);

    const txClient = (this.prisma.client as unknown as {
      revenueTransaction?: {
        findMany: (args: unknown) => Promise<Array<{ amount: unknown }>>;
      };
    }).revenueTransaction;

    let transactionSum = 0;
    if (txClient) {
      const dealWhere = buildDealScopeWhere(entityType, entityId);
      const deals = await this.prisma.client.deal.findMany({
        where: dealWhere,
        select: { id: true, value: true, status: true },
      });
      const dealIds = deals.map((d) => d.id);
      if (dealIds.length > 0) {
        const txs = await txClient.findMany({
          where: {
            dealId: { in: dealIds },
            recordedAt: { gte: start, lte: now },
          },
        });
        transactionSum = txs.reduce((sum, row) => sum + Number(row.amount ?? 0), 0);
      }

      const openPipeline = deals
        .filter((d) => !['completed', 'paid'].includes(d.status))
        .reduce((sum, d) => sum + Number(d.value ?? 0), 0);

      return {
        transactionSum: Math.round(transactionSum * 100) / 100,
        openPipelineStub: Math.round(openPipeline * 100) / 100,
        baseline30d: Math.round((transactionSum + openPipeline * 0.15) * 100) / 100,
        windowStart: start.toISOString(),
        windowEnd: now.toISOString(),
      };
    }

    return {
      transactionSum: 0,
      openPipelineStub: 0,
      baseline30d: 0,
      windowStart: start.toISOString(),
      windowEnd: now.toISOString(),
    };
  }

  /** Attendance: EventIntelligenceSnapshot actualAttendance sum (last 30d). */
  async sumAttendanceBaseline30d(entityType: string, entityId: string) {
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const start = new Date(now.getTime() - periodMs);

    const client = (this.prisma.client as unknown as {
      eventIntelligenceSnapshot?: {
        findMany: (args: unknown) => Promise<Array<{ actualAttendance: number }>>;
      };
    }).eventIntelligenceSnapshot;

    if (!client) {
      return { totalAttendance: 0, baseline30d: 0, snapshotCount: 0 };
    }

    const eventWhere = buildEventScopeWhere(entityType, entityId);
    const events = await this.prisma.client.event.findMany({
      where: eventWhere,
      select: { id: true },
      take: 200,
    });
    if (events.length === 0) {
      return { totalAttendance: 0, baseline30d: 0, snapshotCount: 0 };
    }

    const rows = await client.findMany({
      where: {
        eventId: { in: events.map((e) => e.id) },
        snapshotDate: { gte: start, lte: now },
      },
    });

    const totalAttendance = rows.reduce((sum, row) => sum + (row.actualAttendance ?? 0), 0);
    return {
      totalAttendance: Math.round(totalAttendance * 100) / 100,
      baseline30d: Math.round(totalAttendance * 100) / 100,
      snapshotCount: rows.length,
    };
  }

  /** Growth: average AudienceHealthSnapshot audienceGrowth (latest per artist). */
  async avgGrowthBaseline30d(entityType: string, entityId: string) {
    const client = (this.prisma.client as unknown as {
      audienceHealthSnapshot?: {
        findMany: (args: unknown) => Promise<Array<{ audienceGrowth: number }>>;
      };
    }).audienceHealthSnapshot;

    if (!client) return { avgGrowth: 0, baseline30d: 0, artistCount: 0 };

    const artistWhere = buildArtistScopeWhere(entityType, entityId);
    const artists = await this.prisma.client.artist.findMany({
      where: artistWhere,
      select: { id: true },
      take: 100,
    });
    if (artists.length === 0) return { avgGrowth: 0, baseline30d: 0, artistCount: 0 };

    const rows = await client.findMany({
      where: { artistId: { in: artists.map((a) => a.id) } },
      orderBy: { snapshotDate: 'desc' },
      distinct: ['artistId'],
    });

    if (rows.length === 0) return { avgGrowth: 0, baseline30d: 0, artistCount: 0 };

    const avgGrowth =
      Math.round((rows.reduce((sum, row) => sum + row.audienceGrowth, 0) / rows.length) * 100) /
      100;

    return { avgGrowth, baseline30d: avgGrowth, artistCount: rows.length };
  }

  /** Demand: OpportunityApplication velocity (last 30d count). */
  async demandBaseline30d(_entityType: string, _entityId: string) {
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const currentStart = new Date(now.getTime() - periodMs);
    const previousStart = new Date(now.getTime() - periodMs * 2);

    const current = await this.prisma.client.opportunityApplication.count({
      where: { appliedAt: { gte: currentStart, lte: now } },
    });
    const previous = await this.prisma.client.opportunityApplication.count({
      where: { appliedAt: { gte: previousStart, lt: currentStart } },
    });

    const velocity =
      previous > 0
        ? Math.round(((current - previous) / previous) * 10000) / 100
        : current > 0
          ? 100
          : 0;

    return {
      applicationsCurrent30d: current,
      applicationsPrevious30d: previous,
      velocityPercent: velocity,
      baseline30d: current,
    };
  }

  /** Membership churn stub: cancelled / (active + cancelled) in last 30d. */
  async membershipChurnBaseline30d(_entityType: string, _entityId: string) {
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const now = new Date();
    const start = new Date(now.getTime() - periodMs);

    const subClient = (this.prisma.client as unknown as {
      membershipSubscription?: {
        count: (args: unknown) => Promise<number>;
      };
    }).membershipSubscription;

    if (!subClient) {
      return { cancellations: 0, activeCount: 0, baseline30d: 0 };
    }

    const [cancellations, activeCount] = await Promise.all([
      subClient.count({
        where: {
          cancelledAt: { gte: start, lte: now },
        },
      }),
      subClient.count({
        where: { status: 'active' },
      }),
    ]);

    const denominator = activeCount + cancellations;
    const rate =
      denominator > 0 ? Math.round((cancellations / denominator) * 10000) / 100 : 0;

    return { cancellations, activeCount, baseline30d: rate };
  }
}

function buildDealScopeWhere(entityType: string, entityId: string): Record<string, unknown> {
  if (entityType === 'Artist') return { artistId: entityId };
  if (entityType === 'Platform') return {};
  return {};
}

function buildEventScopeWhere(entityType: string, entityId: string): Record<string, unknown> {
  if (entityType === 'Artist') return { artistId: entityId };
  if (entityType === 'Event') return { id: entityId };
  return {};
}

function buildArtistScopeWhere(entityType: string, entityId: string): Record<string, unknown> {
  if (entityType === 'Artist') return { id: entityId };
  if (entityType === 'Community') {
    return { communities: { some: { id: entityId } } };
  }
  return {};
}

export { PLATFORM_ENTITY_TYPE, PLATFORM_ENTITY_ID };
