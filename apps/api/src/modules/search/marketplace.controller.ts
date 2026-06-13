import { Controller, Get, Post, Param, Query, Body, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  MarketplaceListingsQuerySchema,
  MarketplaceListingTrackSchema,
  MarketplaceSearchQuerySchema,
} from '../opportunity/schema';
import { OpportunityService } from '../opportunity/opportunity.service';

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
