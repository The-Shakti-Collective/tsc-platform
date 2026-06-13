import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  ArtistApplicationsQuerySchema,
  MarketplaceBrowseQuerySchema,
  OpportunityApplicationUpdateSchema,
  OpportunityApplySchema,
  OpportunitySaveSchema,
  OpportunityShareSchema,
} from './schema';
import { OpportunityService } from './opportunity.service';

@Controller('opportunities')
@UseGuards(ClerkAuthGuard)
export class OpportunityController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get('marketplace')
  browseMarketplace(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.browseMarketplace(
      parseSchema(MarketplaceBrowseQuerySchema, query),
      ctx,
    );
  }

  @Get(':id')
  getDetail(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.opportunityService.getMarketplaceDetail(id, ctx);
  }

  @Post(':id/save')
  save(
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

  @Post(':id/apply')
  apply(
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

  @Post(':id/share')
  share(
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
}

@Controller('artists')
@UseGuards(ClerkAuthGuard)
export class ArtistApplicationsController {
  constructor(private readonly opportunityService: OpportunityService) {}

  @Get(':id/applications')
  listApplications(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.opportunityService.listArtistApplications(
      id,
      parseSchema(ArtistApplicationsQuerySchema, query),
      ctx,
    );
  }

  @Patch(':artistId/applications/:applicationId')
  updateApplicationStatus(
    @Param('artistId') artistId: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(OpportunityApplicationUpdateSchema, body);
    return this.opportunityService.updateArtistApplicationStatus(
      artistId,
      applicationId,
      parsed.status,
      ctx,
    );
  }
}
