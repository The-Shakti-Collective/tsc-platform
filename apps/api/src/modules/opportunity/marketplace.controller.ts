import {
  Body,
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
import {
  MarketplaceListingTrackSchema,
  MarketplaceListingsQuerySchema,
  MarketplaceSearchQuerySchema,
  OpportunityApplySchema,
  OpportunitySaveSchema,
  OpportunityShareSchema,
} from './schema';
import { OpportunityService } from './opportunity.service';

@Controller('marketplace')
@UseGuards(ClerkAuthGuard)
export class MarketplaceController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get('listings')
  browseListings(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.browseListings(
      parseSchema(MarketplaceListingsQuerySchema, query),
      ctx,
    );
  }

  @Get('search')
  searchListings(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.searchListings(
      parseSchema(MarketplaceSearchQuerySchema, query),
      ctx,
    );
  }

  @Get('listings/:id')
  getListingDetail(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.opportunityService.getListingDetail(id, ctx);
  }

  @Post('listings/:id/bookmark')
  bookmarkListing(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.saveOpportunity(
      id,
      parseSchema(OpportunitySaveSchema, body),
      ctx,
    );
  }

  @Post('listings/:id/apply')
  applyToListing(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.applyToOpportunity(
      id,
      parseSchema(OpportunityApplySchema, body),
      ctx,
    );
  }

  @Post('listings/:id/share')
  shareListing(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.shareOpportunity(
      id,
      parseSchema(OpportunityShareSchema, body),
      ctx,
    );
  }

  @Post('listings/:id/track')
  trackListing(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.trackListing(
      id,
      parseSchema(MarketplaceListingTrackSchema, body),
      ctx,
    );
  }
}
