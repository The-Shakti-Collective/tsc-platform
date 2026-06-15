import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { Roles } from '../../common/auth/roles.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  NotificationCreateSchema,
  NotificationListQuerySchema,
} from './dto';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class NotificationController {
  constructor(private readonly service: NotificationService) {}

  @Get('health')
  health() {
    return { module: 'notification', status: 'ok', sprint: 'coreknot-p1-p3' };
  }

  @Get()
  list(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(NotificationListQuerySchema, query);
    return this.service.list(ctx, {
      unreadOnly: parsed.unreadOnly,
      limit: parsed.limit,
    });
  }

  @Post()
  @Roles('SUPER_ADMIN', 'ORG_OWNER', 'MANAGER')
  create(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.create(parseSchema(NotificationCreateSchema, body), ctx);
  }
}
