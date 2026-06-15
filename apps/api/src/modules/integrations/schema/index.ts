import { z } from 'zod';

export const IntegrationListQuerySchema = z.object({
  organizationId: z.string().optional(),
  provider: z
    .enum(['google', 'meta', 'spotify', 'youtube', 'distrokid', 'resend', 'other'])
    .optional(),
});

export const IntegrationConnectionCreateSchema = z.object({
  organizationId: z.string().optional(),
  provider: z.enum(['google', 'meta', 'spotify', 'youtube', 'distrokid', 'resend', 'other']),
  externalAccountId: z.string().optional(),
  scopes: z.array(z.string()).optional(),
});

export type IntegrationListQuery = z.output<typeof IntegrationListQuerySchema>;
export type IntegrationConnectionCreateInput = z.output<typeof IntegrationConnectionCreateSchema>;
