import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import type { MembershipContext } from '@tsc/permissions';
import { Membership } from '../../common/auth/membership.decorator';
import { ClerkAuthGuard } from '../../common/auth/clerk-auth.guard';
import { parseSchema } from '../../common/validation/parse-schema';
import { EventService } from './event.service';
import {
  EventCheckInSchema,
  EventParticipantRolePatchSchema,
  EventParticipantsQuerySchema,
  EventRegisterSchema,
} from './schema';

@Controller('events')
@UseGuards(ClerkAuthGuard)
export class EventController {
  constructor(private readonly eventService: EventService) {}

  @Post(':id/register')
  register(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventService.register(
      id,
      parseSchema(EventRegisterSchema, body ?? {}),
      ctx,
    );
  }

  @Post(':id/check-in')
  checkIn(
    @Param('id') id: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventService.checkIn(
      id,
      parseSchema(EventCheckInSchema, body ?? {}),
      ctx,
    );
  }

  @Get(':id/participants')
  listParticipants(
    @Param('id') id: string,
    @Query() query: Record<string, unknown>,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventService.listParticipants(
      id,
      parseSchema(EventParticipantsQuerySchema, query),
      ctx,
    );
  }

  @Patch(':id/participants/:personId/role')
  updateParticipantRole(
    @Param('id') id: string,
    @Param('personId') personId: string,
    @Body() body: unknown,
    @Membership() ctx: MembershipContext,
  ) {
    return this.eventService.updateParticipantRole(
      id,
      personId,
      parseSchema(EventParticipantRolePatchSchema, body),
      ctx,
    );
  }
}
