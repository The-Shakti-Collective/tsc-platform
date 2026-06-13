import { z } from 'zod';

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

export const ApplicationStatusTransitionSchema = z.object({
  status: z.enum(['shortlisted', 'won', 'rejected']),
  notes: z.string().max(2000).optional(),
});
