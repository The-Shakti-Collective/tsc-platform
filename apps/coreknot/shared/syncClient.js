/**
 * CoreKnot → TSC sync client (Phase 6 Deliverable 6).
 *
 * Emits entity sync events to @tsc/api POST /sync/events.
 * Use from Express route handlers after Mongo writes succeed.
 */

const DEFAULT_TSC_SYNC_PATH = '/api/sync/events';

function getTscApiBase() {
  return (
    process.env.TSC_API_URL ||
    process.env.TSC_SYNC_URL ||
    process.env.VITE_TSC_API_URL ||
    ''
  ).replace(/\/$/, '');
}

function getSyncHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const personId = process.env.TSC_SYNC_PERSON_ID || process.env.STUB_PERSON_ID;
  const roles = process.env.TSC_SYNC_ROLES || 'admin';
  if (personId) headers['x-person-id'] = personId;
  if (roles) headers['x-roles'] = roles;

  const secret = process.env.TSC_SYNC_WEBHOOK_SECRET;
  if (secret) headers['x-sync-secret'] = secret;

  return headers;
}

function newEventId(prefix = 'ck') {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * @typedef {'artist.created'|'artist.updated'|'opportunity.applied'|'booking.inquiry'|'community.member.added'} SyncEventType
 * @typedef {'coreknot'|'tsc'} SyncSourceSystem
 */

/**
 * @param {object} event
 * @param {SyncEventType} event.eventType
 * @param {string} event.externalId — unique event id (idempotency)
 * @param {SyncSourceSystem} [event.sourceSystem='coreknot']
 * @param {string} event.entityType
 * @param {string} [event.entityExternalId]
 * @param {string} [event.occurredAt]
 * @param {Record<string, unknown>} event.data
 * @param {{ baseUrl?: string, path?: string, signal?: AbortSignal }} [options]
 */
export async function emitSyncEvent(event, options = {}) {
  const baseUrl = (options.baseUrl ?? getTscApiBase()).replace(/\/$/, '');
  if (!baseUrl) {
    console.warn('[syncClient] TSC_API_URL unset — event logged only', event.eventType);
    return { stubbed: true, event };
  }

  const path = options.path ?? DEFAULT_TSC_SYNC_PATH;
  const url = `${baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

  const envelope = {
    sourceSystem: 'coreknot',
    occurredAt: new Date().toISOString(),
    ...event,
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: getSyncHeaders(),
    body: JSON.stringify({ events: [envelope] }),
    signal: options.signal,
  });

  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = body?.message || body?.error || response.statusText;
    throw new Error(`TSC sync failed (${response.status}): ${message}`);
  }

  return body;
}

/** Artist created in CoreKnot CRM → TSC Person + Artist + Passport. */
export async function emitArtistCreated(artistDoc, options = {}) {
  const externalId = options.eventId ?? newEventId('artist_created');
  const mongoId = String(artistDoc._id ?? artistDoc.id);

  return emitSyncEvent(
    {
      eventType: 'artist.created',
      externalId,
      entityType: 'Artist',
      entityExternalId: mongoId,
      data: {
        name: artistDoc.name || artistDoc.displayName,
        email: artistDoc.email,
        phone: artistDoc.phone,
        slug: artistDoc.slug,
        bio: artistDoc.bio,
        genres: artistDoc.genres,
        city: artistDoc.city,
        managerExternalId: artistDoc.managerId ? String(artistDoc.managerId) : undefined,
        links: artistDoc.links || artistDoc.social,
        metadata: {
          coreknotCollection: 'artists',
          coreknotId: mongoId,
          ...(artistDoc.metadata || {}),
        },
      },
    },
    options,
  );
}

/** Artist profile updated in CoreKnot. */
export async function emitArtistUpdated(artistDoc, options = {}) {
  const mongoId = String(artistDoc._id ?? artistDoc.id);
  return emitSyncEvent(
    {
      eventType: 'artist.updated',
      externalId: options.eventId ?? newEventId('artist_updated'),
      entityType: 'Artist',
      entityExternalId: mongoId,
      data: {
        name: artistDoc.name,
        email: artistDoc.email,
        phone: artistDoc.phone,
        slug: artistDoc.slug,
        bio: artistDoc.bio,
        genres: artistDoc.genres,
        city: artistDoc.city,
        links: artistDoc.links,
        metadata: artistDoc.metadata,
      },
    },
    options,
  );
}

/** Opportunity application in CoreKnot → TSC application + CRM activity. */
export async function emitOpportunityApplied(applicationDoc, options = {}) {
  const appId = String(applicationDoc._id ?? applicationDoc.id);
  return emitSyncEvent(
    {
      eventType: 'opportunity.applied',
      externalId: options.eventId ?? newEventId('opp_applied'),
      entityType: 'OpportunityApplication',
      entityExternalId: appId,
      data: {
        opportunityExternalId: applicationDoc.opportunityId
          ? String(applicationDoc.opportunityId)
          : undefined,
        opportunityTitle: applicationDoc.opportunityTitle || applicationDoc.title,
        artistExternalId: applicationDoc.artistId
          ? String(applicationDoc.artistId)
          : undefined,
        personExternalId: applicationDoc.personId
          ? String(applicationDoc.personId)
          : undefined,
        notes: applicationDoc.notes,
        appliedAt: applicationDoc.appliedAt || new Date().toISOString(),
        category: applicationDoc.category,
        metadata: applicationDoc.metadata,
      },
    },
    options,
  );
}

/** Booking inquiry → TSC booking_inquiry automation + pipeline payload for CoreKnot. */
export async function emitBookingInquiry(inquiryDoc, options = {}) {
  const inquiryId = String(inquiryDoc._id ?? inquiryDoc.id);
  const result = await emitSyncEvent(
    {
      eventType: 'booking.inquiry',
      externalId: options.eventId ?? newEventId('booking'),
      entityType: 'BookingInquiry',
      entityExternalId: inquiryId,
      data: {
        title: inquiryDoc.title,
        artistExternalId: inquiryDoc.artistId
          ? String(inquiryDoc.artistId)
          : undefined,
        personExternalId: inquiryDoc.contactId
          ? String(inquiryDoc.contactId)
          : undefined,
        venue: inquiryDoc.venue,
        city: inquiryDoc.city,
        eventDate: inquiryDoc.eventDate,
        budget: inquiryDoc.budget,
        value: inquiryDoc.value,
        contactEmail: inquiryDoc.contactEmail,
        contactPhone: inquiryDoc.contactPhone,
        notes: inquiryDoc.notes,
        assigneeExternalId: inquiryDoc.assigneeId
          ? String(inquiryDoc.assigneeId)
          : undefined,
        metadata: inquiryDoc.metadata,
      },
    },
    options,
  );

  const pipelineUpdate = result?.results?.[0]?.coreKnotPipelineUpdate;
  return { ...result, pipelineUpdate };
}

/** Community member added in CoreKnot → TSC MEMBER_OF relationship. */
export async function emitCommunityMemberAdded(memberDoc, options = {}) {
  const memberId = String(memberDoc._id ?? memberDoc.id);
  return emitSyncEvent(
    {
      eventType: 'community.member.added',
      externalId: options.eventId ?? newEventId('member'),
      entityType: 'CommunityMember',
      entityExternalId: memberId,
      data: {
        communityExternalId: memberDoc.communityId
          ? String(memberDoc.communityId)
          : undefined,
        personExternalId: memberDoc.personId
          ? String(memberDoc.personId)
          : undefined,
        email: memberDoc.email,
        displayName: memberDoc.displayName || memberDoc.name,
        role: memberDoc.role,
        metadata: memberDoc.metadata,
      },
    },
    options,
  );
}

export default {
  emitSyncEvent,
  emitArtistCreated,
  emitArtistUpdated,
  emitOpportunityApplied,
  emitBookingInquiry,
  emitCommunityMemberAdded,
};
