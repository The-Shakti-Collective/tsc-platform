import { z } from 'zod';

export const NotificationCreateSchema = z.object({
  recipientPersonId: z.string().min(1),
  organizationId: z.string().optional(),
  type: z.enum(['system', 'inquiry', 'gig', 'invoice', 'message']),
  title: z.string().min(1),
  body: z.string().optional(),
});

export const NotificationListQuerySchema = z.object({
  unreadOnly: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type NotificationCreateInput = z.infer<typeof NotificationCreateSchema>;
