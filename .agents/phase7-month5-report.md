# Phase 7 Month 5 (FINAL) — Executive Revenue Dashboard, Command Center V3

**Status:** Complete — Phase 7 fully delivered  
**Date:** 2026-06-12

## Mission

Upgrade `ExecutiveCommandCenterPage` to **Command Center V3** with creator-economy KPIs: revenue pipeline, opportunities, brands, artists, and deal funnel — aggregating Deal, RevenueTransaction, Opportunity, Brand, TrustSnapshot, and Phase 6.5 participation metrics.

**Out of scope:** Phase 8, 9, 10; payment gateways.

---

## Prerequisites verified

| Month | Status |
|-------|--------|
| Month 1 — Brand/Agency/Label OS | ✅ |
| Month 2 — Marketplace upgrade, applications, search | ✅ |
| Month 3 — Deal pipeline, RevenueTransaction | ✅ |
| Month 4 — Trust scores, Recommendations V2 | ✅ |
| Phase 6.5 — Participation dashboard, operational actions | ✅ |

---

## Backend

### API routes

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/intelligence/command-center/v3?period=weekly\|monthly` | Full Command Center payload with `v3` block |
| GET | `/intelligence/command-center?period=weekly\|monthly` | Same payload — `v3` included on existing endpoint |
| POST | `/intelligence/actions/review-pipeline-deals` | Stub — queue deal review workflow |
| POST | `/intelligence/actions/launch-brand-campaign` | Stub — brand campaign launch |
| POST | `/intelligence/actions/contact-at-risk-artists` | Stub — outreach to at-risk roster |

Existing Phase 6 actions unchanged: `create-campaign`, `invite-artists`, `launch-opportunity`, `contact-community`.

### V3 payload shape

```typescript
v3: {
  revenue: { openPipelineValue, closedThisPeriod, currency }
  opportunities: { activeCount, closingSoon }  // closingSoon = deadline within 7d
  brands: { activeCount, newThisWeek, topBrands[] }
  artists: { highGrowthCount, atRiskCount }
  deals: { byStage, pipelineFunnel[], totalOpen }
}
```

### Repository

`apps/api/src/modules/intelligence/command-center-v3.repository.ts`

Aggregates from:

| Source | Metrics |
|--------|---------|
| `Deal` | Open pipeline value (non-closed stages), stage counts, funnel values |
| `RevenueTransaction` | Closed revenue (`received` type in period); falls back to closed deal values |
| `Opportunity` | Active count, closing-soon (deadline ≤ 7d) |
| `Brand` | Active count, new this week, top partners by trust |
| `ArtistFollow` | High-growth count (>15% follower growth, 30d window) |
| Existing health logic | At-risk artist count passed from command center build |

Graceful degradation when Deal/RevenueTransaction models not yet migrated (returns zeros; mock UI fills gaps).

### Service

`IntelligenceService.buildCommandCenterV3()` called from `getCommandCenter()` — both endpoints return identical payload.

---

## CoreKnot UI

| File | Changes |
|------|---------|
| `ExecutiveCommandCenterPage.jsx` | V3 KPI strip, revenue/pipeline, deal funnel, brand partners, artist growth/risk sections; Phase 6.5 participation retained below |
| `lib/intelligenceApi.js` | `fetchCommandCenter` → `/command-center/v3`; mock with Red Bull, ₹48L pipeline |
| `hooks/queries/intelligence.js` | `useReviewPipelineDealsAction`, `useLaunchBrandCampaignAction`, `useContactAtRiskArtistsAction` |

### Mock sample data (INR)

- Open pipeline: **₹48L** (4,800,000)
- Closed weekly: ₹8.4L · monthly: ₹12.6L
- Top brand: **Red Bull India** (trust 82, verified)
- 14 active opportunities, 3 closing within 7 days

---

## Phase 7 — Complete 5-Month Summary

### Month 1 — Creator Economy Infrastructure

- **Entities:** Brand, Agency, Label
- **API:** `/brands`, `/agencies`, `/labels` CRUD + opportunity linkage
- **UI:** Brand OS pages, industry nav
- **Fragment:** `phase7-month1.prisma`

### Month 2 — Marketplace + Applications + Search

- **Upgrade:** MarketplaceListing fields on Opportunity (`listingType`, `ownerType`, budget, genre)
- **API:** `/marketplace/listings`, `/marketplace/search`, brand application review (shortlist/reject/hire)
- **Fragment:** `phase7-month2.prisma`

### Month 3 — Deal Pipeline + Revenue Tracking

- **Entities:** Deal (6-stage pipeline), RevenueTransaction (expected/received/pending)
- **API:** `/deals` CRUD, status advance, revenue timeline; hire → auto-create deal
- **UI:** Deal list/detail, revenue recording
- **Fragment:** `phase7-month3.prisma`

### Month 4 — Trust + Recommendations V2

- **Entity:** TrustSnapshot (Artist, Brand, Agency)
- **API:** `/trust/*`, `/intelligence/recommendations/v2/*`
- **Analytics:** Rule-based trust scoring, brand-match + artist-opportunity V2 engine
- **UI:** TrustBadge, BrandMatchResultsPanel, ArtistRecommendedOpportunitiesPanel
- **Fragment:** `phase7-month4.prisma`

### Month 5 — Command Center V3 (this sprint)

- **API:** V3 aggregations + 3 new operational action stubs
- **UI:** Executive revenue dashboard with creator-economy KPIs
- **Schema:** No new fragment — reads existing Month 1–4 models

---

## Prisma fragments — single migration

Merge all four fragments into canonical `packages/database/prisma/schema.prisma`, then run one migration:

```bash
pnpm --filter @tsc/database prisma migrate dev --name phase7_creator_economy
```

### Fragment inventory

| File | Contents |
|------|----------|
| `packages/database/prisma/phase7-month1.prisma` | Brand, Agency, Label models; GraphEntityType + RelationshipType + ActivityAction extensions; Opportunity `brandId`/`agencyId` |
| `packages/database/prisma/phase7-month2.prisma` | `MarketplaceListingType`, `MarketplaceOwnerType`; Opportunity listing fields + indexes; application review activity actions |
| `packages/database/prisma/phase7-month3.prisma` | `DealStatus`, `RevenueTransactionType`; Deal + RevenueTransaction models; relation extensions on Artist/Brand/Agency/Opportunity |
| `packages/database/prisma/phase7-month4.prisma` | `TrustEntityType`, TrustSnapshot model; Brand.trustScore denormalization |

**Also merge related non-month7 fragments if not yet applied:**

- `phase6-marketplace.prisma` — Opportunity marketplace base fields (`deadline`, etc.)
- Enum extensions documented inline in each fragment (ActivityAction, GraphEntityType)

### Post-migration build

```bash
pnpm --filter @tsc/database build
pnpm --filter @tsc/types build
pnpm --filter @tsc/contracts build
pnpm --filter @tsc/analytics build
pnpm --filter @tsc/api build
```

---

## Merge steps (production)

1. **Schema:** Append `phase7-month1` through `phase7-month4` (+ `phase6-marketplace` if needed) into `schema.prisma`.
2. **Migrate:** `prisma migrate dev --name phase7_creator_economy`
3. **Build packages:** database → types → contracts → analytics → api
4. **Register modules** (already wired): `IndustryModule`, `DealModule`, `TrustModule`, `IntelligenceModule`
5. **CoreKnot proxy:** Ensure dev proxy routes `/api/intelligence/*`, `/api/deals/*`, `/api/brands/*`, `/api/trust/*`
6. **Seed smoke test:** Create brand → post listing → hire artist → advance deal → record revenue → refresh trust → open Command Center V3
7. **Verify actions:** All 7 intelligence action stubs return `{ success, stubbed: true }`

---

## Phase 8 readiness

Phase 7 delivers the **transaction-side creator economy foundation**. Phase 8 can build on:

| Ready surface | Phase 8 use |
|---------------|-------------|
| Deal + RevenueTransaction | Payment gateway wiring (Razorpay/Stripe) against `received` transactions |
| Brand/Agency OS | Campaign management, contract templates |
| TrustSnapshot | Escrow/release triggers, dispute resolution weights |
| Command Center V3 | Real-time revenue dashboards, alerting |
| Recommendations V2 | ML upgrade path with labeled hire/conversion data |
| Marketplace hire flow | End-to-end booking confirmation |

### Gaps to address in Phase 8

- Payment gateway integration (explicitly deferred from Phase 7)
- Real artist review model (brand trust stub)
- Agency campaign success telemetry
- Trust score batch refresh cron
- Automation wiring for V3 action stubs (review pipeline, brand campaign, at-risk outreach)
- Agency/Label dedicated CoreKnot trust pages

### Coordinator note

Phase 10 split into **10.1–10.5** remains queued **after** Phase 8 and Phase 9.

---

## Files changed (Month 5)

| Path | Purpose |
|------|---------|
| `apps/api/src/modules/intelligence/command-center-v3.repository.ts` | V3 aggregations |
| `apps/api/src/modules/intelligence/intelligence.service.ts` | `buildCommandCenterV3`, extend `getCommandCenter` |
| `apps/api/src/modules/intelligence/intelligence.controller.ts` | `GET command-center/v3` |
| `apps/api/src/modules/intelligence/intelligence.module.ts` | Register repository |
| `apps/api/src/modules/intelligence/types/index.ts` | V3 types |
| `apps/api/src/modules/intelligence/actions.controller.ts` | 3 new action stubs |
| `apps/coreknot/client/src/pages/operating/ExecutiveCommandCenterPage.jsx` | V3 UI |
| `apps/coreknot/client/src/lib/intelligenceApi.js` | V3 fetch + mock |
| `apps/coreknot/client/src/hooks/queries/intelligence.js` | V3 action hooks |

---

**Phase 7 complete.** Proceed to Phase 8 (payments + campaign automation) when ready.
