import type { DataExchangeSyncDirectionValue, WebhookEventTypeValue } from '@tsc/database';

export const WEBHOOK_EVENT_TYPES = [
  'artist.created',
  'opportunity.applied',
  'deal.completed',
  'booking.inquiry',
  'membership.subscribed',
  'fan.purchase',
  'identity.verified',
] as const;

export type WebhookEventType = WebhookEventTypeValue;

export type WebhookDeliveryStatus = 'pending' | 'delivered' | 'failed';

export interface WebhookSubscriptionSummary {
  id: string;
  apiKeyId: string;
  url: string;
  events: WebhookEventType[];
  isActive: boolean;
  createdAt: string;
}

export interface WebhookSubscriptionCreatedPayload extends WebhookSubscriptionSummary {
  /** Returned once at creation — used to verify webhook signatures */
  secret: string;
}

export interface WebhookDeliveryRecord {
  id: string;
  subscriptionId: string;
  eventType: string;
  payload: Record<string, unknown>;
  status: WebhookDeliveryStatus;
  attempts: number;
  deliveredAt: string | null;
  responseCode: number | null;
  createdAt: string;
}

export interface WebhookDeliveriesListPayload {
  items: WebhookDeliveryRecord[];
  updatedAt: string;
}

export interface WebhookTestPayload {
  subscriptionId: string;
  deliveryId: string;
  eventType: string;
  status: WebhookDeliveryStatus;
  responseCode: number | null;
}

export interface BulkArtistExportPayload {
  format: 'json' | 'csv';
  items: Array<{
    id: string;
    name: string;
    slug: string;
    displayName: string | null;
    city: string | null;
    genres: string[];
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
  updatedAt: string;
}

export interface RelationshipExportPayload {
  entityType: string;
  entityId: string;
  relationships: Array<{
    id: string;
    relationshipType: string;
    direction: 'outbound' | 'inbound';
    peerEntityType: string;
    peerEntityId: string;
    strength: number | null;
  }>;
  updatedAt: string;
}

export interface AnonymizedAnalyticsExportPayload {
  period: string;
  rollup: {
    artistCount: number;
    communityCount: number;
    eventCount: number;
    opportunityCount: number;
    identityCount: number;
  };
  /** No entity IDs — anonymized aggregate only */
  anonymized: true;
  updatedAt: string;
}

export interface IndustryGraphJsonLdPayload {
  '@context': Record<string, string>;
  '@type': 'IndustrySubgraph';
  entityType: string;
  entityId: string;
  depth: number;
  nodes: Array<{ entityType: string; entityId: string }>;
  edges: Array<{
    id: string;
    relationshipType: string;
    sourceEntityType: string;
    sourceEntityId: string;
    targetEntityType: string;
    targetEntityId: string;
  }>;
  stats: {
    edgeCount: number;
    nodeCount: number;
    neighborCount: number;
  };
  updatedAt: string;
}

export interface DataExchangePartnerSummary {
  id: string;
  name: string;
  slug: string;
  apiKeyId: string;
  allowedScopes: string[];
  syncDirection: DataExchangeSyncDirectionValue;
  config: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataExchangePartnerStatusPayload {
  slug: string;
  name: string;
  syncDirection: DataExchangeSyncDirectionValue;
  isActive: boolean;
  allowedScopes: string[];
  lastIngestAt: string | null;
  updatedAt: string;
}

export interface PartnerIngestPayload {
  partnerSlug: string;
  accepted: boolean;
  syncEventType: string | null;
  externalId: string | null;
  message: string;
}
