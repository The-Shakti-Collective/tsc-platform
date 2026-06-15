import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import {
  AgentRecommendationsQuerySchema,
  EventAgentRunInputSchema,
} from '@tsc/contracts/agents';
import { EventAgentService } from './event-agent.service';

/** CoreKnot client compat — `/api/agents/events` maps to `/api/agents/event`. */
@Controller('agents/events')
@UseGuards(ClerkAuthGuard)
export class EventAgentAliasController {
  constructor(private readonly eventAgent: EventAgentService) {}

  @Get(':eventId/insights')
  getInsights(
    @Param('eventId') eventId: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventAgent.getInsights(
      eventId,
      parseSchema(AgentRecommendationsQuerySchema, query),
      ctx,
    );
  }

  @Post(':eventId/run')
  run(
    @Param('eventId') eventId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventAgent.run(
      eventId,
      parseSchema(EventAgentRunInputSchema, body ?? {}),
      ctx,
    );
  }

  @Post('suggestions/:id/approve')
  approveSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.eventAgent.approveSuggestion(id, ctx);
  }

  @Post('suggestions/:id/dismiss')
  dismissSuggestion(@Param('id') id: string, @Membership() ctx: MembershipContext) {
    return this.eventAgent.dismissSuggestion(id, ctx);
  }
}
