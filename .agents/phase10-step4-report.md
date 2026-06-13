# Phase 10.4 — Public API Platform + White Label Ecosystem (Pillars 9 + 10)

**Status:** Complete (implementation)  
**Date:** 2026-06-12  
**Depends on:** Phase 10.1 (TSC Identity), Phase 10.2 (Booking/Contracts), Phase 10.3 (Payments)

## Summary

Phase 10.4 ships **read-only Public API v1** (API key auth + rate limit stub) and **White Label tenant branding** for agency/community/festival OS shells. Admin routes create/revoke API keys and provision tenants. CoreKnot `WhiteLabelShell` applies tenant CSS vars + logo.

**Out of scope:** Industry Data Exchange (10.5), webhooks/sync bulk, distribution, Phase 11, live payment webhooks.

---

## Public API catalog

**Auth:** Header `X-TSC-Api-Key` (SHA-256 hashed at rest; plaintext returned once on create)

**Rate limit stub:** 100 req/min per key (in-memory window; logs on exceed → HTTP 429)

| Method | Route | Scope | Purpose |
|--------|-------|-------|---------|
| GET | `/public/v1/artists` | `read:artists` | Paginated list; filter `city`, `genre` |
| GET | `/public/v1/artists/:id` | `read:artists` | Artist detail |
| GET | `/public/v1/communities` | `read:communities` | Paginated communities |
| GET | `/public/v1/opportunities` | `read:opportunities` | Public marketplace listings (`marketplaceVisible`, `open`) |
| GET | `/public/v1/events` | `read:events` | Paginated events |
| GET | `/public/v1/venues` | `read:venues` | Venues stub with event counts |
| GET | `/public/v1/analytics/summary` | `read:analytics` | Platform rollup counts only |
| GET | `/public/v1/identity/:namespace/:slug` | `read:identity` | Public TSC identity resolve |

### Admin — API keys

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/admin/api-keys` | Stub admin | Create key (returns `key` once) |
| GET | `/admin/api-keys` | Stub admin | List keys (prefix only, no secret) |
| DELETE | `/admin/api-keys/:id` | Stub admin | Deactivate key |

**OpenAPI stub:** `apps/api/openapi/public-v1.yaml`

---

## ApiKey entity

```javascript
{ id, name, keyHash, prefix, scopes[], ownerOrgId?, rateLimit, isActive, createdAt, lastUsedAt? }
```

**ApiScope values:** `read:artists`, `read:communities`, `read:opportunities`, `read:events`, `read:venues`, `read:analytics`, `read:identity`

---

## White label

### WhiteLabelTenant entity

```javascript
{ id, slug, name, type, customDomain?, logoUrl?, primaryColor?, config JSON, apiKeyId?, isActive }
```

**Types:** `agency`, `community`, `festival`

### White label config shape (JSON `config`)

```json
{
  "agencyId": "cuid…",
  "communityId": "cuid…",
  "festivalEventIds": ["event-id-1"],
  "navItems": [{ "label": "Roster", "path": "artists" }],
  "tagline": "Powered by TSC"
}
```

| Type | Scoped surface |
|------|----------------|
| **agency** | Agency OS — roster via `config.agencyId` + `GET …/artists` |
| **community** | Community dashboard branding — `config.communityId` (UI hook) |
| **festival** | Events scoped stub — `config.festivalEventIds` (10.5+) |

### White label API

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/white-label/tenants/:slug/config` | Public | Branding config |
| GET | `/white-label/tenants/:slug/artists` | Public | Agency roster (requires `type=agency` + `config.agencyId`) |
| POST | `/admin/white-label/tenants` | Stub admin | Create tenant |

### CoreKnot

| File | Purpose |
|------|---------|
| `components/white-label/WhiteLabelShell.jsx` | Load config, set `--color-brand-primary`, tenant logo header |
| `lib/whiteLabelApi.js` | Config + roster fetch + mocks |
| `pages/white-label/INTEGRATION.patch.md` | Route prefix `/t/:tenantSlug/*` + proxy list |

---

## Schema

Fragment: `packages/database/prisma/phase10-step4.prisma`  
Merged into `schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `ApiKey` | Partner API credentials |
| `WhiteLabelTenant` | Branded OS tenant |
| `WhiteLabelTenantType` | agency, community, festival |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/public-api.ts` — scopes, query helpers, config parser |
| `@tsc/types` | `src/public-api.ts` — public + white label payloads |
| `@tsc/contracts` | `src/public-api/index.ts` — Zod schemas |

---

## API modules

| Module | Path |
|--------|------|
| Public API | `apps/api/src/modules/public-api` |
| White Label | `apps/api/src/modules/white-label` |

Registered in `app.module.ts`.

---

## Merge steps

1. Prisma migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase10-step4-public-api-white-label
   ```
2. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
3. Proxy routes in CoreKnot dev server:
   - `/api/public/v1/*`
   - `/api/admin/api-keys/*`
   - `/api/white-label/*`
   - `/api/admin/white-label/*`
4. Merge `pages/white-label/INTEGRATION.patch.md` into `App.jsx` (`/t/:tenantSlug/*`)
5. Restart API; test:
   ```bash
   POST /api/admin/api-keys
   Body: { "name": "Partner Dev", "scopes": ["read:artists", "read:identity"] }

   GET /api/public/v1/artists?page=1&limit=10
   Header: X-TSC-Api-Key: tsc_…

   POST /api/admin/white-label/tenants
   Body: {
     "slug": "demo-agency",
     "name": "Demo Agency OS",
     "type": "agency",
     "primaryColor": "#6366f1",
     "config": { "agencyId": "<agency-id>", "tagline": "Powered by TSC" }
   }

   GET /api/white-label/tenants/demo-agency/config
   GET /api/white-label/tenants/demo-agency/artists
   ```

---

## Verification checklist

- [ ] `prisma validate` passes
- [ ] API key create returns plaintext `key` once; list shows prefix only
- [ ] Public routes reject missing/invalid key or missing scope
- [ ] Rate limit stub returns 429 after 100 req/min per key
- [ ] `/public/v1/analytics/summary` returns count rollup
- [ ] White label config public; agency roster scoped
- [ ] `WhiteLabelShell` applies `--color-brand-primary` from tenant
- [ ] OpenAPI stub present at `apps/api/openapi/public-v1.yaml`

---

## Deferred to Phase 10.5

| Item | Target |
|------|--------|
| Industry Data Exchange (webhooks, sync bulk) | 10.5 |
| Partner webhook subscriptions | 10.5 |
| API key usage analytics / Redis rate limits | 10.5 |
| White label custom domain TLS + DNS | 10.5 |
| Festival event scoping implementation | 10.5 |
| Community OS branded dashboard pages | 10.5 |
| Public API write endpoints | 10.5+ |
| Payment webhooks → public API events | 10.5 |

**Phase 10.4 complete. Ready for Phase 10.5 Industry Data Exchange.**
