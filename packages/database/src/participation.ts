import type { Prisma } from '@prisma/client';
import type { RelationshipType } from './relationship.js';

export const EVENT_PARTICIPATION_ROLES = [
  'Attendee',
  'Artist',
  'Volunteer',
  'Organizer',
  'Judge',
  'Speaker',
] as const;

export type EventParticipationRoleValue = (typeof EVENT_PARTICIPATION_ROLES)[number];

export const EVENT_PARTICIPATION_STATUSES = [
  'registered',
  'checked_in',
  'cancelled',
  'no_show',
] as const;

export type EventParticipationStatusValue =
  (typeof EVENT_PARTICIPATION_STATUSES)[number];

/** Maps participation role → graph relationship type for Person → Event edges. */
export const PARTICIPATION_ROLE_RELATIONSHIP_MAP: Record<
  EventParticipationRoleValue,
  RelationshipType
> = {
  Attendee: 'ATTENDED',
  Artist: 'PERFORMED_AT',
  Volunteer: 'ATTENDED',
  Organizer: 'MANAGES',
  Judge: 'ATTENDED',
  Speaker: 'PERFORMED_AT',
};

export const eventParticipationInclude = {
  person: {
    select: {
      id: true,
      displayName: true,
      name: true,
    },
  },
} satisfies Prisma.EventParticipationInclude;

export function participationRelationshipType(
  role: EventParticipationRoleValue,
): RelationshipType {
  return PARTICIPATION_ROLE_RELATIONSHIP_MAP[role];
}
