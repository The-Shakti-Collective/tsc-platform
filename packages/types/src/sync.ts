export const SYNC_SOURCE_SYSTEMS = ['coreknot', 'tsc'] as const;
export type SyncSourceSystem = (typeof SYNC_SOURCE_SYSTEMS)[number];

export const SYNC_EVENT_TYPES = [
  'artist.created',
  'artist.updated',
  'opportunity.applied',
  'booking.inquiry',
  'community.member.added',
] as const;

export type SyncEventType = (typeof SYNC_EVENT_TYPES)[number];

export interface SyncMappingRecord {
  id: string;
  sourceSystem: SyncSourceSystem;
  externalId: string;
  tscEntityType: string;
  tscEntityId: string;
  eventType?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface SyncEventReceiptRecord {
  id: string;
  sourceSystem: SyncSourceSystem;
  externalId: string;
  eventType: SyncEventType;
  status: 'processed' | 'duplicate' | 'failed';
  result?: Record<string, unknown> | null;
  processedAt: string;
}

export interface SyncMappingRef {
  sourceSystem: SyncSourceSystem;
  externalId: string;
  tscEntityType: string;
  tscEntityId: string;
}

export interface SyncEventResult {
  externalId: string;
  eventType: SyncEventType;
  status: 'processed' | 'duplicate' | 'failed';
  message?: string;
  mappings?: SyncMappingRef[];
  tscEntityIds?: Record<string, string>;
  coreKnotPipelineUpdate?: CoreKnotPipelineUpdate;
  automationRunId?: string;
  error?: string;
}

export interface SyncEventsResponse {
  processed: number;
  duplicates: number;
  failed: number;
  results: SyncEventResult[];
}

export interface CoreKnotPipelineUpdate {
  pipelineStage: string;
  opportunityId?: string;
  automationRunId?: string;
  quotedValue?: number;
  assigneeExternalId?: string;
  summary?: string;
  metadata?: Record<string, unknown>;
}
