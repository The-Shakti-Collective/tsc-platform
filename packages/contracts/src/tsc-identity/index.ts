import { z } from 'zod';

export const TscIdentityNamespaceSchema = z.enum(['artist', 'community', 'brand', 'fan']);

export const TscIdentityEntityTypeSchema = z.enum([
  'Artist',
  'Community',
  'Brand',
  'Person',
  'Venue',
]);

export const TscVerificationBadgeSchema = z.enum([
  'verified_artist',
  'verified_community',
  'verified_venue',
  'verified_brand_partner',
]);

export const TscIdentitySlugParamSchema = z.object({
  namespace: TscIdentityNamespaceSchema,
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i),
});

export const TscIdentityEntityParamSchema = z.object({
  entityType: TscIdentityEntityTypeSchema,
  entityId: z.string().min(1),
});

export const AdminIdentityVerifySchema = z
  .object({
    badge: TscVerificationBadgeSchema,
    isPublic: z.boolean().optional(),
  })
  .strict();
