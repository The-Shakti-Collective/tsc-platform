import { z } from 'zod';
import { SyncEventTypeSchema, SyncSourceSystemSchema } from './events.js';

export const SyncMappingRefSchema = z.object({
  sourceSystem: SyncSourceSystemSchema,
  externalId: z.string(),
  tscEntityType: z.string(),
  tscEntityId: z.string(),
});

export const SyncEventResultSchema = z.object({
  externalId: z.string(),
  eventType: SyncEventTypeSchema,
  status: z.enum(['processed', 'duplicate', 'failed']),
  message: z.string().optional(),
  mappings: z.array(SyncMappingRefSchema).optional(),
  tscEntityIds: z.record(z.string()).optional(),
  coreKnotPipelineUpdate: z.record(z.unknown()).optional(),
  automationRunId: z.string().optional(),
  error: z.string().optional(),
});

export const SyncEventsResponseSchema = z.object({
  processed: z.number().int().nonnegative(),
  duplicates: z.number().int().nonnegative(),
  failed: z.number().int().nonnegative(),
  results: z.array(SyncEventResultSchema),
});

/** Payload TSC returns so CoreKnot can update artist booking pipeline. */
export const CoreKnotPipelineUpdateSchema = z.object({
  pipelineStage: z.string(),
  opportunityId: z.string().optional(),
  automationRunId: z.string().optional(),
  quotedValue: z.number().optional(),
  assigneeExternalId: z.string().optional(),
  summary: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type SyncEventResult = z.infer<typeof SyncEventResultSchema>;
export type SyncEventsResponse = z.infer<typeof SyncEventsResponseSchema>;
export type CoreKnotPipelineUpdate = z.infer<typeof CoreKnotPipelineUpdateSchema>;
