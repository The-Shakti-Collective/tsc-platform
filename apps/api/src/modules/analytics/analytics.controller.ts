import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { AnalyticsDomainService } from './analytics-domain.service';
import {
  AnalyticsCompareQuerySchema,
  AnalyticsCumulativeQuerySchema,
  AnalyticsSparklineQuerySchema,
} from './schema';

@ApiTags('analytics')
@Controller('analytics')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsDomainService) {}

  @Get('cumulative')
  @ApiOperation({ summary: 'Cumulative dashboard metrics (stub until warehouse sync)' })
  getCumulative(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(AnalyticsCumulativeQuerySchema, query);
    return this.analyticsService.getCumulative(parsed.organizationId, ctx);
  }

  @Get('compare')
  @ApiOperation({ summary: 'Compare metric between two periods' })
  compare(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.analyticsService.comparePeriods(
      parseSchema(AnalyticsCompareQuerySchema, query),
      ctx,
    );
  }

  @Get('sparkline')
  @ApiOperation({ summary: 'Sparkline data for a metric' })
  sparkline(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.analyticsService.getSparkline(
      parseSchema(AnalyticsSparklineQuerySchema, query),
      ctx,
    );
  }
}
