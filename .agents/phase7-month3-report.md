# Phase 7 Month 3 — Deal Pipeline + Revenue Tracking

**Status:** Complete (Month 3 scope only)  
**Date:** 2026-06-12

## Mission

Deal pipeline from hired applications through paid status, revenue tracking (no payment gateway), activity + CoreKnot CRM sync stub, and CoreKnot deal UI.

**Prerequisite:** Month 1 (Brand/Agency/Label) + Month 2 (marketplace, brand hire) — completed/wired.

**Out of scope:** Razorpay/payments, trust score computation, Recommendation V2, Command Center V3.

---

## Entities

### Deal

| Field | Type |
|-------|------|
| id | cuid |
| opportunityId, applicationId?, artistId | required links |
| brandId?, agencyId? | optional |
| status | `application` → `discussion` → `negotiation` → `agreement` → `completed` → `paid` |
| value, currency | Decimal / string |
| startDate, endDate | DateTime? |
| negotiationNotes?, agreementUrl? | optional |
| paidAt? | set when status → `paid` |

Fragment: `packages/database/prisma/phase7-month3.prisma`

### RevenueTransaction

| Field | Type |
|-------|------|
| dealId | FK |
| amount | Decimal |
| type | `expected` \| `received` \| `pending` |
| recordedAt | DateTime |
| notes? | string |

---

## API — `DealModule` (`/deals`)

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/deals` | Filter `artistId`, `brandId`, `status` |
| GET | `/deals/:id` | Detail |
| POST | `/deals` | Create from hired (`won`) application |
| PATCH | `/deals/:id/status` | Advance or step status |
| PATCH | `/deals/:id` | Update value, dates, notes, agreementUrl |
| POST | `/deals/:id/revenue` | Record expected/received/pending |
| GET | `/deals/:id/revenue` | Timeline + totals |
| GET | `/artists/:id/deals` | Artist deals |
| GET | `/brands/:id/deals` | Brand deals |

### Hire → Deal wiring

`PATCH /brands/:id/applications/:id` with `action: hire` → application `won` → auto-creates `Deal` at **`discussion`** (idempotent per application).

---

## Activity + Sync

| Action | When |
|--------|------|
| `deal_created` | Deal created (hire or POST /deals) |
| `deal_completed` | Status → `completed` |
| `deal_paid` | Status → `paid` |

**Sync outbound:** `deal.status_changed` → CoreKnot CRM update payload (stub via `DealSyncEmitter` + inbound ack in `SyncService`).

---

## Packages

| Package | Additions |
|---------|-----------|
| `@tsc/database` | `src/deal.ts` — pipeline, includes, filters |
| `@tsc/types` | `src/deal.ts` — payloads |
| `@tsc/contracts` | `src/deal/schemas.ts` — Zod |
| `@tsc/contracts/sync` | `deal.status_changed` event |

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/dealApi.js` | API client + mock fallback |
| `hooks/queries/deal.js` | React Query hooks |
| `pages/deal/DealPipelinePage.jsx` | Kanban by status |
| `pages/deal/DealDetailPage.jsx` | Advance stages, record revenue |
| `pages/deal/INTEGRATION.patch.md` | Route + proxy merge |

---

## Merge steps

1. Append `phase7-month2.prisma` + `phase7-month3.prisma` to canonical `schema.prisma`
2. Extend `ActivityAction` per `phase6.5-activity.prisma` + Month 3 actions
3. Run migration:
   ```bash
   pnpm --filter @tsc/database prisma migrate dev --name phase7_month3_deal_pipeline
   ```
4. Build packages:
   ```bash
   pnpm --filter @tsc/contracts build && pnpm --filter @tsc/database build && pnpm --filter @tsc/types build
   ```
5. `DealModule` registered in `apps/api/src/app.module.ts`
6. `IndustryModule` imports `DealModule` for hire wiring
7. Proxy in CoreKnot:
   - `/api/deals`, `/api/deals/*`
   - `/api/artists/:id/deals`, `/api/brands/:id/deals`
8. Merge `pages/deal/INTEGRATION.patch.md` into `App.jsx`

---

## Files changed (summary)

**Prisma:** `phase7-month3.prisma`, `phase6.5-activity.prisma` (actions)

**API:** `apps/api/src/modules/deal/*`, `search/marketplace.controller.ts`, `industry/brand.service.ts` (hire→deal), `sync/sync.service.ts`, `app.module.ts`

**Packages:** `database/src/deal.ts`, `types/src/deal.ts`, `contracts/src/deal/*`, `contracts/src/sync/events.ts`

**CoreKnot:** `dealApi.js`, `hooks/queries/deal.js`, `DealPipelinePage.jsx`, `DealDetailPage.jsx`

---

## Deferred to Month 4+

| Capability | Month |
|------------|-------|
| Brand trust score computation | 4 |
| Recommendation V2 brand matching | 4 |
| Command Center V3 industry KPIs | 5 |
| Razorpay / payment gateway | 5+ |
| Revenue intelligence dashboards | 4+ |
| Listing view analytics (`tracked_listing`) | 4 |
