# Phase 6 Deliverable 6 — CoreKnot ↔ TSC Sync Layer

**Agent:** Implementer-Sync  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Entity synchronization layer between CoreKnot (Mongo ops CRM) and TSC (`@tsc/api` PostgreSQL). Event contract in `@tsc/contracts/sync`, inbound webhook module, CoreKnot outbound client, `SyncMapping` + idempotent `SyncEventReceipt` schema. No new analytics.

---

## 1. Sync event contract

**Package:** `packages/contracts/src/sync/`

| Event type | Direction | Purpose |
|------------|-----------|---------|
| `artist.created` | CoreKnot → TSC | Person + Artist + Passport stub + MANAGES relationship |
| `artist.updated` | CoreKnot → TSC | Update mapped entities |
| `opportunity.applied` | Bidirectional | Application record + CRM activity |
| `booking.inquiry` | CoreKnot → TSC | Trigger `booking_inquiry` automation; return pipeline payload |
| `community.member.added` | CoreKnot → TSC | CommunityMember + MEMBER_OF relationship |

**Envelope fields:** `eventType`, `sourceSystem` (`coreknot` \| `tsc`), `externalId`, `entityType`, `entityExternalId?`, `occurredAt?`, `data`

**Validation:** `SyncEventsRequestSchema` — batch of 1–50 events

---

## 2. TSC inbound sync (`@tsc/api/modules/sync`)

| Method | Route | Auth |
|--------|-------|------|
| POST | `/sync/events` | StubAuthGuard |
| GET | `/sync/mappings?sourceSystem=&externalId=&tscEntityType=` | StubAuthGuard |

**Handlers:**

- `artist.created` → `Person`, `Artist`, optional `ArtistPassport` stub, `SyncMapping`, optional `MANAGES`
- `artist.updated` → resolve mapping, patch Person/Artist/Passport
- `opportunity.applied` → resolve/create `Opportunity`, `OpportunityApplication`, `OpportunityActivity`
- `booking.inquiry` → `AutomationService.trigger({ workflowType: 'booking_inquiry' })` → `coreKnotPipelineUpdate`
- `community.member.added` → `CommunityMember` upsert + `MEMBER_OF` relationship

**Outbound:** `SyncEmitter` + `SyncOutboundDispatcher` for TSC → CoreKnot (env `COREKNOT_SYNC_URL`)

---

## 3. CoreKnot outbound

**File:** `apps/coreknot/shared/syncClient.js`

| Function | Emits |
|----------|-------|
| `emitArtistCreated(doc)` | `artist.created` |
| `emitArtistUpdated(doc)` | `artist.updated` |
| `emitOpportunityApplied(doc)` | `opportunity.applied` |
| `emitBookingInquiry(doc)` | `booking.inquiry` (+ returns `pipelineUpdate`) |
| `emitCommunityMemberAdded(doc)` | `community.member.added` |

**Hook documentation:** `apps/coreknot/shared/SYNC_HOOKS.md`

---

## 4. Idempotency

- **`SyncEventReceipt`:** unique `(sourceSystem, externalId)` — replays return `status: duplicate`
- **`SyncMapping`:** unique `(sourceSystem, externalId, tscEntityType)` — entity cross-reference

**Schema fragment:** `packages/database/prisma/phase6-sync.prisma`

---

## 5. Example flows

### Flow A — Artist created in CoreKnot

```text
CoreKnot POST /api/artists
  → Mongo Artist saved (_id: 664abc...)
  → syncClient.emitArtistCreated(doc)
  → TSC POST /sync/events

TSC handler:
  1. Check SyncEventReceipt (event id) — skip if duplicate
  2. Check SyncMapping for artist 664abc — skip if mapped
  3. Create Person (displayName, email, phone)
  4. Create Artist (slug, personId)
  5. Create ArtistPassport stub (if model merged)
  6. SyncMapping: 664abc → Artist.id, 664abc:person → Person.id
  7. Optional MANAGES if managerExternalId mapped

Response:
  { status: "processed", tscEntityIds: { personId, artistId, passportId } }
```

### Flow B — Opportunity applied in CoreKnot

```text
CoreKnot application saved (_id: app-991)
  → emitOpportunityApplied({ opportunityId, artistId, notes })

TSC handler:
  1. Resolve artistId via SyncMapping (CoreKnot artist → TSC Artist)
  2. Resolve/create Opportunity (by opportunityExternalId mapping or title)
  3. Upsert OpportunityApplication (status: applied)
  4. Create OpportunityActivity (type: application, summary: synced from CoreKnot)

Response:
  { tscEntityIds: { opportunityId, applicationId, personId, artistId } }
```

### Flow C — Booking inquiry

```text
CoreKnot inquiry saved (_id: inq-442, budget: 750000 INR)
  → emitBookingInquiry(doc)

TSC handler:
  1. Resolve artist via SyncMapping
  2. AutomationService.trigger({ workflowType: 'booking_inquiry', payload })
     → creates Opportunity, OpportunityActivity, automation run steps
  3. Return coreKnotPipelineUpdate:
     { pipelineStage: 'inquiry_automation_complete', opportunityId, quotedValue, automationRunId }

CoreKnot hook:
  → PATCH artist.pipeline with TSC opportunityId + stage
```

---

## Files created/changed

| Path | Purpose |
|------|---------|
| `packages/contracts/src/sync/*` | Zod event + response schemas |
| `packages/types/src/sync.ts` | TS types |
| `packages/database/prisma/phase6-sync.prisma` | SyncMapping, SyncEventReceipt |
| `packages/database/src/sync.ts` | Mapping helpers |
| `apps/api/src/modules/sync/*` | NestJS sync module |
| `apps/api/src/app.module.ts` | Register SyncModule |
| `apps/coreknot/shared/syncClient.js` | Outbound client |
| `apps/coreknot/shared/SYNC_HOOKS.md` | Route hook guide |
| `apps/api/src/modules/opportunity/opportunity-sync.emitter.ts` | Wired to SyncEmitter |

---

## Integration steps

1. Merge `phase6-sync.prisma` into main `schema.prisma`; run migration
2. Export `@tsc/contracts/sync` subpath in contracts `package.json`
3. Re-export `sync.ts` from `@tsc/database` index
4. Wire CoreKnot Express routes per `SYNC_HOOKS.md`
5. Set `TSC_API_URL` on CoreKnot server; `COREKNOT_SYNC_URL` on TSC for outbound
6. Merge `ArtistPassport` model from Deliverable 5 for full passport stub creation

---

## Blocked by partial workspace

- `apps/api/src/common/*` (StubAuthGuard, PrismaService) referenced but not on disk
- Full monorepo `package.json` / build not runnable in this snapshot
- CoreKnot Express `server/` routes not present — hooks documented only
