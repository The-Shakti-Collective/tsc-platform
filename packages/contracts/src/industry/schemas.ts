import { z } from 'zod';

export const BrandStatusSchema = z.enum(['active', 'pending', 'archived']);

export const BrandBudgetRangeSchema = z.enum([
  'under_5l',
  'five_to_25l',
  'twenty_five_to_1cr',
  'over_1cr',
  'undisclosed',
]);

export const BrandListQuerySchema = z.object({
  industry: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  status: BrandStatusSchema.optional(),
  verified: z.coerce.boolean().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const BrandCreateSchema = z.object({
  name: z.string().min(2).max(200),
  industry: z.string().max(120).optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().max(120).optional(),
  country: z.string().max(120).optional(),
  logo: z.string().url().optional().or(z.literal('')),
  description: z.string().max(4000).optional(),
  budgetRange: BrandBudgetRangeSchema.optional(),
  categories: z.array(z.string().min(1)).optional().default([]),
  verified: z.boolean().optional().default(false),
  status: BrandStatusSchema.optional().default('active'),
  personId: z.string().min(1).optional(),
});

export const BrandUpdateSchema = BrandCreateSchema.partial();

export const BrandCreateOpportunitySchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
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
  category: z
    .enum([
      'scholarship',
      'residency',
      'brand_deal',
      'festival_slot',
      'workshop',
      'collaboration',
      'open_call',
      'funding',
    ])
    .optional(),
  city: z.string().max(120).optional(),
  genre: z.string().max(120).optional(),
  requirements: z.array(z.string().min(1)).optional().default([]),
  deadline: z.string().datetime().optional(),
  value: z.number().nonnegative().optional(),
  budget: z.number().nonnegative().optional(),
  marketplaceVisible: z.boolean().optional().default(true),
});

export const AgencyListQuerySchema = z.object({
  city: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const AgencyCreateSchema = z.object({
  name: z.string().min(2).max(200),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().max(120).optional(),
  teamSize: z.coerce.number().int().min(1).max(100000).optional(),
  personId: z.string().min(1).optional(),
});

export const AgencyUpdateSchema = AgencyCreateSchema.partial();

export const LabelListQuerySchema = z.object({
  genre: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const LabelCreateSchema = z.object({
  name: z.string().min(2).max(200),
  genre: z.string().max(120).optional(),
  website: z.string().url().optional().or(z.literal('')),
  city: z.string().max(120).optional(),
});

export const LabelUpdateSchema = LabelCreateSchema.partial();

export const LabelSigningStubSchema = z.object({
  artistId: z.string().min(1),
  notes: z.string().max(500).optional(),
});
