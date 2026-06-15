import { z } from 'zod';

const orgId = z.string().min(1);

export const GigCreateSchema = z.object({
  organizationId: orgId,
  artistId: z.string().optional(),
  title: z.string().min(1),
  venue: z.string().optional(),
  city: z.string().optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  status: z.enum(['tentative', 'confirmed', 'completed', 'cancelled']).optional(),
  fee: z.number().optional(),
  currency: z.string().optional(),
  notes: z.string().optional(),
});

export const GigListQuerySchema = z.object({
  organizationId: orgId,
  artistId: z.string().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type GigCreateInput = z.infer<typeof GigCreateSchema>;
