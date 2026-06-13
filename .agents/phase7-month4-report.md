# Phase 7 Month 4 — Trust Scores, Reputation (Transaction-Side), Recommendations V2

**Status:** Complete (Month 4 scope only)  
**Date:** 2026-06-12

## Mission

Entity-level **trust scores** for transaction participants, **verification badge** integration with Phase 6.5, and **Recommendation Engine V2** wrapping Phase 5 intelligence calculators (read-only). CoreKnot UI surfaces trust on passport, brand pages, and marketplace intelligence panels.

**Out of scope:** Month 5 Command Center V3, Phase 8–10.

---

## Prerequisites verified

| Month | Status |
|-------|--------|
| Month 1 — Brand/Agency/Label | ✅ `IndustryModule`, `phase7-month1.prisma` |
| Month 2 — Marketplace upgrade, brand application review, search | ✅ `phase7-month2.prisma`, marketplace listing APIs |
| Month 3 — Deal pipeline, RevenueTransaction | ✅ `DealModule`, `phase7-month3.prisma`, hire → deal auto-create |

---

## Schema

**Fragment:** `packages/database/prisma/phase7-month4.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `TrustEntityType` | Artist, Brand, Agency |
| `TrustSnapshot` | Append-only trust score + factors JSON + badges + rank percentile |

Denormalized cache: `Brand.trustScore` updated on brand trust refresh.

**Merge into canonical `schema.prisma`** (partial snapshot already includes `TrustSnapshot`).

```bash
pnpm --filter @tsc/database prisma migrate dev --name phase7_month4_trust_recommendations_v2
```

Also merge Month 3 if not applied:

```bash
pnpm --filter @tsc/database prisma migrate dev --name phase7_month3_deal_pipeline
```

---

## Trust formulas (rule-based, no ML)

### Artist Trust Score

| Factor | Weight | Signal |
|--------|--------|--------|
| Attendance | 25% | Events with checked-in attendance vs total artist events |
| Response rate | 20% | Opportunity applications moved past submitted |
| Completed deals | 25% | Deals in `completed` / `paid` (cap-scored) |
| Community participation | 15% | Community posts + active memberships |
| Collaborations | 15% | `COLLABORATED_WITH` graph edges |

**Badges:** `verified_artist` when `verificationLevel >= 4`; `high_trust` ≥ 85; `trusted` ≥ 60.

### Brand Trust Score

| Factor | Weight | Signal |
|--------|--------|--------|
| Payments recorded | 40% | `RevenueTransaction.received` / `expected` |
| Deal completion | 35% | Completed+paid deals / total deals |
| Artist reviews | 25% | **Stub** — verified brands default 75, else 35 until review model |

**Badges:** `verified_brand_partner` when `brand.verified` OR trust ≥ 70.

### Agency Trust Score

| Factor | Weight | Signal |
|--------|--------|--------|
| Roster growth | 55% | `MANAGES` Artist count + adds last 90d |
| Campaign success | 45% | **Stub** — completed agency deals / total deals ratio |

Implementation: `packages/analytics/src/trust/trustScoring.ts`  
Helpers: `packages/database/src/trust.ts`

---

## API routes

### Trust — `/trust`

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/trust/artist/:id` | Latest snapshot or live compute |
| GET | `/trust/brand/:id` | Updates `Brand.trustScore` on refresh |
| GET | `/trust/agency/:id` | Agency roster + deal stub |
| POST | `/trust/refresh/:entityType/:entityId` | Admin only — persists snapshot |

### Recommendations V2 — `/intelligence/recommendations/v2`

| Method | Route | Body |
|--------|-------|------|
| POST | `/brand-match` | `{ brandId, genre?, city?, budget?, audienceAge? }` |
| POST | `/artist-opportunities` | `{ artistId, limit? }` |

**Engine:** `packages/analytics/src/intelligence/phase5/recommendationEngineV2.ts`  
Wraps `calculateOpportunityScore`, `calculateCityIntelligence`, trust weight (15%).

Nest module: `TrustModule` (`apps/api/src/modules/trust/`).

---

## Packages

| Package | Additions |
|---------|-----------|
| `@tsc/database` | `src/trust.ts` |
| `@tsc/types` | `src/trust.ts`, `src/recommendations-v2.ts` |
| `@tsc/contracts` | `src/trust/schemas.ts` |
| `@tsc/analytics` | `trustScoring`, `recommendationEngineV2`, minimal audience/city/graph stubs |

---

## CoreKnot UI

| Component | Purpose |
|-----------|---------|
| `components/trust/TrustBadge.jsx` | Score + verified/high-trust badges |
| `components/intelligence/BrandMatchResultsPanel.jsx` | Ranked artists for brand campaign |
| `components/intelligence/ArtistRecommendedOpportunitiesPanel.jsx` | V2 "Recommended For You" |
| `lib/trustApi.js` | Trust + V2 API client with mocks |
| `hooks/queries/trust.js` | React Query hooks |

**Integrated:** `PassportCard`, `BrandDetailPage`, `OpportunityIntelligencePanel` (optional `artistId` prop).

---

## Merge steps

1. Append `phase7-month1.prisma`, `phase7-month2.prisma`, `phase7-month3.prisma`, `phase7-month4.prisma` to canonical schema (if not merged).
2. Run migrations (commands above).
3. Build packages:
   ```bash
   pnpm --filter @tsc/database build
   pnpm --filter @tsc/types build
   pnpm --filter @tsc/contracts build
   ```
4. Register `TrustModule` in `app.module.ts` (done).
5. Proxy CoreKnot dev server:
   - `/api/trust/*`
   - `/api/intelligence/recommendations/v2/*`
6. Wire `OpportunityIntelligencePanel` with `artistId` where artist context exists.

---

## Deferred to Month 5 (Command Center V3)

| Capability | Notes |
|------------|-------|
| Command Center V3 industry KPIs | Trust/revenue rollups in exec dashboard |
| Real artist review model | Replace brand `artistReviews` stub |
| Agency campaign success telemetry | Replace roster-only stub |
| Trust score cron / batch refresh | Manual admin refresh only in Month 4 |
| ML-based recommendations | Rule-based V2 only |
| Agency/Label CoreKnot trust pages | API ready; UI deferred |
| Phase 10.1–10.5 | Queued after Month 5, Phase 8, Phase 9 |

---

## Coordinator note

Phase 10 split into **10.1–10.5** remains queued **after** Phase 7 Month 5, Phase 8, and Phase 9 complete.
