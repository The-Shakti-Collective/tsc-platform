# Phase 7 Month 2 — Marketplace + Applications + Search

**Status:** Complete (Month 2 scope only)  
**Date:** 2026-06-12  
**Note:** Completed as prerequisite for Month 3 deal pipeline.

## Mission

Upgrade marketplace listings, brand application review (shortlist/reject/hire), and unified search — building on Phase 7 Month 1 entities.

**Out of scope:** Deal pipeline, payments, Command Center V3, Recommendation V2.

---

## Marketplace listing upgrade

`MarketplaceListing` aliases `Opportunity` — no separate table.

| Field | Source |
|-------|--------|
| `listingType` | `MarketplaceListingType` enum |
| `ownerType` / `ownerId` | brand/agency/artist |
| `budget`, `requirements`, `genre` | Opportunity extensions |

Fragment: `packages/database/prisma/phase7-month2.prisma`

Helpers: `packages/database/src/marketplace-listing.ts`

Hire maps to application status `won` (no separate `hired` enum value).

---

## API routes

### Marketplace (SearchModule)

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/marketplace/listings` | Unified browse with type/city/genre/owner filters |
| GET | `/marketplace/search` | Text + filter search (`q`, `type`, `city`, `genre`) |
| POST | `/marketplace/listings/:id/track` | View tracking stub |

### Brand application review (BrandController)

| Method | Route | Notes |
|--------|-------|-------|
| GET | `/brands/:id/applications` | Review queue |
| PATCH | `/brands/:id/applications/:applicationId` | `shortlist` / `reject` / `hire` |

### Artist marketplace (unchanged + compatible)

| Method | Route |
|--------|-------|
| GET | `/opportunities/marketplace` | Legacy browse |
| POST | `/opportunities/:id/save` | Bookmark |
| POST | `/opportunities/:id/apply` | Apply |
| POST | `/opportunities/:id/share` | Share stub |

---

## Activity

- `reviewed_application`
- `hired_artist` (on hire → `won`)

---

## Merge steps

1. Append `phase7-month2.prisma` Opportunity extensions to `schema.prisma`
2. Migrate: `phase7_month2_marketplace_listings`
3. `SearchModule` registered in `app.module.ts`
4. Proxy `/api/marketplace/*` in CoreKnot dev server

---

## Deferred to Month 3+

| Capability | Month |
|------------|-------|
| Deal pipeline from hire | 3 |
| Campaign pipeline (non-stub) | 3+ |
| Listing analytics / tracked_listing activity | 4 |
| Recommendation V2 | 4 |
