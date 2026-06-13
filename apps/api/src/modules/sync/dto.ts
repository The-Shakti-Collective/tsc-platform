import type { z } from 'zod';
import type { SyncEventsRequestSchema } from './schema';

export type SyncEventsRequestInput = z.infer<typeof SyncEventsRequestSchema>;
