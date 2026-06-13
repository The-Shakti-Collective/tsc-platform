import { z } from 'zod';

export const ReputationEntityTypeSchema = z.enum(['Person', 'Artist', 'Community']);

export const ReputationRefreshParamsSchema = z.object({
  entityType: ReputationEntityTypeSchema,
  entityId: z.string().min(1),
});

export type ReputationRefreshParams = z.infer<typeof ReputationRefreshParamsSchema>;
