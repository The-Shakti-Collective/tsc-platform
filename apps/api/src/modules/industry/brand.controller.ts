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
  BrandApplicationReviewSchema,
  BrandApplicationsQuerySchema,
} from '../opportunity/schema';
import {
  BrandCreateOpportunitySchema,
  BrandCreateSchema,
  BrandListQuerySchema,
  BrandUpdateSchema,
} from './schema';
import { BrandService } from './brand.service';

@Controller('brands')
@UseGuards(ClerkAuthGuard)
export class BrandController {
  constructor(private readonly brandService: BrandService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.brandService.list(parseSchema(BrandListQuerySchema, query));
  }

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.brandService.create(parseSchema(BrandCreateSchema, body), ctx);
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.brandService.getDetail(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandService.update(id, parseSchema(BrandUpdateSchema, body), ctx);
  }

  @Get(':id/campaigns')
  listCampaigns(@Param('id') id: string) {
    return this.brandService.listCampaigns(id);
  }

  @Get(':id/opportunities')
  listOpportunities(@Param('id') id: string) {
    return this.brandService.listOpportunities(id);
  }

  @Post(':id/opportunities')
  createOpportunity(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandService.createOpportunity(
      id,
      parseSchema(BrandCreateOpportunitySchema, body),
      ctx,
    );
  }

  @Get(':id/applications')
  listApplications(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandService.listApplications(
      id,
      parseSchema(BrandApplicationsQuerySchema, query),
      ctx,
    );
  }

  @Patch(':id/applications/:applicationId')
  reviewApplication(
    @Param('id') id: string,
    @Param('applicationId') applicationId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.brandService.reviewApplication(
      id,
      applicationId,
      parseSchema(BrandApplicationReviewSchema, body),
      ctx,
    );
  }
}
