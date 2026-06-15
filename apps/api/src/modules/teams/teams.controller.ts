import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { TeamCreateSchema, TeamListQuerySchema } from './dto';
import { TeamsService } from './teams.service';

@Controller('teams')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly service: TeamsService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(TeamListQuerySchema, query);
    return this.service.list(parsed.organizationId, ctx, parsed.limit);
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(TeamCreateSchema, body), ctx);
  }
}
