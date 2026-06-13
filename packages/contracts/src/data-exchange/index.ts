import { z } from 'zod';

export const WebhookEventTypeSchema = z.enum([
  'artist.created',
  'opportunity.applied',
  'deal.completed',
  'booking.inquiry',
  'membership.subscribed',
  'fan.purchase',
  'identity.verified',
]);

export const WebhookSubscriptionCreateSchema = z.object({
  apiKeyId: z.string().min(1),
  url: z.string().url().max(2048),
  events: z.array(WebhookEventTypeSchema).min(1),
});

export const WebhookDeliveriesQuerySchema = z.object({
  subscriptionId: z.string().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
});

export const BulkArtistExportQuerySchema = z.object({
  format: z.enum(['json', 'csv']).optional().default('json'),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(500).optional().default(100),
  city: z.string().min(1).optional(),
  genre: z.string().min(1).optional(),
});

export const RelationshipExportQuerySchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});

export const AnalyticsExportQuerySchema = z.object({
  period: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
});

export const GraphExportQuerySchema = z.object({
  depth: z.coerce.number().int().min(1).max(3).optional().default(2),
});

export const DataExchangeSyncDirectionSchema = z.enum([
  'inbound',
  'outbound',
  'bidirectional',
]);

export const DataExchangePartnerCreateSchema = z.object({
  name: z.string().min(1).max(120),
  slug: z
    .string()
    .min(2)
    .max(64)
    .regex(/^[a-z0-9-]+$/),
  apiKeyId: z.string().min(1),
  allowedScopes: z.array(z.string().min(1)).optional().default([]),
  syncDirection: DataExchangeSyncDirectionSchema,
  config: z.record(z.unknown()).optional().default({}),
});

export const PartnerIngestBodySchema = z.object({
  eventType: z.string().min(1),
  externalId: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  data: z.record(z.unknown()).optional().default({}),
  occurredAt: z.string().datetime().optional(),
});

export const PartnerSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const GraphExportParamSchema = z.object({
  entityType: z.string().min(1),
  entityId: z.string().min(1),
});
