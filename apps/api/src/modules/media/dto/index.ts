import { z } from 'zod';

export const PresignUploadBodySchema = z.object({
  filename: z.string().min(1).max(255),
  contentType: z.string().min(1).max(127),
  prefix: z
    .enum(['finance', 'mail', 'campaigns', 'imports', 'content'])
    .default('content'),
  tenantId: z.string().min(1).max(64).optional(),
});

export type PresignUploadBody = z.infer<typeof PresignUploadBodySchema>;
