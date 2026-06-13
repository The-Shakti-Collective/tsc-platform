import { Injectable } from '@nestjs/common';
import type { Prisma } from '@tsc/database';
import { normalizeRelationshipType } from '@tsc/database';
import {
  participationRelationshipType,
  type EventParticipationRoleValue,
} from '@tsc/database';
import { PrismaService } from '../../common/database/prisma.service';
import { newId } from '../../common/ids';
import { toInputJson } from '../../common/json';
import type {
  EventParticipantRolePatchInput,
  EventParticipantsQuery,
  EventRegisterInput,
} from './dto';

@Injectable()
export class EventRepository {
  constructor(private readonly prisma: PrismaService) {}

  findEvent(id: string) {
    return this.prisma.client.event.findUnique({
      where: { id },
      include: {
        venue: { select: { name: true, city: true } },
        artist: { select: { id: true, displayName: true, slug: true } },
      },
    });
  }

  findPerson(id: string) {
    return this.prisma.client.person.findUnique({ where: { id } });
  }

  findParticipation(eventId: string, personId: string) {
    return this.prisma.client.eventParticipation.findUnique({
      where: { eventId_personId: { eventId, personId } },
    });
  }

  listParticipants(eventId: string, query: EventParticipantsQuery) {
    const skip = (query.page - 1) * query.limit;
    const where: Prisma.EventParticipationWhereInput = {
      eventId,
      status: query.status ?? undefined,
    };
    if (query.role) where.role = query.role;

    return Promise.all([
      this.prisma.client.eventParticipation.findMany({
        where,
        include: {
          person: {
            select: {
              id: true,
              displayName: true,
              name: true,
            },
          },
        },
        orderBy: [{ role: 'asc' }, { createdAt: 'desc' }],
        skip,
        take: query.limit,
      }),
      this.prisma.client.eventParticipation.count({ where }),
    ]);
  }

  upsertParticipation(
    eventId: string,
    personId: string,
    input: EventRegisterInput,
  ) {
    const role = (input.role ?? 'Attendee') as EventParticipationRoleValue;
    return this.prisma.client.eventParticipation.upsert({
      where: { eventId_personId: { eventId, personId } },
      create: {
        id: newId(),
        eventId,
        personId,
        role,
        status: 'registered',
      },
      update: {
        role,
        status: 'registered',
        checkedInAt: null,
      },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    });
  }

  checkInParticipation(eventId: string, personId: string) {
    const checkedInAt = new Date();
    return this.prisma.client.eventParticipation.update({
      where: { eventId_personId: { eventId, personId } },
      data: {
        status: 'checked_in',
        checkedInAt,
      },
    });
  }

  updateParticipantRole(
    eventId: string,
    personId: string,
    input: EventParticipantRolePatchInput,
  ) {
    return this.prisma.client.eventParticipation.update({
      where: { eventId_personId: { eventId, personId } },
      data: { role: input.role },
      include: {
        person: {
          select: {
            id: true,
            displayName: true,
            name: true,
          },
        },
      },
    });
  }

  upsertParticipationRelationship(
    eventId: string,
    personId: string,
    role: EventParticipationRoleValue,
  ) {
    const relationshipType = participationRelationshipType(role);
    return this.prisma.client.relationship.upsert({
      where: {
        sourceEntityType_sourceEntityId_targetEntityType_targetEntityId_relationshipType:
          {
            sourceEntityType: 'Person',
            sourceEntityId: personId,
            targetEntityType: 'Event',
            targetEntityId: eventId,
            relationshipType,
          },
      },
      create: {
        id: newId(),
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Event',
        targetEntityId: eventId,
        relationshipType,
        effectiveFrom: new Date(),
        metadata: toInputJson({
          source: 'event-participation',
          participationRole: role,
        }),
      },
      update: {
        effectiveTo: null,
        metadata: toInputJson({
          source: 'event-participation',
          participationRole: role,
        }),
      },
    });
  }

  removeStaleParticipationRelationships(
    eventId: string,
    personId: string,
    keepType: string,
  ) {
    return this.prisma.client.relationship.updateMany({
      where: {
        sourceEntityType: 'Person',
        sourceEntityId: personId,
        targetEntityType: 'Event',
        targetEntityId: eventId,
        relationshipType: { not: normalizeRelationshipType(keepType) },
        effectiveTo: null,
      },
      data: { effectiveTo: new Date() },
    });
  }

  personOrganizesEvent(eventId: string, personId: string) {
    return Promise.all([
      this.prisma.client.eventParticipation.findFirst({
        where: {
          eventId,
          personId,
          role: 'Organizer',
          status: { in: ['registered', 'checked_in'] },
        },
      }),
      this.prisma.client.relationship.findFirst({
        where: {
          sourceEntityType: 'Person',
          sourceEntityId: personId,
          targetEntityType: 'Event',
          targetEntityId: eventId,
          relationshipType: 'MANAGES',
        },
      }),
    ]).then(([participation, edge]) => Boolean(participation || edge));
  }
}

export function displayPersonName(person: {
  displayName: string | null;
  name: string | null;
  id?: string;
}): string {
  if (person.displayName?.trim()) return person.displayName.trim();
  if (person.name?.trim()) return person.name.trim();
  return person.id || 'Participant';
}
