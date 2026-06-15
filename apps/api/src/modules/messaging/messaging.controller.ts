import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { Membership } from '../../common/auth/membership.decorator';
import { RolesGuard } from '../../common/auth/roles.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { MessageCreateSchema, MessageListQuerySchema } from './dto';
import { MessagingService } from './messaging.service';

@Controller('messaging')
@UseGuards(ClerkAuthGuard, RolesGuard)
export class MessagingController {
  constructor(private readonly service: MessagingService) {}

  @Get('threads')
  listThread(
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    const parsed = parseSchema(MessageListQuerySchema, query);
    return this.service.listThread(parsed.threadId, ctx, parsed.limit);
  }

  @Post('messages')
  send(
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.service.send(parseSchema(MessageCreateSchema, body), ctx);
  }
}
