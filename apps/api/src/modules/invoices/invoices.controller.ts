import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { InvoiceCreateSchema, InvoiceListQuerySchema } from './dto';
import { InvoicesService } from './invoices.service';

@Controller('invoices')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(InvoiceListQuerySchema, query);
    return this.service.list(ctx, {
      artistId: parsed.artistId,
      status: parsed.status,
      limit: parsed.limit,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'ARTIST')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(InvoiceCreateSchema, body), ctx);
  }
}
