import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { canManageArtist, type MembershipContext } from '@tsc/permissions';
import {
  participationRelationshipType,
  type EventParticipationRoleValue,
} from '@tsc/database';
import { ActivityService } from '../../modules/activity/activity.service';
import { CreditsService } from '../credits/credits.service';
import { ProfileService } from '../profile/profile.service';
import { FanService } from '../fan/fan.service';
import { SupportService } from '../support/support.service';
import { displayPersonName, EventRepository } from './event.repository';
import type {
  EventCheckInInput,
  EventParticipantRolePatchInput,
  EventParticipantsQuery,
  EventRegisterInput,
} from './dto';
import type {
  EventCheckInPayload,
  EventParticipantRolePayload,
  EventParticipantsPayload,
  EventRegisterPayload,
} from './types';

@Injectable()
export class EventService {
  constructor(
    private readonly repository: EventRepository,
    private readonly profileService: ProfileService,
    private readonly fanService: FanService,
    private readonly activityService: ActivityService,
    private readonly creditsService: CreditsService,
    private readonly supportService: SupportService,
  ) {}

  async register(
    eventId: string,
    input: EventRegisterInput,
    ctx: MembershipContext,
  ): Promise<EventRegisterPayload> {
    const event = await this.requireEvent(eventId);
    const personId = ctx.userId;

    const person = await this.repository.findPerson(personId);
    if (!person) {
      throw new NotFoundException(`Person ${personId} not found — resolve identity first`);
    }

    await this.profileService.ensureProfileStub({
      personId: person.id,
      displayName: person.displayName ?? person.name,
    });
    void this.fanService.ensureFanProfileStub(person.id);

    const existing = await this.repository.findParticipation(eventId, personId);
    const role = (input.role ?? 'Attendee') as EventParticipationRoleValue;
    const participation = await this.repository.upsertParticipation(eventId, personId, {
      role,
    });

    await this.repository.removeStaleParticipationRelationships(
      eventId,
      personId,
      participationRelationshipType(role),
    );
    const relationship = await this.repository.upsertParticipationRelationship(
      eventId,
      personId,
      role,
    );

    await this.activityService.recordFromStub({
      type: 'event.participant.registered',
      actorId: personId,
      entityType: 'Event',
      entityId: eventId,
      targetEntityType: 'Person',
      targetEntityId: personId,
      metadata: {
        eventTitle: event.title,
        role,
        relationshipType: relationship.relationshipType,
      },
    });

    const created = !existing || existing.status === 'cancelled';
    if (created) {
      await this.supportService.recordFromEventRegister(
        personId,
        eventId,
        participation.id,
      );
    }

    return {
      eventId,
      personId,
      role: participation.role,
      status: participation.status,
      participationId: participation.id,
      relationshipId: relationship.id,
      created,
      updatedAt: new Date().toISOString(),
    };
  }

  async checkIn(
    eventId: string,
    input: EventCheckInInput,
    ctx: MembershipContext,
  ): Promise<EventCheckInPayload> {
    await this.requireEvent(eventId);
    const personId = ctx.userId;

    const participation = await this.repository.findParticipation(eventId, personId);
    if (!participation || participation.status === 'cancelled') {
      throw new BadRequestException('Register for the event before check-in');
    }
    if (participation.status === 'checked_in') {
      throw new BadRequestException('Already checked in');
    }

    const updated = await this.repository.checkInParticipation(eventId, personId);

    await this.activityService.recordFromStub({
      type: 'event.participant.checked_in',
      actorId: personId,
      entityType: 'Event',
      entityId: eventId,
      targetEntityType: 'Person',
      targetEntityId: personId,
      metadata: {
        qrStub: true,
        qrToken: input.qrToken ?? null,
      },
    });

    void this.creditsService.earnFromEventCheckIn(personId, eventId);

    return {
      eventId,
      personId,
      status: updated.status,
      checkedInAt: updated.checkedInAt?.toISOString() ?? new Date().toISOString(),
      qrStub: true,
      updatedAt: new Date().toISOString(),
    };
  }

  async listParticipants(
    eventId: string,
    query: EventParticipantsQuery,
    ctx: MembershipContext,
  ): Promise<EventParticipantsPayload> {
    const event = await this.requireEvent(eventId);
    await this.assertCanView(eventId, ctx, event.artistId);

    const [rows, total] = await this.repository.listParticipants(eventId, query);

    return {
      eventId,
      items: rows.map((row) => ({
        personId: row.personId,
        name: displayPersonName(row.person),
        role: row.role,
        status: row.status,
        checkedInAt: row.checkedInAt?.toISOString() ?? null,
        relationshipType: participationRelationshipType(
          row.role as EventParticipationRoleValue,
        ),
        registeredAt: row.createdAt.toISOString(),
      })),
      page: query.page,
      limit: query.limit,
      total,
      hasMore: query.page * query.limit < total,
      updatedAt: new Date().toISOString(),
    };
  }

  async updateParticipantRole(
    eventId: string,
    personId: string,
    input: EventParticipantRolePatchInput,
    ctx: MembershipContext,
  ): Promise<EventParticipantRolePayload> {
    const event = await this.requireEvent(eventId);
    await this.assertCanManage(eventId, ctx, event.artistId);

    const participation = await this.repository.findParticipation(eventId, personId);
    if (!participation || participation.status === 'cancelled') {
      throw new NotFoundException(`Participant ${personId} not found`);
    }

    const role = input.role as EventParticipationRoleValue;
    await this.repository.updateParticipantRole(eventId, personId, input);
    await this.repository.removeStaleParticipationRelationships(
      eventId,
      personId,
      participationRelationshipType(role),
    );
    const relationship = await this.repository.upsertParticipationRelationship(
      eventId,
      personId,
      role,
    );

    await this.activityService.recordFromStub({
      type: 'event.participant.role_changed',
      actorId: ctx.userId,
      entityType: 'Event',
      entityId: eventId,
      targetEntityType: 'Person',
      targetEntityId: personId,
      metadata: { role },
    });

    return {
      eventId,
      personId,
      role,
      relationshipId: relationship.id,
      updatedAt: new Date().toISOString(),
    };
  }

  private async requireEvent(eventId: string) {
    const event = await this.repository.findEvent(eventId);
    if (!event) {
      throw new NotFoundException(`Event ${eventId} not found`);
    }
    return event;
  }

  private async assertCanView(
    eventId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.repository.personOrganizesEvent(eventId, ctx.userId)) return;

    const participation = await this.repository.findParticipation(eventId, ctx.userId);
    if (participation && participation.status !== 'cancelled') return;

    throw new ForbiddenException('Cannot view event participants');
  }

  private async assertCanManage(
    eventId: string,
    ctx: MembershipContext,
    artistId?: string | null,
  ) {
    if (ctx.roles.includes('admin')) return;
    if (artistId && canManageArtist(ctx, artistId)) return;
    if (await this.repository.personOrganizesEvent(eventId, ctx.userId)) return;

    throw new ForbiddenException('Event organizer permissions required');
  }
}
