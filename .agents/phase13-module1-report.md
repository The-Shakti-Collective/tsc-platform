# Phase 13 Module 1 — Universal Creative Identity (CON)

**Status:** Complete (implementation)  
**Date:** 2026-06-12  
**Depends on:** Phases 4–12 (Person, PersonProfile, PersonRole, TscIdentity, FanProfile, ArtistPassport, Workspace)

## Summary

Phase 13 Module 1 introduces **CreativeIdentity** as the canonical multi-vertical creative view for a Person. One `CreativeIdentity` per person, globally unique slug, self-declared verticals/roles/capability stubs, and entity-linked roles via existing `PersonRole`. Identity resolve auto-provisions stubs from `PersonProfile`; `artist.created` sync adds artist role linkage.

**Out of scope (Module 2+):** Skill Graph, Service Marketplace, Portfolio, Talent Discovery expansion, Team Assembly, Creator Reputation, Project Economy, cross-industry APIs beyond verticals enum, Command Center V6.

---

## Schema

**File:** `packages/database/prisma/phase13-module1.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `CreativeIdentity` | Ecosystem root creative profile (1:1 with Person) |
| `CreativeVertical` | music, film, photography, podcast, comedy, dance, content |
| `CreativeRoleTag` | photographer, videographer, artist, producer, manager, founder, community_leader |

**Constraints:** `personId` unique, `slug` globally unique.

**Merge notes:** Extend `Person.creativeIdentity`, optional `Workspace.creativeIdentityId`, `ActivityAction` values `creative_identity_created` / `creative_role_added`.

---

## API — `creative-identity` module

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/creative-identity/me` | Stub | Own creative identity |
| PATCH | `/creative-identity/me` | Stub | Edit bio, verticals, role tags, capabilities |
| GET | `/creative-identity/:slug/public` | Public | Public creative profile + entity roles |
| GET | `/creative-identity/:slug/roles` | Public | Active PersonRole list with entity links |
| POST | `/creative-identity/me/roles` | Stub | Add PersonRole assignment |
| DELETE | `/creative-identity/me/roles/:roleId` | Stub | Deactivate PersonRole |

**Packages:**

- `@tsc/database` — `packages/database/src/creative-identity.ts`
- `@tsc/types` — `packages/types/src/creative-identity.ts`
- `@tsc/contracts` — `packages/contracts/src/creative-identity/index.ts`

---

## Integration hooks

| Hook | Location | Behavior |
|------|----------|----------|
| Identity resolve | `identity-resolution.service.ts` | `ensureStub` after profile + fan |
| Profile backward compat | `profile.service.ts` | Merges `creativeIdentity` on `GET /profile/:slug/public` |
| `artist.created` sync | `sync.service.ts` | `syncArtistCreated` — artist tag + PersonRole |
| Workspace create | `workspace-provision.service.ts` | `linkWorkspaceToCreativeIdentity` stub |
| TSC identity slug | `tsc-identity-provision.service.ts` | `ensureCreativeIdentity` aligns fan namespace slug |
| Activity | `activity.ts` | `creative_identity_created`, `creative_role_added` |

---

## CoreKnot UI

| File | Route |
|------|-------|
| `CreativeIdentityPage.jsx` | `/creator/:slug`, `/creative/:slug` |
| `CreativeIdentityEditPage.jsx` | `/settings/creative-identity` |
| `creativeIdentityApi.js` | API client + mock fallback |

See `apps/coreknot/client/src/pages/creative-identity/INTEGRATION.patch.md`.

---

## Migration steps

1. Merge `phase13-module1.prisma` into `packages/database/prisma/schema.prisma`
2. Add Person relation + ActivityAction enum values
3. `pnpm --filter @tsc/database prisma migrate dev`
4. Register CoreKnot routes + API proxy per INTEGRATION.patch.md
5. Existing `/profile/:slug` and `/passport/:slug` routes unchanged — creative data merged at service layer

---

## Deferred to Module 2

- **Skill Graph** — replace `capabilities[]` string stubs with structured skills
- **Full trust score** — wire `trustScoreStub` to Module 7 Trust engine
- **Workspace FK** — persist `Workspace.creativeIdentityId` after schema merge
- **`creator` TSC namespace** — optional dedicated namespace vs fan slug alignment
- **Service marketplace, portfolio, talent discovery, team assembly, reputation, project economy**

---

## Test checklist

- [ ] Identity resolve creates CreativeIdentity when PersonProfile exists
- [ ] PATCH updates verticals/roles/capabilities
- [ ] Public page shows multiple simultaneous roles
- [ ] `artist.created` adds artist PersonRole + role tag
- [ ] `/profile/:slug/public` includes `creativeIdentity` merge block
- [ ] Activity feed records `creative_identity_created` / `creative_role_added`
