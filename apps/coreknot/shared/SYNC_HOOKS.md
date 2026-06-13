# CoreKnot ↔ TSC Sync — Hook Points

Wire `apps/coreknot/shared/syncClient.js` **after** Mongo writes succeed. Failures should be logged/queued; do not roll back CoreKnot writes.

## Environment

| Variable | Purpose |
|----------|---------|
| `TSC_API_URL` | TSC API origin (e.g. `https://tsc-api.onrender.com`) |
| `TSC_SYNC_WEBHOOK_SECRET` | Optional shared secret header |
| `TSC_SYNC_PERSON_ID` / `STUB_PERSON_ID` | StubAuthGuard person header |
| `TSC_SYNC_ROLES` | Stub auth roles (default `admin`) |

## Express route hooks

### 1. Artist create — `artist.created`

**File:** `server/routes/artists.js` (or equivalent)  
**Hook:** After `Artist.create()` / `insertOne` succeeds

```javascript
import { emitArtistCreated } from '../../shared/syncClient.js';

// POST /api/artists
const doc = await Artist.create(req.body);
try {
  await emitArtistCreated(doc);
} catch (err) {
  req.log?.warn({ err, artistId: doc._id }, 'TSC sync failed (artist.created)');
}
res.status(201).json(doc);
```

### 2. Artist update — `artist.updated`

**Hook:** After `findByIdAndUpdate` succeeds

```javascript
import { emitArtistUpdated } from '../../shared/syncClient.js';

const doc = await Artist.findByIdAndUpdate(id, payload, { new: true });
await emitArtistUpdated(doc).catch(/* log */);
```

### 3. Opportunity apply — `opportunity.applied`

**File:** `server/routes/opportunities.js` or marketplace handler  
**Hook:** After application document saved

```javascript
import { emitOpportunityApplied } from '../../shared/syncClient.js';

const application = await OpportunityApplication.create({ ... });
await emitOpportunityApplied(application).catch(/* log */);
```

### 4. Booking inquiry — `booking.inquiry`

**File:** `server/routes/bookings.js` or `inquiries.js`  
**Hook:** After inquiry saved; apply pipeline update to CoreKnot artist record

```javascript
import { emitBookingInquiry } from '../../shared/syncClient.js';

const inquiry = await BookingInquiry.create(req.body);
const syncResult = await emitBookingInquiry(inquiry);
const pipeline = syncResult?.pipelineUpdate;
if (pipeline) {
  await Artist.findByIdAndUpdate(inquiry.artistId, {
    $set: {
      'pipeline.stage': pipeline.pipelineStage,
      'pipeline.tscOpportunityId': pipeline.opportunityId,
      'pipeline.quotedValue': pipeline.quotedValue,
      'pipeline.lastSyncAt': new Date(),
    },
  });
}
```

### 5. Community member — `community.member.added`

**Hook:** After member join/create

```javascript
import { emitCommunityMemberAdded } from '../../shared/syncClient.js';

const member = await CommunityMember.create({ ... });
await emitCommunityMemberAdded(member).catch(/* log */);
```

## TSC inbound endpoint

```
POST /api/sync/events
Authorization: StubAuthGuard headers (x-person-id, x-roles)
Body: { "events": [ SyncEventEnvelope, ... ] }
```

## Idempotency

Each event carries unique `externalId`. Replays return `status: "duplicate"` without side effects.

Entity cross-reference uses `SyncMapping` (`sourceSystem` + `externalId` + `tscEntityType`).

## Related TSC modules

- `@tsc/api/modules/sync` — inbound handlers
- `@tsc/api/modules/intelligence/automation` — `booking_inquiry` workflow
- `@tsc/contracts/sync` — shared Zod contract
