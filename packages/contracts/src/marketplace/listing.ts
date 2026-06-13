import { z } from 'zod';

export const MarketplaceListingTypeSchema = z.enum([
  'brand_campaign',
  'festival_slot',
  'opening_act',
  'workshop',
  'grant',
  'residency',
  'sync_licensing',
  'collaboration',
]);

export const MarketplaceOwnerTypeSchema = z.enum(['brand', 'agency', 'artist']);

export const MarketplaceListingsQuerySchema = z.object({
  type: MarketplaceListingTypeSchema.optional(),
  city: z.string().min(1).optional(),
  genre: z.string().min(1).optional(),
  ownerId: z.string().min(1).optional(),
  ownerType: MarketplaceOwnerTypeSchema.optional(),
  artistId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const MarketplaceSearchQuerySchema = z.object({
  q: z.string().max(200).optional(),
  type: MarketplaceListingTypeSchema.optional(),
  city: z.string().min(1).optional(),
  genre: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const MarketplaceListingTrackSchema = z.object({
  artistId: z.string().min(1).optional(),
  source: z.enum(['browse', 'search', 'detail', 'share']).optional().default('browse'),
});

export const BrandApplicationsQuerySchema = z.object({
  status: z
    .enum(['saved', 'applied', 'shortlisted', 'won', 'rejected'])
    .optional(),
  opportunityId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const BrandApplicationReviewSchema = z.object({
  action: z.enum(['shortlist', 'reject', 'hire']),
  notes: z.string().max(2000).optional(),
});
