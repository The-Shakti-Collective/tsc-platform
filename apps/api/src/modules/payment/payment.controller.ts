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
  EscrowHoldSchema,
  EscrowReleaseSchema,
  InvoiceCollectSchema,
  InvoiceMarkPaidSchema,
  PayoutScheduleSchema,
  PaymentsDashboardQuerySchema,
  SettlementListQuerySchema,
} from './schema';
import { PaymentService } from './payment.service';

@Controller('payments')
@UseGuards(ClerkAuthGuard)
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get('dashboard')
  dashboard(@Query() query: Record<string, unknown>) {
    return this.paymentService.dashboard(
      parseSchema(PaymentsDashboardQuerySchema, query),
    );
  }

  @Get('settlements')
  listSettlements(@Query() query: Record<string, unknown>) {
    return this.paymentService.listSettlements(
      parseSchema(SettlementListQuerySchema, query),
    );
  }

  @Get('payouts/artist/:id')
  listArtistPayouts(@Param('id') artistId: string) {
    return this.paymentService.listArtistPayouts(artistId);
  }

  @Post('payouts')
  schedulePayout(@Body() body: unknown, @Membership() ctx: MembershipContext) {
    return this.paymentService.schedulePayout(
      parseSchema(PayoutScheduleSchema, body),
      ctx.personId,
    );
  }

  @Post('invoices/:id/collect')
  collectInvoice(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.paymentService.collectInvoice(
      id,
      parseSchema(InvoiceCollectSchema, body),
      ctx.personId,
    );
  }

  @Post('invoices/:id/mark-paid')
  markInvoicePaid(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.paymentService.markInvoicePaid(
      id,
      parseSchema(InvoiceMarkPaidSchema, body),
      ctx.personId,
    );
  }

  @Post('escrow/:dealId/hold')
  holdEscrow(
    @Param('dealId') dealId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.paymentService.holdEscrow(
      dealId,
      parseSchema(EscrowHoldSchema, body),
      ctx.personId,
    );
  }

  @Post('escrow/:id/release')
  releaseEscrow(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.paymentService.releaseEscrow(
      id,
      parseSchema(EscrowReleaseSchema, body),
      ctx.personId,
    );
  }
}
