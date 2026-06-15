import { z } from 'zod';

export const ReleaseListQuerySchema = z.object({
  organizationId: z.string().min(1),
  artistId: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'released', 'archived']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const ReleaseCreateSchema = z.object({
  organizationId: z.string().min(1),
  artistId: z.string().optional(),
  title: z.string().min(1),
  type: z.string().optional(),
  releaseDate: z.coerce.date().optional(),
  upc: z.string().optional(),
  isrc: z.string().optional(),
  distributor: z.string().optional(),
  dspLinks: z.array(z.object({ platform: z.string(), url: z.string() })).optional(),
  campaignNotes: z.string().optional(),
  tracks: z
    .array(
      z.object({
        title: z.string().min(1),
        trackNumber: z.coerce.number().int().positive().default(1),
        isrc: z.string().optional(),
        durationSec: z.coerce.number().int().optional(),
      }),
    )
    .optional(),
});

export const ReleasePatchSchema = ReleaseCreateSchema.partial().omit({
  organizationId: true,
});

export const ReleaseIdParamSchema = z.object({
  id: z.string().min(1),
});

export type ReleaseListQuery = z.output<typeof ReleaseListQuerySchema>;
export type ReleaseCreateInput = z.output<typeof ReleaseCreateSchema>;
export type ReleasePatchInput = z.output<typeof ReleasePatchSchema>;
