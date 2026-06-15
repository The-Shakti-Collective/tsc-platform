import { z } from 'zod';

export const ContentListQuerySchema = z.object({
  artistId: z.string().min(1),
  releaseId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export const ContentAssetCreateSchema = z.object({
  artistId: z.string().min(1),
  releaseId: z.string().optional(),
  title: z.string().min(1),
  assetType: z.enum(['audio', 'video', 'image', 'document', 'other']).default('other'),
  mimeType: z.string().optional(),
  storageKey: z.string().optional(),
  url: z.string().url().optional(),
  sizeBytes: z.coerce.number().int().optional(),
});

export const ContentItemCreateSchema = z.object({
  artistId: z.string().min(1),
  title: z.string().min(1),
  body: z.string().optional(),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
});

export const ContentItemPatchSchema = ContentItemCreateSchema.partial().omit({ artistId: true });

export const ContentItemIdParamSchema = z.object({
  id: z.string().min(1),
});

export type ContentListQuery = z.output<typeof ContentListQuerySchema>;
export type ContentAssetCreateInput = z.output<typeof ContentAssetCreateSchema>;
export type ContentItemCreateInput = z.output<typeof ContentItemCreateSchema>;
export type ContentItemPatchInput = z.output<typeof ContentItemPatchSchema>;
