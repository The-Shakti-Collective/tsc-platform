import { z } from 'zod';

export const FanProfilePatchSchema = z
  .object({
    favoriteGenres: z.array(z.string().min(1).max(60)).max(20).optional(),
    favoriteArtists: z.array(z.string().min(1).max(80)).max(50).optional(),
    cities: z.array(z.string().min(1).max(120)).max(10).optional(),
  })
  .refine(
    (value) =>
      value.favoriteGenres !== undefined ||
      value.favoriteArtists !== undefined ||
      value.cities !== undefined,
    { message: 'At least one field required' },
  );

export const FanGraphQuerySchema = z.object({
  includeInactive: z.coerce.boolean().optional().default(false),
});

export const ArtistFansQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});

export const FanPersonIdParamSchema = z.object({
  personId: z.string().min(1),
});

export const FanArtistIdParamSchema = z.object({
  artistId: z.string().min(1),
});

export const SuperfanTierSchema = z.enum([
  'bronze',
  'silver',
  'gold',
  'platinum',
  'legend',
]);

export const SuperfanQuerySchema = z.object({
  artistId: z.string().min(1).optional(),
});

export const ArtistSuperfansQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional().default(100),
});
