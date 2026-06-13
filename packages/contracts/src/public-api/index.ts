import { z } from 'zod';

export const ApiScopeSchema = z.enum([
  'read:artists',
  'read:communities',
  'read:opportunities',
  'read:events',
  'read:venues',
  'read:analytics',
  'read:identity',
  'read:export',
  'read:graph',
]);

export const ApiKeyCreateSchema = z.object({
  name: z.string().min(1).max(120),
  scopes: z.array(ApiScopeSchema).min(1).default(['read:artists']),
  ownerOrgId: z.string().min(1).optional(),
  rateLimit: z.coerce.number().int().min(1).max(10_000).optional().default(100),
});

export const PublicPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
});

export const PublicArtistListQuerySchema = PublicPaginationQuerySchema.extend({
  city: z.string().min(1).optional(),
  genre: z.string().min(1).optional(),
});

export const PublicCommunityListQuerySchema = PublicPaginationQuerySchema.extend({
  city: z.string().min(1).optional(),
});

export const PublicOpportunityListQuerySchema = PublicPaginationQuerySchema.extend({
  city: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
});

export const PublicEventListQuerySchema = PublicPaginationQuerySchema.extend({
  city: z.string().min(1).optional(),
});

export const PublicVenueListQuerySchema = PublicPaginationQuerySchema.extend({
  city: z.string().min(1).optional(),
});

export const TscIdentityPublicParamSchema = z.object({
  namespace: z.string().min(1),
  slug: z.string().min(1),
});

export const WhiteLabelTenantTypeSchema = z.enum(['agency', 'community', 'festival']);

export const WhiteLabelNavItemSchema = z.object({
  label: z.string().min(1).max(80),
  path: z.string().min(1).max(200),
});

export const WhiteLabelTenantConfigSchema = z
  .object({
    agencyId: z.string().min(1).optional(),
    communityId: z.string().min(1).optional(),
    festivalEventIds: z.array(z.string().min(1)).optional(),
    navItems: z.array(WhiteLabelNavItemSchema).optional(),
    tagline: z.string().max(240).optional(),
  })
  .default({});

export const WhiteLabelTenantCreateSchema = z.object({
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  name: z.string().min(1).max(120),
  type: WhiteLabelTenantTypeSchema,
  customDomain: z.string().min(3).max(253).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  config: WhiteLabelTenantConfigSchema.optional(),
  apiKeyId: z.string().min(1).optional(),
  isActive: z.boolean().optional().default(true),
});

export const WhiteLabelTenantSlugParamSchema = z.object({
  slug: z.string().min(1),
});
