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
import { AudienceService } from './audience.service';
import { AudienceInsightsQuerySchema } from './schema';

@Controller('audience')
export class AudienceController {
  constructor(private readonly audienceService: AudienceService) {}

  @Get('artists/:id/health')
  getArtistHealth(@Param('id') id: string) {
    return this.audienceService.getArtistAudienceHealth(id);
  }

  @Get('communities/:id')
  getCommunityAudience(@Param('id') id: string) {
    return this.audienceService.getCommunityAudience(id);
  }

  @Get('insights/top-growth-artists')
  getTopGrowthArtists(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(AudienceInsightsQuerySchema, query);
    return this.audienceService.getTopGrowthArtists(parsed.limit);
  }

  @Get('insights/churn-risk')
  getChurnRiskArtists(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(AudienceInsightsQuerySchema, query);
    return this.audienceService.getChurnRiskArtists(parsed.limit);
  }
}

@Controller('audience/refresh')
@UseGuards(ClerkAuthGuard)
export class AudienceAdminController {
  constructor(private readonly audienceService: AudienceService) {}

  @Post('artist/:id')
  refreshArtist(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.audienceService.refreshArtistAudienceHealth(id, ctx);
  }

  @Post('community/:id')
  refreshCommunity(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.audienceService.refreshCommunityAudience(id, ctx);
  }
}
