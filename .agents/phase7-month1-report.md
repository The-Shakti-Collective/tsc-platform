# Phase 7 Month 1 — Creator Economy Infrastructure

**Status:** Complete (Month 1 scope only)  
**Date:** 2026-06-12

## Mission

Foundational transaction-side entities for the creator economy: **Brand OS**, **Agency OS**, and **Label OS** — CRUD APIs, relationship graph hooks, opportunity linkage, activity/sync stubs, and CoreKnot Brand UI.

**Out of scope (Month 2+):** Marketplace listings upgrade, Deal pipeline, Payments, Revenue intelligence, Command Center V3, Recommendation V2.

---

## Entities

| Entity | Model | Key fields | Graph links |
|--------|-------|------------|-------------|
| **Brand** | `Brand` | name, industry, website, city, country, logo, description, budgetRange, categories[], verified, status, trustScore (placeholder), personId | `SPONSORED_BY` (future), opportunities via `brandId` |
| **Agency** | `Agency` | name, website, city, teamSize, personId | `MANAGES` Agency → Artist |
| **Label** | `Label` | name, genre, website, city | `SIGNED_TO` or `MANAGES` Label → Artist |

### Schema fragment

`packages/database/prisma/phase7-month1.prisma`

Also merged into partial `packages/database/prisma/schema.prisma` (Brand, Agency, Label models + enum extensions).

### Enum extensions

- `GraphEntityType`: +`Agency`, +`Label`
- `RelationshipType`: +`SIGNED_TO`
- `ActivityAction`: +`created_brand`, +`created_agency`, +`created_label`
- `Opportunity`: optional `brandId`, `agencyId` (documented in `phase6-marketplace.prisma` fragment)

---

## API routes

### Brand OS — `/brands`

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/brands` | List with industry/city/status/verified filters |
| POST | `/brands` | Create + `created_brand` activity + `brand.created` sync emit |
| GET | `/brands/:id` | Detail + `campaignCount: 0` |
| PATCH | `/brands/:id` | Owner/admin update |
| GET | `/brands/:id/campaigns` | **Stub** empty list |
| GET | `/brands/:id/opportunities` | Opportunities where `brandId` set |
| POST | `/brands/:id/opportunities` | Post marketplace opportunity (`source: brand`) |

### Agency OS — `/agencies`

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/agencies` | List (city filter) |
| POST | `/agencies` | Create + `created_agency` activity |
| GET | `/agencies/:id` | Detail + represented artist count |
| PATCH | `/agencies/:id` | Update |
| GET | `/agencies/:id/artists` | Roster via `MANAGES` relationships |

**Examples (seed/mock):** Only Much Louder, Big Bad Wolf, TM Talent, TSC

### Label OS — `/labels`

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/labels` | List (genre/city filters) |
| POST | `/labels` | Create + `created_label` activity |
| GET | `/labels/:id` | Detail + roster count |
| PATCH | `/labels/:id` | Update |
| GET | `/labels/:id/roster` | Artists via `SIGNED_TO` + `MANAGES` |
| POST | `/labels/:id/signings` | **Stub** creates `SIGNED_TO` relationship |

---

## Nest module

`IndustryModule` at `apps/api/src/modules/industry/` — already registered in `app.module.ts`.

Providers: `BrandService`, `AgencyService`, `LabelService` + repositories + `BrandSyncEmitter`.

---

## Packages

| Package | Additions |
|---------|-----------|
| `@tsc/database` | `src/industry.ts` — includes, list filters, roster queries |
| `@tsc/contracts` | `src/industry/schemas.ts` — Zod CRUD schemas |
| `@tsc/types` | `src/industry.ts` — response payloads |
| `@tsc/contracts/sync` | `brand.created` event + `Brand` entity type |

---

## Integration

| Integration | Status |
|-------------|--------|
| Brand → Opportunity create | ✅ `POST /brands/:id/opportunities` sets `brandId`, `launched_opportunity` activity |
| Brand trust score | ✅ `trustScore` field null placeholder |
| Activity feed | ✅ `created_brand`, `created_agency`, `created_label` |
| Sync inbound | ✅ `brand.created` handler stub in `SyncService` |
| Sync outbound | ✅ `BrandSyncEmitter` on brand create |
| Reputation | ⏳ trust score computation deferred Month 4 |
| Analytics | ❌ not rebuilt — basic counts only |

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/brandApi.js` | API client + mock (Red Bull India, Bacardi, boAt) |
| `hooks/queries/brand.js` | React Query hooks |
| `pages/brand/BrandListPage.jsx` | Brand directory |
| `pages/brand/BrandDetailPage.jsx` | Profile, trust placeholder, campaigns stub, opportunities |
| `pages/brand/INTEGRATION.patch.md` | Route + proxy merge steps |

Agency/Label UI pages deferred — API ready for Month 2 dashboards.

---

## Merge steps

1. Append `packages/database/prisma/phase7-month1.prisma` to canonical `schema.prisma`
2. Apply `phase6-marketplace.prisma` Opportunity extensions (`brandId`, `agencyId`)
3. Apply `phase6.5-activity.prisma` action extensions if not merged
4. Extend `Person` relations per fragment comments (`brandsOwned`, `agenciesLed`)
5. Run migration:
   ```bash
   pnpm --filter @tsc/database prisma migrate dev --name phase7_month1_creator_economy
   ```
6. Build packages:
   ```bash
   pnpm --filter @tsc/contracts build && pnpm --filter @tsc/database build && pnpm --filter @tsc/types build
   ```
7. `IndustryModule` already in `app.module.ts` — no change needed
8. Proxy `/api/brands`, `/api/agencies`, `/api/labels` in CoreKnot dev server
9. Merge `pages/brand/INTEGRATION.patch.md` into `App.jsx`

---

## Deferred to Month 2+

| Capability | Month |
|------------|-------|
| Campaign pipeline (non-stub) | 2 |
| Marketplace listings upgrade | 2 |
| Deal pipeline | 2 |
| Payments / revenue intelligence | 3+ |
| Brand trust score computation | 4 |
| Command Center V3 industry KPIs | 2+ |
| Recommendation V2 brand matching | 2+ |
| Agency OS / Label OS CoreKnot pages | 2 |
| Full signing contract workflow | 2+ |
| Credit spend / perks redemption | 2+ |

---

## File index

```
packages/database/prisma/phase7-month1.prisma
packages/database/src/industry.ts
packages/contracts/src/industry/schemas.ts
packages/types/src/industry.ts
apps/api/src/modules/industry/*
apps/coreknot/client/src/lib/brandApi.js
apps/coreknot/client/src/hooks/queries/brand.js
apps/coreknot/client/src/pages/brand/*
```
