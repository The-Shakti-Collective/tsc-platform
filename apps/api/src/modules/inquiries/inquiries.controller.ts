import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { InquiryCreateSchema, InquiryListQuerySchema } from './dto';
import { InquiriesService } from './inquiries.service';

@Controller('inquiries')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class InquiriesController {
  constructor(private readonly service: InquiriesService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(InquiryListQuerySchema, query);
    return this.service.list(parsed.organizationId, ctx, {
      status: parsed.status,
      limit: parsed.limit,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'TEAM_MEMBER', 'CLIENT')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(InquiryCreateSchema, body), ctx);
  }
}
