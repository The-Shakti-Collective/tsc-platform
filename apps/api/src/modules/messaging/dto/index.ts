import { z } from 'zod';

export const MessageCreateSchema = z.object({
  organizationId: z.string().optional(),
  threadId: z.string().min(1),
  body: z.string().min(1),
});

export const MessageListQuerySchema = z.object({
  threadId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type MessageCreateInput = z.infer<typeof MessageCreateSchema>;
