import { z } from 'zod';

export const PassportLinkSchema = z.object({
  label: z.string().min(1).max(80),
  url: z.string().url().max(500),
});

export const PassportEditSchema = z
  .object({
    isPublic: z.boolean().optional(),
    showHealthScore: z.boolean().optional(),
    showCommunityScore: z.boolean().optional(),
    showActivityScore: z.boolean().optional(),
    showOpportunityHistory: z.boolean().optional(),
    showCareerGraph: z.boolean().optional(),
    headline: z.string().max(160).nullable().optional(),
    bio: z.string().max(4000).nullable().optional(),
    photoUrl: z.string().url().max(500).nullable().optional(),
    links: z.array(PassportLinkSchema).max(12).optional(),
  })
  .strict();

export const PassportSlugParamSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
});
