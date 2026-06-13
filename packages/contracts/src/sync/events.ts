import { z } from 'zod';

/** Systems that may originate or receive sync events. */
export const SYNC_SOURCE_SYSTEMS = ['coreknot', 'tsc'] as const;
export const SyncSourceSystemSchema = z.enum(SYNC_SOURCE_SYSTEMS);

/** Canonical entity sync event types (Phase 6 Deliverable 6). */
export const SYNC_EVENT_TYPES = [
  'artist.created',
  'artist.updated',
  'opportunity.applied',
  'booking.inquiry',
  'community.member.added',
  'brand.created',
  'deal.status_changed',
] as const;

export const SyncEventTypeSchema = z.enum(SYNC_EVENT_TYPES);

export const SyncEntityTypeSchema = z.enum([
  'Artist',
  'Person',
  'Opportunity',
  'OpportunityApplication',
  'BookingInquiry',
  'CommunityMember',
  'Community',
  'Brand',
  'Agency',
  'Label',
  'Deal',
]);

const SyncEventBaseSchema = z.object({
  /** Unique event id from source system — idempotency key with sourceSystem. */
  externalId: z.string().min(1),
  sourceSystem: SyncSourceSystemSchema,
  entityType: SyncEntityTypeSchema,
  /** Source-system entity id (e.g. CoreKnot Mongo _id) for SyncMapping lookups. */
  entityExternalId: z.string().min(1).optional(),
  occurredAt: z.string().datetime().optional(),
});

export const ArtistCreatedDataSchema = z.object({
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().min(3).optional(),
  slug: z.string().min(1).optional(),
  bio: z.string().optional(),
  genres: z.array(z.string()).optional(),
  city: z.string().optional(),
  managerExternalId: z.string().optional(),
  managerPersonId: z.string().optional(),
  links: z.record(z.string()).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const ArtistUpdatedDataSchema = ArtistCreatedDataSchema.partial();

export const OpportunityAppliedDataSchema = z.object({
  opportunityExternalId: z.string().min(1).optional(),
  opportunityId: z.string().min(1).optional(),
  opportunityTitle: z.string().min(1).optional(),
  artistExternalId: z.string().min(1).optional(),
  artistId: z.string().min(1).optional(),
  personExternalId: z.string().min(1).optional(),
  personId: z.string().min(1).optional(),
  notes: z.string().max(2000).optional(),
  appliedAt: z.string().datetime().optional(),
  category: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BookingInquiryDataSchema = z.object({
  title: z.string().min(1).optional(),
  artistExternalId: z.string().min(1).optional(),
  artistId: z.string().min(1).optional(),
  personExternalId: z.string().min(1).optional(),
  personId: z.string().min(1).optional(),
  venue: z.string().optional(),
  city: z.string().optional(),
  eventDate: z.string().datetime().optional(),
  budget: z.number().nonnegative().optional(),
  value: z.number().nonnegative().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  assigneeExternalId: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const DealStatusChangedDataSchema = z.object({
  dealId: z.string().min(1),
  opportunityId: z.string().min(1).optional(),
  applicationId: z.string().optional(),
  artistId: z.string().min(1).optional(),
  brandId: z.string().optional(),
  agencyId: z.string().optional(),
  previousStatus: z.string().optional(),
  status: z.string().min(1),
  value: z.number().nonnegative().optional(),
  currency: z.string().optional(),
  paidAt: z.string().datetime().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const BrandCreatedDataSchema = z.object({
  brandId: z.string().min(1).optional(),
  name: z.string().min(1),
  industry: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  personId: z.string().optional(),
  personExternalId: z.string().optional(),
  website: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const CommunityMemberAddedDataSchema = z.object({
  communityExternalId: z.string().min(1).optional(),
  communityId: z.string().min(1).optional(),
  personExternalId: z.string().min(1).optional(),
  personId: z.string().min(1).optional(),
  email: z.string().email().optional(),
  displayName: z.string().optional(),
  role: z.string().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export const SyncEventEnvelopeSchema = z.discriminatedUnion('eventType', [
  SyncEventBaseSchema.extend({
    eventType: z.literal('artist.created'),
    data: ArtistCreatedDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('artist.updated'),
    data: ArtistUpdatedDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('opportunity.applied'),
    data: OpportunityAppliedDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('booking.inquiry'),
    data: BookingInquiryDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('community.member.added'),
    data: CommunityMemberAddedDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('brand.created'),
    data: BrandCreatedDataSchema,
  }),
  SyncEventBaseSchema.extend({
    eventType: z.literal('deal.status_changed'),
    data: DealStatusChangedDataSchema,
  }),
]);

/** Batch ingest — CoreKnot webhook may send one or many events. */
export const SyncEventsRequestSchema = z.object({
  events: z.array(SyncEventEnvelopeSchema).min(1).max(50),
});

export type SyncSourceSystem = z.infer<typeof SyncSourceSystemSchema>;
export type SyncEventType = z.infer<typeof SyncEventTypeSchema>;
export type SyncEventEnvelope = z.infer<typeof SyncEventEnvelopeSchema>;
export type SyncEventsRequest = z.infer<typeof SyncEventsRequestSchema>;
