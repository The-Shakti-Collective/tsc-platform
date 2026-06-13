import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { EventIntelligenceInsightsQuerySchema } from './schema';
import { EventIntelligenceService } from './event-intelligence.service';

@Controller('events')
@UseGuards(ClerkAuthGuard)
export class EventIntelligenceController {
  constructor(private readonly service: EventIntelligenceService) {}

  @Get('intelligence/insights/cities')
  getCityInsights(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(EventIntelligenceInsightsQuerySchema, query);
    return this.service.getCityInsights(parsed.limit);
  }

  @Get('intelligence/insights/conversion-leaders')
  getConversionLeaders(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(EventIntelligenceInsightsQuerySchema, query);
    return this.service.getConversionLeaders(parsed.limit);
  }

  @Get('intelligence/insights/repeat-attendance')
  getRepeatAttendance(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(EventIntelligenceInsightsQuerySchema, query);
    return this.service.getRepeatAttendance(parsed.limit);
  }

  @Get(':id/intelligence/recommendations')
  getRecommendations(@Param('id') id: string) {
    return this.service.getRecommendations(id);
  }

  @Get(':id/intelligence/predict')
  getPredict(@Param('id') id: string) {
    return this.service.getPredict(id);
  }

  @Get(':id/intelligence')
  getIntelligence(@Param('id') id: string) {
    return this.service.getIntelligence(id);
  }

  @Post(':id/intelligence/refresh')
  refreshIntelligence(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.service.refreshIntelligence(id, ctx);
  }
}
