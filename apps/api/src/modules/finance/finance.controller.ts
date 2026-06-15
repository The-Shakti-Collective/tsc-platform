import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { InvoiceListQuerySchema } from '../invoices/dto';
import { InvoicesService } from '../invoices/invoices.service';
import { ExpenseCreateSchema, FinanceListQuerySchema } from './dto';
import { FinanceService } from './finance.service';

@Controller('finance')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class FinanceController {
  constructor(
    private readonly service: FinanceService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get('expenses')
  listExpenses(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(FinanceListQuerySchema, query);
    return this.service.listExpenses(parsed.organizationId, ctx, parsed.limit);
  }

  @Post('expenses')
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER')
  createExpense(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.createExpense(parseSchema(ExpenseCreateSchema, body), ctx);
  }

  @Get('summary')
  summary(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(FinanceListQuerySchema, query);
    return this.service.summary(parsed.organizationId, ctx);
  }

  /** Legacy probe + client alias — native invoices live at `/api/invoices`. */
  @Get('invoices')
  listInvoices(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(InvoiceListQuerySchema, query);
    return this.invoicesService.list(ctx, {
      artistId: parsed.artistId,
      status: parsed.status,
      limit: parsed.limit,
    });
  }
}
