# Phase 8 Step 8 — Fan Commerce (Module 9)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 8 ships **Module 9 — Fan Commerce**: catalog entities (`Ticket`, `CommerceProduct`, `CommerceExperience`), unified `FanPurchase` orders, track-only purchase APIs, SupportAction + PURCHASED edge side effects, activity + credit earn stubs, inventory counters, Event Intelligence revenue input linkage via `buy_ticket` SupportAction rows, and CoreKnot browse UI.

**Out of scope:** Razorpay/Stripe checkout (Phase 10.3), Audience OS dashboard (Step 9), Command Center V4 (Step 10), Phase 9, Phase 10.

---

## Entities

### Ticket

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `eventId` | String | FK → Event |
| `name` | String | Tier label |
| `price` | Float | INR stub |
| `currency` | String | Default INR |
| `quantity` | Int | Capacity |
| `soldCount` | Int | Incremented on purchase |
| `status` | enum | active, inactive, sold_out |

### CommerceProduct (merch + digital)

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `artistId` | String? | FK → Artist |
| `communityId` | String? | FK → Community |
| `name` | String | |
| `type` | enum | physical_merch, sample_pack, digital_download |
| `price` | Float | |
| `currency` | String | Default INR |
| `inventory` | Int? | Null = unlimited digital |
| `soldCount` | Int | |
| `status` | enum | CommerceCatalogStatus |

### CommerceExperience

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `artistId` | String | FK → Artist |
| `name` | String | |
| `type` | enum | vip_meet_greet, workshop, backstage, community_pass |
| `price` | Float | |
| `currency` | String | |
| `slots` | Int | Capacity |
| `bookedCount` | Int | |
| `status` | enum | CommerceCatalogStatus |

### FanPurchase

| Field | Type | Notes |
|-------|------|-------|
| `id` | String | cuid |
| `personId` | String | FK → Person |
| `productType` | enum | ticket, merch, experience |
| `productId` | String | Polymorphic catalog id |
| `amount` | Float | |
| `currency` | String | |
| `status` | enum | recorded (default), pending_payment (Phase 10 stub) |
| `supportActionId` | String? | FK → SupportAction |
| `purchasedAt` | DateTime | |

---

## Schema

Fragment: `packages/database/prisma/phase8-step8.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `CommerceCatalogStatus` | active, inactive, sold_out |
| `CommerceProductType` | physical_merch, sample_pack, digital_download |
| `CommerceExperienceType` | vip_meet_greet, workshop, backstage, community_pass |
| `FanPurchaseProductType` | ticket, merch, experience |
| `FanPurchaseStatus` | recorded, pending_payment |
| `Ticket`, `CommerceProduct`, `CommerceExperience`, `FanPurchase` | Catalog + orders |
| `ActivityAction.purchased_product` | Purchase activity stub |

---

## Purchase flow (track-only)

1. Authenticated fan calls `POST /commerce/{type}/:id/purchase`
2. Validate catalog item active + inventory/slots available
3. Create `FanPurchase` (`status: recorded`)
4. `SupportService.recordFromCommerce` → `SupportAction` with mapped `buy_*` type:
   - Ticket → `buy_ticket` / Event
   - Merch (community) → `buy_membership` / Community
   - Merch (artist) → `buy_experience` or `buy_membership` (sample_pack)
   - Experience workshop → `buy_workshop` / Artist
   - Experience VIP/backstage/pass → `buy_experience` / Artist
5. PURCHASED relationship edge + spendScore bump
6. Link `supportActionId` on FanPurchase
7. Increment `soldCount` / `bookedCount`; mark `sold_out` when depleted
8. Activity `purchased_product` with product metadata
9. Credit earn stub `fan_purchase` (+3, idempotent per FanPurchase id)
10. Ticket purchases flag `eventIntelligenceLinked` — `actualRevenueStub` picks up `buy_ticket` amounts on intelligence refresh

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/commerce.ts` — enums, support mapping, availability helper |
| `@tsc/database` | `src/credits.ts` — `fan_purchase: 3` |
| `@tsc/database` | `src/activity.ts` — `purchased_product` |
| `@tsc/types` | `src/commerce.ts` — catalog + purchase payloads |
| `@tsc/contracts` | `src/commerce/index.ts` — query schemas |
| `@tsc/contracts` | `src/credits/index.ts` — `fan_purchase` reason |

---

## API (`apps/api/src/modules/commerce`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/commerce/tickets?eventId=` | Public | List event tickets |
| GET | `/commerce/merch?artistId=&communityId=` | Public | List merch / digital products |
| GET | `/commerce/experiences?artistId=` | Public | List VIP / workshop experiences |
| POST | `/commerce/tickets/:id/purchase` | StubAuthGuard | Record ticket purchase |
| POST | `/commerce/merch/:id/purchase` | StubAuthGuard | Record merch purchase |
| POST | `/commerce/experiences/:id/purchase` | StubAuthGuard | Record experience booking |
| GET | `/fans/me/purchases` | StubAuthGuard | Fan purchase history |

`CommerceModule` registered in `AppModule`. Uses `SupportModule`, `ActivityModule`, `CreditsModule`, `FanModule`.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/commerceApi.js` | Catalog fetch, purchase, history + mocks |
| `components/commerce/ProductPurchaseCard.jsx` | Single product card with track-only CTA |
| `pages/commerce/FanCommerceBrowsePage.jsx` | Tickets / merch / experiences tabs |
| `pages/commerce/INTEGRATION.patch.md` | Router wiring |

---

## Merge steps

1. Merge `phase8-step8.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step8-fan-commerce
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify:
   - `GET /api/commerce/tickets?eventId=`
   - `GET /api/commerce/merch?artistId=`
   - `GET /api/commerce/experiences?artistId=`
   - `POST /api/commerce/tickets/:id/purchase` → FanPurchase + SupportAction
   - `POST /api/commerce/merch/:id/purchase`
   - `POST /api/commerce/experiences/:id/purchase`
   - `GET /api/fans/me/purchases`
5. Wire `FanCommerceBrowsePage` per `INTEGRATION.patch.md`.

---

## Deferred to Step 9 (Audience OS)

- Commerce revenue rollups on artist/community audience dashboards
- Merch attach rate and SKU breakdown panels
- Purchase cohort segmentation (first-time vs repeat buyers)
- Cross-catalog fan LTV from FanPurchase history
- Supporter panels enriched with purchase types on public pages
- Inventory alerts and low-stock ops notifications
- Creator catalog management UI (CRUD for tickets/merch/experiences)
- Refund-adjusted revenue and conversion metrics
- Payment webhook → `pending_payment` → `recorded` sync (Phase 10.3)
- Automated catalog seeding from event lineup data
- Export purchase reports (CSV/PDF) in Command Center

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `CommerceModule`
- [ ] Purchase endpoints create FanPurchase + SupportAction + PURCHASED edge
- [ ] soldCount/bookedCount increment; sold_out when depleted
- [ ] `GET /fans/me/purchases` returns history
- [ ] FanCommerceBrowsePage renders (mock fallback OK offline)
