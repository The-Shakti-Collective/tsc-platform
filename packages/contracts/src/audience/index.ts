import { z } from 'zod';

export const AudienceInsightsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const AudienceArtistIdParamSchema = z.object({
  id: z.string().min(1),
});

export const AudienceCommunityIdParamSchema = z.object({
  id: z.string().min(1),
});
