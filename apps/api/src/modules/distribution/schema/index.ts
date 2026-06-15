import { z } from 'zod';

export const DistributionChannelCreateSchema = z.object({
  artistId: z.string().min(1),
  provider: z.enum(['distrokid', 'manual', 'other']).default('distrokid'),
  name: z.string().min(1),
  config: z.record(z.unknown()).optional(),
});

export const DistributionSubmissionCreateSchema = z.object({
  channelId: z.string().min(1),
  releaseId: z.string().optional(),
  title: z.string().min(1),
  upc: z.string().optional(),
  isrc: z.string().optional(),
});

export const DistributionListQuerySchema = z.object({
  artistId: z.string().optional(),
  channelId: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

export type DistributionChannelCreateInput = z.output<typeof DistributionChannelCreateSchema>;
export type DistributionSubmissionCreateInput = z.output<typeof DistributionSubmissionCreateSchema>;
export type DistributionListQuery = z.output<typeof DistributionListQuerySchema>;
