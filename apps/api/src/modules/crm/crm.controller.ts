import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { LeadCreateSchema, LeadListQuerySchema } from './dto';
import { CrmService } from './crm.service';

@Controller('crm/leads')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(LeadListQuerySchema, query);
    return this.service.listLeads(parsed.organizationId, ctx, {
      stage: parsed.stage,
      limit: parsed.limit,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'TEAM_MEMBER')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.createLead(parseSchema(LeadCreateSchema, body), ctx);
  }
}
