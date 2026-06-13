import { z } from 'zod';

export const DiscoveryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
  city: z.string().min(1).optional(),
});

export type DiscoveryQuery = z.infer<typeof DiscoveryQuerySchema>;
