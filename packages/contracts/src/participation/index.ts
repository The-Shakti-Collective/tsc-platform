import { z } from 'zod';

export const EventParticipationRoleSchema = z.enum([
  'Attendee',
  'Artist',
  'Volunteer',
  'Organizer',
  'Judge',
  'Speaker',
]);

export const EventParticipationStatusSchema = z.enum([
  'registered',
  'checked_in',
  'cancelled',
  'no_show',
]);

export const EventParticipantsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(25),
  role: EventParticipationRoleSchema.optional(),
  status: EventParticipationStatusSchema.optional(),
});

export const EventRegisterSchema = z.object({
  role: EventParticipationRoleSchema.optional().default('Attendee'),
});

export const EventCheckInSchema = z
  .object({
    qrToken: z.string().min(1).optional(),
  })
  .strict();

export const EventParticipantRolePatchSchema = z.object({
  role: EventParticipationRoleSchema,
});
