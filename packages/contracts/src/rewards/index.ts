import { z } from 'zod';

export const RewardCategorySchema = z.enum([
  'merch',
  'tickets',
  'meet_greet',
  'community_access',
  'priority_application',
]);

export const RewardRedemptionStatusSchema = z.enum([
  'pending',
  'fulfilled',
  'cancelled',
]);

export const RewardCatalogQuerySchema = z.object({
  category: RewardCategorySchema.optional(),
  activeOnly: z.coerce.boolean().optional().default(true),
});

export const RewardRedemptionPatchSchema = z.object({
  status: RewardRedemptionStatusSchema.optional(),
  notes: z.string().max(500).optional().nullable(),
});

export const CreditReferStubSchema = z.object({
  referredPersonId: z.string().min(1),
});

export type RewardCatalogQuery = z.infer<typeof RewardCatalogQuerySchema>;
export type RewardRedemptionPatchInput = z.infer<typeof RewardRedemptionPatchSchema>;
export type CreditReferStubInput = z.infer<typeof CreditReferStubSchema>;
