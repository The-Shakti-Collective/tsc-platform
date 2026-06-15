import { z } from 'zod';

const orgId = z.string().min(1);

export const TeamCreateSchema = z.object({
  organizationId: orgId,
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  description: z.string().optional(),
  leadPersonId: z.string().optional(),
});

export const TeamListQuerySchema = z.object({
  organizationId: orgId,
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type TeamCreateInput = z.infer<typeof TeamCreateSchema>;
