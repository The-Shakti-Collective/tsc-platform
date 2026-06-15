import { z } from 'zod';

export const ArtistListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
  q: z.string().optional(),
});

export const ArtistCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  displayName: z.string().optional(),
  personId: z.string().optional(),
  bio: z.string().optional(),
});

export type ArtistCreateInput = z.infer<typeof ArtistCreateSchema>;
