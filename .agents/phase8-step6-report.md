# Phase 8 Step 6 — Creator-Fan Economy (Module 7)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 6 ships **Module 7 — Creator-Fan Economy**: `SupportAction` track-only support ledger, REST APIs, fan-graph side effects (SUPPORTED / PURCHASED edges), activity + credit earn hooks, membership/event flow links, and CoreKnot support UI.

**Out of scope:** Razorpay/Stripe (Phase 10.3), Event Intelligence analytics (Step 7), Fan Commerce Ticket/Merch (Step 8), Audience OS (Step 9), Command Center V4 (Step 10), Phase 9, Phase 10.

---

## SupportAction entity

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `supporterPersonId` | String | FK → Person |
| `targetType` | enum | Artist \| Community \| Event |
| `targetId` | String | Polymorphic target |
| `actionType` | enum | buy_ticket, buy_membership, buy_workshop, buy_experience, general_support |
| `amount` | Float? | Optional stub amount |
| `currency` | String? | Default INR |
| `status` | enum | recorded (default), pending_payment (Phase 10 stub) |
| `metadata` | JSON | Linked flow refs, display names |
| `createdAt` | DateTime | |

---

## Schema

Fragment: `packages/database/prisma/phase8-step6.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `SupportTargetType` | Artist, Community, Event |
| `SupportActionType` | Commerce + general_support |
| `SupportActionStatus` | recorded, pending_payment |
| `SupportAction` | Persisted support ledger row |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/support-action.ts` — enums, PURCHASE vs SUPPORTED mapping, spendScore deltas |
| `@tsc/database` | `src/credits.ts` — `general_support: 5` earn reason |
| `@tsc/database` | `src/activity.ts` — +2 actions |
| `@tsc/types` | `src/support-action.ts` — record, history, supporters payloads |
| `@tsc/contracts` | `src/support-action/index.ts` — RecordSupportInput, query schemas |
| `@tsc/contracts` | `src/credits/index.ts` — `general_support` reason |
| `@tsc/contracts` | `src/activity/index.ts` — supported_community, supported_event |

---

## API (`apps/api/src/modules/support`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/support/artist/:artistId` | StubAuthGuard | Record artist support |
| POST | `/support/community/:communityId` | StubAuthGuard | Record community support |
| POST | `/support/event/:eventId` | StubAuthGuard | Record event support |
| GET | `/fans/me/support-history` | StubAuthGuard | Fan support history |
| GET | `/artists/:id/supporters` | Public | Top supporters by amount/count |
| GET | `/communities/:id/supporters` | Public | Top supporters |
| GET | `/events/:id/supporters` | Public | Top supporters |

`SupportModule` registered in `AppModule`. Imports `ActivityModule`, `CreditsModule`, `FanModule`.

### Record side effects

1. Create `SupportAction` row (status `recorded` unless `pending_payment` stub)
2. Upsert fan-graph edge:
   - `general_support` → **SUPPORTED**
   - `buy_*` → **PURCHASED**
3. Activity: `supported_artist`, `supported_community`, or `supported_event`
4. Credit earn: +5 via `general_support` (idempotent per SupportAction id)
5. `FanProfile.spendScore` increment (amount or action-type stub delta)

### Linked flows

| Flow | Emits |
|------|-------|
| `POST /memberships/:id/subscribe` (new) | `buy_membership` on Community target |
| `POST /events/:id/register` (new) | `buy_ticket` on Event target |

Linked records skip duplicate activity (membership/event activities already fire).

Legacy `POST /fans/support/:artistId` (Step 1 stub) unchanged — new canonical path is `/support/artist/:id`.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/supportApi.js` | Record support, history, supporters + mocks |
| `components/passport/SupportArtistButton.jsx` | General support CTA with credits toast |
| `pages/support/SupportHistoryPage.jsx` | Fan support history list |
| `pages/support/INTEGRATION.patch.md` | Route `/support/history` |
| `pages/passport/EcosystemPassportPage.jsx` | SupportArtistButton when passport has artist role |
| `pages/operating/artists/ArtistWorkspacePage.jsx` | SupportArtistButton in workspace header |
| `components/passport/FanProfileSection.jsx` | Link to support history |

---

## Merge steps

1. Merge `phase8-step6.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step6-support-action
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `POST /api/support/artist/:id` → SupportAction + SUPPORTED edge + +5 credits (general_support)
   - `POST /api/memberships/:id/subscribe` → linked `buy_membership` SupportAction
   - `POST /api/events/:id/register` → linked `buy_ticket` SupportAction
   - `GET /api/fans/me/support-history`
   - `GET /api/artists/:id/supporters?sortBy=amount`
5. Wire `/support/history` route per `INTEGRATION.patch.md`; test SupportArtistButton + history page (mock fallback OK offline).

---

## Deferred to Step 7 (Event Intelligence)

- Event-level revenue/conversion KPIs from support actions
- Ticket price catalog and real amounts on register
- Workshop/experience support action writers
- Supporter panels on event detail / artist public pages
- `pending_payment` → `recorded` transition on payment webhook (Phase 10.3)
- Support action rollups in Audience Health / Command Center
- Refund/cancel support reversal
- Gift support, recurring support subscriptions
- Fan Commerce Ticket entity (Step 8)
- Razorpay checkout and invoice records (Phase 10.3)
- ML-based supporter segmentation
- Bulk export of supporter lists for artists

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `SupportService` in `SupportModule`
- [ ] General support creates SUPPORTED edge + activity + +5 credits (idempotent)
- [ ] Membership subscribe emits buy_membership SupportAction
- [ ] Event register emits buy_ticket SupportAction
- [ ] Support history + supporters endpoints return data
- [ ] SupportArtistButton + SupportHistoryPage render (mock fallback OK offline)
