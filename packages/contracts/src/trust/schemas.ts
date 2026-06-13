import { z } from 'zod';

export const TrustEntityTypeSchema = z.enum(['Artist', 'Brand', 'Agency']);

export const TrustRefreshParamsSchema = z.object({
  entityType: TrustEntityTypeSchema,
  entityId: z.string().min(1),
});

export const BrandMatchV2Schema = z.object({
  brandId: z.string().min(1),
  genre: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  budget: z.coerce.number().nonnegative().optional(),
  audienceAge: z.string().min(1).optional(),
});

export const ArtistOpportunitiesV2Schema = z.object({
  artistId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export type BrandMatchV2Input = z.infer<typeof BrandMatchV2Schema>;
export type ArtistOpportunitiesV2Input = z.infer<typeof ArtistOpportunitiesV2Schema>;
