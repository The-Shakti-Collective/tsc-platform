import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { GigCreateSchema, GigListQuerySchema } from './dto';
import { GigsService } from './gigs.service';

@Controller('gigs')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class GigsController {
  constructor(private readonly service: GigsService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(GigListQuerySchema, query);
    return this.service.list(parsed.organizationId, ctx, {
      artistId: parsed.artistId,
      from: parsed.from,
      to: parsed.to,
      limit: parsed.limit,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER', 'ARTIST', 'TEAM_MEMBER')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(GigCreateSchema, body), ctx);
  }
}
