import { z } from 'zod';

export const CreditEarnReasonSchema = z.enum([
  'attend_event',
  'join_community',
  'complete_collaboration',
  'complete_opportunity',
  'help_member',
  'superfan_platinum',
  'subscribed_membership',
  'share_content',
  'refer_member',
  'general_support',
  'fan_purchase',
]);

export const CreditEarnSchema = z.object({
  personId: z.string().min(1),
  reason: CreditEarnReasonSchema,
  referenceType: z.string().min(1).optional(),
  referenceId: z.string().min(1).optional(),
});

export const CreditHistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export type CreditEarnInput = z.infer<typeof CreditEarnSchema>;
export type CreditHistoryQuery = z.infer<typeof CreditHistoryQuerySchema>;
