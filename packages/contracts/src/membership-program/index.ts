import { z } from 'zod';

export const MembershipBenefitSchema = z.enum([
  'early_access',
  'private_events',
  'meetups',
  'discounts',
  'exclusive_content',
]);

export const MembershipProgramTierSchema = z.enum([
  'standard',
  'plus',
  'premium',
  'circle',
  'collective',
]);

export const MembershipCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(1)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase kebab-case'),
  price: z.coerce.number().min(0).optional().default(0),
  currency: z.string().min(3).max(3).optional().default('INR'),
  tier: MembershipProgramTierSchema.optional().default('standard'),
  benefits: z.array(MembershipBenefitSchema).optional().default([]),
  isActive: z.boolean().optional().default(true),
});

export const MembershipPatchSchema = MembershipCreateSchema.partial();

export type MembershipCreateInput = z.infer<typeof MembershipCreateSchema>;
export type MembershipPatchInput = z.infer<typeof MembershipPatchSchema>;
