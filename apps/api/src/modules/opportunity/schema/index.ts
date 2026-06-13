import { z } from 'zod';
import {
  BrandApplicationReviewSchema,
  BrandApplicationsQuerySchema,
  MarketplaceListingTrackSchema,
  MarketplaceListingsQuerySchema,
  MarketplaceListingTypeSchema,
  MarketplaceSearchQuerySchema,
} from '@tsc/contracts/marketplace/listing';

export {
  BrandApplicationReviewSchema,
  BrandApplicationsQuerySchema,
  MarketplaceListingTrackSchema,
  MarketplaceListingsQuerySchema,
  MarketplaceListingTypeSchema,
  MarketplaceSearchQuerySchema,
};

export const OpportunityCategorySchema = z.enum([
  'scholarship',
  'residency',
  'brand_deal',
  'festival_slot',
  'workshop',
  'collaboration',
  'open_call',
  'funding',
]);

export const OpportunityApplicationStatusSchema = z.enum([
  'saved',
  'applied',
  'shortlisted',
  'won',
  'rejected',
]);

export const MarketplaceBrowseQuerySchema = z.object({
  category: OpportunityCategorySchema.optional(),
  city: z.string().min(1).optional(),
  deadlineBefore: z.string().datetime().optional(),
  deadlineAfter: z.string().datetime().optional(),
  artistId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const OpportunityApplySchema = z.object({
  artistId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
});

export const OpportunitySaveSchema = z.object({
  artistId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
});

export const OpportunityShareSchema = z.object({
  channel: z.enum(['link', 'email', 'whatsapp']).optional().default('link'),
});

export const ArtistApplicationsQuerySchema = z.object({
  status: OpportunityApplicationStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const OpportunityApplicationUpdateSchema = z.object({
  status: z.enum(['shortlisted', 'won', 'rejected']),
});

export type MarketplaceBrowseQuery = z.infer<typeof MarketplaceBrowseQuerySchema>;
export type OpportunityApplyInput = z.infer<typeof OpportunityApplySchema>;
export type OpportunitySaveInput = z.infer<typeof OpportunitySaveSchema>;
export type OpportunityShareInput = z.infer<typeof OpportunityShareSchema>;
export type ArtistApplicationsQuery = z.infer<typeof ArtistApplicationsQuerySchema>;
export type OpportunityApplicationUpdateInput = z.infer<
  typeof OpportunityApplicationUpdateSchema
>;

export type MarketplaceListingsQuery = z.infer<typeof MarketplaceListingsQuerySchema>;
export type MarketplaceSearchQuery = z.infer<typeof MarketplaceSearchQuerySchema>;
export type BrandApplicationsQuery = z.infer<typeof BrandApplicationsQuerySchema>;
export type BrandApplicationReviewInput = z.infer<typeof BrandApplicationReviewSchema>;
export type MarketplaceListingTrackInput = z.infer<typeof MarketplaceListingTrackSchema>;
