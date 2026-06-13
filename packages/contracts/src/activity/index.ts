import { ACTIVITY_ACTIONS } from '@tsc/database';
import { z } from 'zod';

export const ActivityActionSchema = z.enum(ACTIVITY_ACTIONS);

export const ActivityVisibilitySchema = z.enum(['public', 'followers', 'private']);

export const ActivityFeedQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const ActivityRecordSchema = z.object({
  actorPersonId: z.string().min(1),
  action: ActivityActionSchema,
  targetType: z.string().min(1),
  targetId: z.string().min(1),
  metadata: z.record(z.unknown()).optional().default({}),
  visibility: ActivityVisibilitySchema.optional().default('public'),
  timestamp: z.string().datetime().optional(),
});
