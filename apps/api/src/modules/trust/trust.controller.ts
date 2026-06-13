import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  ArtistOpportunitiesV2Schema,
  BrandMatchV2Schema,
  TrustEntityTypeSchema,
} from '@tsc/contracts/trust';
import { TrustService } from './trust.service';

@Controller('trust')
@UseGuards(ClerkAuthGuard)
export class TrustController {
  constructor(private readonly trustService: TrustService) {}

  @Get('artist/:id')
  getArtistTrust(@Param('id') id: string) {
    return this.trustService.getArtistTrust(id);
  }

  @Get('brand/:id')
  getBrandTrust(@Param('id') id: string) {
    return this.trustService.getBrandTrust(id);
  }

  @Get('agency/:id')
  getAgencyTrust(@Param('id') id: string) {
    return this.trustService.getAgencyTrust(id);
  }

  @Post('refresh/:entityType/:entityId')
  refresh(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
    @Membership() ctx: MembershipContext,
  ) {
    const parsedType = TrustEntityTypeSchema.parse(entityType);
    return this.trustService.refresh(parsedType, entityId, ctx);
  }
}

@Controller('intelligence/recommendations/v2')
@UseGuards(ClerkAuthGuard)
export class RecommendationsV2Controller {
  constructor(private readonly trustService: TrustService) {}

  @Post('brand-match')
  brandMatch(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.trustService.brandMatch(parseSchema(BrandMatchV2Schema, body), ctx);
  }

  @Post('artist-opportunities')
  artistOpportunities(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.trustService.artistOpportunitiesV2(
      parseSchema(ArtistOpportunitiesV2Schema, body),
      ctx,
    );
  }
}
