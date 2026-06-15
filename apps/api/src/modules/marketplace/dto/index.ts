import { z } from 'zod';

const orgId = z.string().min(1);

export const MarketplaceListingCreateSchema = z.object({
  organizationId: orgId.optional(),
  title: z.string().min(1),
  description: z.string().optional(),
  listingType: z
    .enum([
      'brand_campaign',
      'festival_slot',
      'opening_act',
      'workshop',
      'grant',
      'residency',
      'sync_licensing',
      'collaboration',
    ])
    .optional(),
  price: z.number().optional(),
  currency: z.string().optional(),
  opportunityId: z.string().optional(),
});

export const MarketplaceListQuerySchema = z.object({
  organizationId: orgId.optional(),
  status: z.enum(['draft', 'active', 'paused', 'closed']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type MarketplaceListingCreateInput = z.infer<
  typeof MarketplaceListingCreateSchema
>;
