# Phase 10.1 — TSC Identity Network + Industry Verification (Pillar 1 + 3)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 10.1 ships the **TSC Identity Network** (permanent namespace IDs) and **Industry Verification Network** (trust badges). Ecosystem entities auto-provision `TscIdentity` rows on profile/passport/brand/community/fan create. Public resolve API + admin badge grant extend Phase 6.5 verification. CoreKnot shows `IdentityBadgeBar` on Ecosystem Passport with copyable `artist.tsc/slug` URLs.

**Out of scope:** Phase 10.2 Booking+Contracts, 10.3 Payments, 10.4 APIs+WhiteLabel, 10.5 Data Exchange, Phase 11.

---

## URL scheme

| Namespace handle | Example | UI route alias | API resolve |
|------------------|---------|----------------|-------------|
| `artist.tsc/:slug` | `artist.tsc/ritviz` | `/a/ritviz` | `GET /identity/artist/ritviz/public` |
| `community.tsc/:slug` | `community.tsc/underground` | `/c/underground` | `GET /identity/community/underground/public` |
| `brand.tsc/:slug` | `brand.tsc/redbull` | `/b/redbull` | `GET /identity/brand/redbull/public` |
| `fan.tsc/:slug` | `fan.tsc/rahul` | `/f/rahul` or `/profile/rahul` | `GET /identity/fan/rahul/public` |

**Canonical URL** (stored on `TscIdentity.canonicalUrl`):

```
https://tsc.in/{namespace}.tsc/{slug}
```

Legacy `/profile/:slug`, `/passport/:slug`, `/a/:slug` remain; public API backfills `TscIdentity` from existing Artist/PersonProfile/Community slugs on first resolve.

---

## Schema

Fragment: `packages/database/prisma/phase10-step1.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `TscIdentity` | Permanent ID: entity link, namespace, slug, canonicalUrl, verifiedBadge |
| `TscIdentityNamespace` | artist, community, brand, fan |
| `TscIdentityEntityType` | Artist, Community, Brand, Person, Venue |
| `TscVerificationBadge` | verified_artist, verified_community, verified_venue, verified_brand_partner |

Unique constraints: `(namespace, slug)`, `(entityType, entityId, namespace)`.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/tsc-identity.ts` — namespaces, URL builders, badge labels |
| `@tsc/types` | `src/tsc-identity.ts` — public/network/badge payloads |
| `@tsc/contracts` | `src/tsc-identity/index.ts` — Zod param + admin verify schemas |

---

## API (`apps/api/src/modules/tsc-identity`)

`TscIdentityModule` registered in `app.module.ts`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/identity/:namespace/:slug/public` | Public | Resolve any TSC identity + badges |
| GET | `/identity/verify/badges/:entityType/:entityId` | Public | Trust badges for entity |
| GET | `/identity/network/:personId` | Public | All identities for person (artist + fan + roles) |
| POST | `/admin/identity/verify/:entityType/:entityId` | Admin | Set industry verification badge |

### Admin verify body

```json
{ "badge": "verified_artist", "isPublic": true }
```

### Auto-provision hooks

| Trigger | Namespace |
|---------|-----------|
| `ProfileService.ensureProfileStub` | fan |
| `PassportService.ensurePassportStub` | artist |
| `SyncService` artist sync | artist |
| `BrandService.create` | brand |
| `FanService.ensureFanProfileStub` | fan |
| `CommunityService.requireCommunity` | community |

Idempotent upsert via `TscIdentityProvisionService`.

### Badge sources

| Badge | Admin POST | Computed |
|-------|------------|----------|
| Verified Artist | ✅ | PersonProfile level ≥ 4 / adminVerified |
| Verified Community | ✅ | — |
| Verified Venue | ✅ | — |
| Verified Brand Partner | ✅ | Brand.verified flag |

Extends Phase 6.5 `VerificationService` level 4 + Phase 8 trust thresholds.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `lib/identityNetworkApi.js` | Public resolve, badges, network, admin verify + mocks |
| `components/identity/IdentityBadgeBar.jsx` | Verified badges + tsc.in URL copy |
| `pages/passport/EcosystemPassportPage.jsx` | Wired `IdentityBadgeBar` + namespace from route |
| `pages/passport/INTEGRATION.patch.md` | Public routes `/c`, `/b`, `/f` + proxy list |

---

## Merge steps

1. Prisma migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase10-step1-tsc-identity-network
   ```
2. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
3. Proxy routes in CoreKnot dev server:
   - `/api/identity/*`
   - `/api/admin/identity/*`
4. Merge `INTEGRATION.patch.md` routes into `App.jsx` (`/c/:slug`, `/b/:slug`, `/f/:slug`)
5. Restart API; open `/a/ritviz` or `/profile/:slug` → verify badge bar + copy URL
6. Admin test:
   ```bash
   POST /api/admin/identity/verify/Artist/{artistId}
   Body: { "badge": "verified_artist" }
   GET  /api/identity/verify/badges/Artist/{artistId}
   ```

---

## Verification checklist

- [ ] `prisma validate` passes
- [ ] Artist sync creates `TscIdentity` row (`artist.tsc/{slug}`)
- [ ] `GET /identity/artist/:slug/public` returns identity + badges
- [ ] `GET /identity/network/:personId` lists fan + artist + brand identities
- [ ] Admin POST sets `verifiedBadge` on TscIdentity
- [ ] Ecosystem Passport shows `IdentityBadgeBar` with copyable URL
- [ ] Mocks render when API unreachable

---

## Deferred to Phase 10.2+

| Item | Target |
|------|--------|
| Booking + contract identity attestations | 10.2 |
| Payment rail KYC / payout verification | 10.3 |
| White-label identity domains (`*.tsc`) | 10.4 |
| Cross-platform data exchange + federation | 10.5 |
| Marketplace listing badge UI merge | 10.2 (API ready via `fetchVerificationBadges`) |
| Graph node badge enrichment | 10.2 (stub graph; attach `tscIdentity.handle`) |
| Brand slug column on `Brand` model | Optional — slug derived from name today |
| Venue auto-provision on Event create | 10.2 |
| DNS / custom domain for canonical URLs | 10.4 |

**Phase 10.1 complete. Ready for Phase 10.2 Booking + Contracts.**
