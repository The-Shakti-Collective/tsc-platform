import { ForbiddenException, Injectable } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { isAdmin } from '@tsc/permissions';
import { PrismaService } from '../../common/database/prisma.service';
import { assertOrgRead } from '../../common/org/org-access';
import type { AnalyticsCompareQuery, AnalyticsSparklineQuery } from './schema';

@Injectable()
export class AnalyticsRepository {
  constructor(private readonly prisma: PrismaService) {}

  listSnapshots(metricKey: string, organizationId?: string, limit = 30) {
    return this.prisma.client.analyticsMetricSnapshot.findMany({
      where: {
        metricKey,
        ...(organizationId ? { organizationId } : {}),
      },
      orderBy: { periodStart: 'desc' },
      take: limit,
    });
  }

  countSnapshots(metricKey: string, organizationId: string | undefined, start: Date, end: Date) {
    return this.prisma.client.analyticsMetricSnapshot.count({
      where: {
        metricKey,
        ...(organizationId ? { organizationId } : {}),
        periodStart: { gte: start },
        periodEnd: { lte: end },
      },
    });
  }
}

@Injectable()
export class AnalyticsDomainService {
  constructor(private readonly repository: AnalyticsRepository) {}

  getCumulative(organizationId: string | undefined, ctx: MembershipContext) {
    const scopedOrgId = this.resolveOrganizationScope(organizationId, ctx);
    return {
      metrics: {
        leads: { value: 0, stub: true },
        inquiries: { value: 0, stub: true },
        releases: { value: 0, stub: true },
      },
      organizationId: scopedOrgId ?? null,
      stub: true,
      message: 'Connect PostHog / warehouse sync for live cumulative metrics',
    };
  }

  async comparePeriods(query: AnalyticsCompareQuery, ctx: MembershipContext) {
    const organizationId = this.resolveOrganizationScope(query.organizationId, ctx);
    const current = await this.repository.countSnapshots(
      query.metric,
      organizationId,
      query.currentStart,
      query.currentEnd,
    );
    const previous = await this.repository.countSnapshots(
      query.metric,
      organizationId,
      query.previousStart,
      query.previousEnd,
    );

    return {
      metric: query.metric,
      current: { count: current, start: query.currentStart, end: query.currentEnd },
      previous: { count: previous, start: query.previousStart, end: query.previousEnd },
      delta: current - previous,
      stub: current === 0 && previous === 0,
    };
  }

  async getSparkline(query: AnalyticsSparklineQuery, ctx: MembershipContext) {
    const organizationId = this.resolveOrganizationScope(query.organizationId, ctx);
    const snapshots = await this.repository.listSnapshots(
      query.metric,
      organizationId,
      query.days,
    );

    return {
      metric: query.metric,
      days: query.days,
      points: snapshots.map((s) => ({
        date: s.periodStart.toISOString(),
        value: Number(s.value),
      })),
      stub: snapshots.length === 0,
    };
  }

  /** Non-admins must pass organizationId and belong to that org; admins may query globally. */
  private resolveOrganizationScope(
    organizationId: string | undefined,
    ctx: MembershipContext,
  ): string | undefined {
    if (organizationId) {
      assertOrgRead(ctx, organizationId);
      return organizationId;
    }
    if (isAdmin(ctx)) {
      return undefined;
    }
    throw new ForbiddenException('organizationId required');
  }
}
