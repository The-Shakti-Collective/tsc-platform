import { z } from 'zod';
import { SyncEventsRequestSchema } from '@tsc/contracts/sync';

export { SyncEventsRequestSchema };

export type SyncEventsRequestInput = z.infer<typeof SyncEventsRequestSchema>;

export const SyncMappingQuerySchema = z.object({
  sourceSystem: z.enum(['coreknot', 'tsc']),
  externalId: z.string().min(1),
  tscEntityType: z.string().min(1).optional(),
});

export type SyncMappingQuery = z.infer<typeof SyncMappingQuerySchema>;
