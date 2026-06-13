import { z } from 'zod';

export const SupportActionTypeSchema = z.enum([
  'buy_ticket',
  'buy_membership',
  'buy_workshop',
  'buy_experience',
  'general_support',
]);

export const SupportActionStatusSchema = z.enum(['recorded', 'pending_payment']);

export const RecordSupportInputSchema = z.object({
  actionType: SupportActionTypeSchema.optional().default('general_support'),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().min(1).optional().default('INR'),
  status: SupportActionStatusSchema.optional().default('recorded'),
  metadata: z.record(z.unknown()).optional().default({}),
});

export const SupportHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const SupportersQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  sortBy: z.enum(['amount', 'count']).optional().default('amount'),
});

export type RecordSupportInput = z.infer<typeof RecordSupportInputSchema>;
export type SupportHistoryQuery = z.infer<typeof SupportHistoryQuerySchema>;
export type SupportersQuery = z.infer<typeof SupportersQuerySchema>;
