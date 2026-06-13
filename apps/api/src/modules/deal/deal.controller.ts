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
  DealCreateSchema,
  DealListQuerySchema,
  DealRevenueCreateSchema,
  DealStatusUpdateSchema,
  DealUpdateSchema,
} from './schema';
import { DealService } from './deal.service';

@Controller('deals')
@UseGuards(ClerkAuthGuard)
export class DealController {
  constructor(private readonly dealService: DealService) {}

  @Get()
  list(@Query() query: Record<string, unknown>) {
    return this.dealService.list(parseSchema(DealListQuerySchema, query));
  }

  @Post()
  create(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.dealService.createFromApplication(
      parseSchema(DealCreateSchema, body),
      ctx,
    );
  }

  @Get(':id/revenue')
  listRevenue(@Param('id') id: string) {
    return this.dealService.listRevenue(id);
  }

  @Post(':id/revenue')
  recordRevenue(@Param('id') id: string, @Body() body: unknown) {
    return this.dealService.recordRevenue(
      id,
      parseSchema(DealRevenueCreateSchema, body),
    );
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.dealService.updateStatus(
      id,
      parseSchema(DealStatusUpdateSchema, body),
      ctx,
    );
  }

  @Get(':id')
  getDetail(@Param('id') id: string) {
    return this.dealService.getDetail(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() body: unknown) {
    return this.dealService.updateDeal(id, parseSchema(DealUpdateSchema, body));
  }
}

@Controller('artists')
@UseGuards(ClerkAuthGuard)
export class ArtistDealsController {
  constructor(private readonly dealService: DealService) {}

  @Get(':id/deals')
  listDeals(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.dealService.listArtistDeals(
      id,
      parseSchema(DealListQuerySchema, query),
    );
  }
}

@Controller('brands')
@UseGuards(ClerkAuthGuard)
export class BrandDealsController {
  constructor(private readonly dealService: DealService) {}

  @Get(':id/deals')
  listDeals(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
  ) {
    return this.dealService.listBrandDeals(
      id,
      parseSchema(DealListQuerySchema, query),
    );
  }
}
