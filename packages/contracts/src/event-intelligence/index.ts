import { z } from 'zod';

export const EventIntelligenceInsightsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
});

export const EventIdParamSchema = z.object({
  id: z.string().min(1),
});
