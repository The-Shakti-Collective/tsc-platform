import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { UserCreateSchema, UserListQuerySchema } from './dto';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(UserListQuerySchema, query);
    return this.service.list(ctx, parsed.limit);
  }

  @Get('me')
  me(@Membership() ctx: MembershipContext) {
    return this.service.me(ctx);
  }

  @Post()
  @Roles('SUPER_ADMIN')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(UserCreateSchema, body), ctx);
  }
}
