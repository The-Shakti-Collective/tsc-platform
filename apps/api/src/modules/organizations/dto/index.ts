import { z } from 'zod';

export const OrganizationCreateSchema = z.object({
  name: z.string().min(1),
  slug: z.string().min(1).optional(),
  type: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const OrganizationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export type OrganizationCreateInput = z.infer<typeof OrganizationCreateSchema>;
