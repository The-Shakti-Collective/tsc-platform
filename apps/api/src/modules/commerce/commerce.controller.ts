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
import {
  ExperienceCatalogQuerySchema,
  FanPurchasesQuerySchema,
  MerchCatalogQuerySchema,
  TicketCatalogQuerySchema,
} from './schema';
import { CommerceService } from './commerce.service';

@Controller('commerce')
export class CommerceController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get('tickets')
  listTickets(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(TicketCatalogQuerySchema, query);
    return this.commerceService.listTickets(parsed.eventId);
  }

  @Get('merch')
  listMerch(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(MerchCatalogQuerySchema, query);
    return this.commerceService.listMerch(parsed.artistId, parsed.communityId);
  }

  @Get('experiences')
  listExperiences(@Query() query: Record<string, unknown>) {
    const parsed = parseSchema(ExperienceCatalogQuerySchema, query);
    return this.commerceService.listExperiences(parsed.artistId);
  }

  @Post('tickets/:id/purchase')
  @UseGuards(ClerkAuthGuard)
  purchaseTicket(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.commerceService.purchaseTicket(id, ctx);
  }

  @Post('merch/:id/purchase')
  @UseGuards(ClerkAuthGuard)
  purchaseMerch(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.commerceService.purchaseMerch(id, ctx);
  }

  @Post('experiences/:id/purchase')
  @UseGuards(ClerkAuthGuard)
  purchaseExperience(
    @Param('id') id: string,
    @Membership() ctx: MembershipContext,
  ) {
    return this.commerceService.purchaseExperience(id, ctx);
  }
}

@Controller('fans')
@UseGuards(ClerkAuthGuard)
export class CommerceFanController {
  constructor(private readonly commerceService: CommerceService) {}

  @Get('me/purchases')
  getMyPurchases(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(FanPurchasesQuerySchema, query);
    return this.commerceService.getMyPurchases(ctx, parsed.limit);
  }
}
