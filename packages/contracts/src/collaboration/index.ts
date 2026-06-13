import { z } from 'zod';

export const CollaborationTypeSchema = z.enum([
  'need_rapper',
  'need_producer',
  'need_guitarist',
  'need_videographer',
  'need_cover_artist',
  'general',
]);

export const CollaborationStatusSchema = z.enum([
  'open',
  'filled',
  'closed',
  'expired',
]);

export const CollaborationApplicationStatusSchema = z.enum([
  'applied',
  'accepted',
  'rejected',
  'withdrawn',
]);

export const CollaborationBrowseQuerySchema = z.object({
  type: CollaborationTypeSchema.optional(),
  genre: z.string().min(1).optional(),
  city: z.string().min(1).optional(),
  status: CollaborationStatusSchema.optional().default('open'),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const CollaborationCreateSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  type: CollaborationTypeSchema,
  genres: z.array(z.string().min(1)).optional().default([]),
  city: z.string().max(120).optional(),
  expiresAt: z.string().datetime().optional(),
});

export const CollaborationUpdateSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(4000).optional(),
  type: CollaborationTypeSchema.optional(),
  genres: z.array(z.string().min(1)).optional(),
  city: z.string().max(120).optional(),
  status: CollaborationStatusSchema.optional(),
  expiresAt: z.string().datetime().nullable().optional(),
});

export const CollaborationApplySchema = z.object({
  message: z.string().max(2000).optional(),
});

export const CollaborationApplicationUpdateSchema = z.object({
  status: z.enum(['accepted', 'rejected']),
});

export type CollaborationBrowseQuery = z.infer<typeof CollaborationBrowseQuerySchema>;
export type CollaborationCreateInput = z.infer<typeof CollaborationCreateSchema>;
export type CollaborationUpdateInput = z.infer<typeof CollaborationUpdateSchema>;
export type CollaborationApplyInput = z.infer<typeof CollaborationApplySchema>;
export type CollaborationApplicationUpdateInput = z.infer<
  typeof CollaborationApplicationUpdateSchema
>;
