export type EventParticipationRole =
  | 'Attendee'
  | 'Artist'
  | 'Volunteer'
  | 'Organizer'
  | 'Judge'
  | 'Speaker';

export type EventParticipationStatus =
  | 'registered'
  | 'checked_in'
  | 'cancelled'
  | 'no_show';

export interface EventParticipantRecord {
  personId: string;
  name: string;
  role: EventParticipationRole;
  status: EventParticipationStatus;
  checkedInAt: string | null;
  relationshipType: string;
  registeredAt: string;
}

export interface EventRegisterPayload {
  eventId: string;
  personId: string;
  role: EventParticipationRole;
  status: EventParticipationStatus;
  participationId: string;
  relationshipId: string;
  created: boolean;
  updatedAt: string;
}

export interface EventCheckInPayload {
  eventId: string;
  personId: string;
  status: EventParticipationStatus;
  checkedInAt: string;
  qrStub: boolean;
  updatedAt: string;
}

export interface EventParticipantsPayload {
  eventId: string;
  items: EventParticipantRecord[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
  updatedAt: string;
}

export interface EventParticipantRolePayload {
  eventId: string;
  personId: string;
  role: EventParticipationRole;
  relationshipId: string;
  updatedAt: string;
}
