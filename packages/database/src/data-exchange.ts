import type { Prisma } from '@prisma/client';

/** Partner webhook event catalog (Phase 10.5). */
export const WEBHOOK_EVENT_TYPES = [
  'artist.created',
  'opportunity.applied',
  'deal.completed',
  'booking.inquiry',
  'membership.subscribed',
  'fan.purchase',
  'identity.verified',
] as const;

export type WebhookEventTypeValue = (typeof WEBHOOK_EVENT_TYPES)[number];

export const DATA_EXCHANGE_SYNC_DIRECTIONS = [
  'inbound',
  'outbound',
  'bidirectional',
] as const;

export type DataExchangeSyncDirectionValue =
  (typeof DATA_EXCHANGE_SYNC_DIRECTIONS)[number];

export const EXPORT_API_SCOPES = ['read:export', 'read:graph'] as const;

export type ExportApiScopeValue = (typeof EXPORT_API_SCOPES)[number];

export const WEBHOOK_DELIVERY_TIMEOUT_MS = 5_000;

export const webhookSubscriptionPublicSelect = {
  id: true,
  apiKeyId: true,
  url: true,
  events: true,
  isActive: true,
  createdAt: true,
} satisfies Prisma.WebhookSubscriptionSelect;

export const webhookDeliveryPublicSelect = {
  id: true,
  subscriptionId: true,
  eventType: true,
  payload: true,
  status: true,
  attempts: true,
  deliveredAt: true,
  responseCode: true,
  createdAt: true,
} satisfies Prisma.WebhookDeliverySelect;

export const dataExchangePartnerPublicSelect = {
  id: true,
  name: true,
  slug: true,
  apiKeyId: true,
  allowedScopes: true,
  syncDirection: true,
  config: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DataExchangePartnerSelect;

export function webhookSubscriptionListWhere(input: {
  apiKeyId?: string;
  isActive?: boolean;
}): Prisma.WebhookSubscriptionWhereInput {
  const where: Prisma.WebhookSubscriptionWhereInput = {};
  if (input.apiKeyId) where.apiKeyId = input.apiKeyId;
  if (input.isActive != null) where.isActive = input.isActive;
  return where;
}

export function isWebhookEventType(value: string): value is WebhookEventTypeValue {
  return (WEBHOOK_EVENT_TYPES as readonly string[]).includes(value);
}

export interface DataExchangePartnerConfig {
  ingestEventTypes?: string[];
  normalizeToSync?: boolean;
  contactEmail?: string;
}

export function parseDataExchangePartnerConfig(value: unknown): DataExchangePartnerConfig {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const row = value as Record<string, unknown>;
  return {
    ingestEventTypes: Array.isArray(row.ingestEventTypes)
      ? row.ingestEventTypes.filter((item): item is string => typeof item === 'string')
      : undefined,
    normalizeToSync: typeof row.normalizeToSync === 'boolean' ? row.normalizeToSync : undefined,
    contactEmail: typeof row.contactEmail === 'string' ? row.contactEmail : undefined,
  };
}

/** JSON-LD @context stub for industry graph export. */
export const INDUSTRY_GRAPH_JSON_LD_CONTEXT = {
  '@vocab': 'https://tsc.in/vocab/',
  tsc: 'https://tsc.in/ns/',
  entityType: 'tsc:entityType',
  entityId: 'tsc:entityId',
  relationshipType: 'tsc:relationshipType',
} as const;

export function artistsToCsv(
  items: Array<{
    id: string;
    name: string;
    slug: string;
    displayName: string | null;
    city: string | null;
    genres: string[];
  }>,
): string {
  const header = 'id,name,slug,displayName,city,genres';
  const rows = items.map((item) => {
    const genres = item.genres.join('|');
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    return [
      escape(item.id),
      escape(item.name),
      escape(item.slug),
      escape(item.displayName ?? ''),
      escape(item.city ?? ''),
      escape(genres),
    ].join(',');
  });
  return [header, ...rows].join('\n');
}
