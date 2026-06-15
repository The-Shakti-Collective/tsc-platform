import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  OrganizationCreateSchema,
  OrganizationListQuerySchema,
} from './dto';
import { OrganizationsService } from './organizations.service';

@Controller('organizations')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class OrganizationsController {
  constructor(private readonly service: OrganizationsService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(OrganizationListQuerySchema, query);
    return this.service.list(ctx, parsed.limit);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(OrganizationCreateSchema, body), ctx);
  }

  @Get(':id')
  getById(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.service.getById(id, ctx);
  }
}
