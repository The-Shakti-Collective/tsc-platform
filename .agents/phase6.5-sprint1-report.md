# Phase 6.5 Sprint 1 — Ecosystem Activation Layer

**Agent:** Implementer-Phase6.5-Sprint1  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Foundation for participation before marketplace/transactions: **PersonProfile**, **Ecosystem Passport** upgrade, and **Verification V1** (levels 0–4). Wired into identity resolve and `artist.created` sync. No Phase 5 analytics rebuild — reputation/ecosystem scores remain placeholders.

---

## Module 1 — PersonProfile

### Schema fragment

`packages/database/prisma/phase6.5-profile.prisma`

| Model | Purpose |
|-------|---------|
| `PersonProfile` | Unified person-facing profile (`username`, `slug`, `bio`, `city`, `genres[]`, `skills[]`, `links`, scores, `verificationLevel`) |
| `PersonVerificationRequest` | Community verification request stub |

Merge into canonical `schema.prisma` + extend `Person` with `profile`, `verificationRequests`.

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/profile.ts`, `src/index.phase6.5-profile.ts`, merged in `index.ts` |
| `@tsc/types` | `src/profile.ts`, merged in `index.ts` |
| `@tsc/contracts` | `src/profile/index.ts`, export `./profile` in `package.json` |

### API (`apps/api/src/modules/profile`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/profile/:slug/public` | Public | TSC public profile |
| GET | `/profile/:slug/ecosystem` | Public | Merged ecosystem passport payload |
| GET | `/profile/me` | StubAuthGuard | Authenticated person's profile |
| PATCH | `/profile/me` | StubAuthGuard | Edit bio, city, genres, skills, links, username |
| POST | `/profile/username/check` | StubAuthGuard | Username availability |
| GET | `/profile/:id/verification` | StubAuthGuard | Verification breakdown |
| POST | `/profile/verification/request-community` | StubAuthGuard | Community verification stub |
| PATCH | `/admin/verification/:personId` | StubAuthGuard (admin) | Set level 4 |

**Auto-create stub:** `ProfileService.ensureProfileStub()` on identity resolve (create + match) and `artist.created` sync.

---

## Module 2 — Ecosystem Passport

Upgraded public surface merging `PersonProfile` + `ArtistPassport` when person is also an artist.

**Sections:** Identity (roles, verification), Communities (`MEMBER_OF`), Events (`ATTENDED`/`PERFORMED_AT`), Opportunities (`OpportunityApplication`), Collaborations (`COLLABORATED_WITH`), Reputation + ecosystem rank percentile stub.

**UI:** `EcosystemPassportPage.jsx` (replaces `ArtistPassportPage` via re-export). Community app re-exports from CoreKnot.

**Client API:** `profileApi.js` with mock fallback (mirrors `intelligenceApi.js` pattern).

**Routes (UI):** `/profile/:slug`, `/passport/:slug`, `/a/:slug` — see `INTEGRATION.patch.md`.

---

## Module 8 — Verification V1

Rule-based `computeVerificationLevel(personId)` in `VerificationService`:

| Level | Rule |
|-------|------|
| 0 | Default |
| 1 | Verified email **and** phone (`PersonIdentifier.verified`) |
| 2 | Social identifier linked (instagram/spotify/etc.) |
| 3 | `community_leader` role or `MANAGES` relationship |
| 4 | Admin flag (`adminVerified` on profile) |

Cached on `PersonProfile.verificationLevel`. Community request persists stub row; review workflow deferred.

---

## Integration wiring

| Hook | Change |
|------|--------|
| `IdentityResolutionService.resolve` | `ensureProfileStub` after create/match |
| `SyncService.handleArtistCreated` | `ensureProfileStub` with artist slug |
| `AppModule` | `ProfileModule` registered |
| `IdentityModule` | imports `ProfileModule` |
| `SyncModule` | imports `ProfileModule` |

---

## Files created

```
packages/database/prisma/phase6.5-profile.prisma
packages/database/src/profile.ts
packages/database/src/index.phase6.5-profile.ts
packages/types/src/profile.ts
packages/types/src/index.phase6.5-profile.ts
packages/contracts/src/profile/index.ts
apps/api/src/modules/profile/profile.module.ts
apps/api/src/modules/profile/profile.controller.ts
apps/api/src/modules/profile/profile.service.ts
apps/api/src/modules/profile/profile.repository.ts
apps/api/src/modules/profile/verification.service.ts
apps/api/src/modules/profile/dto.ts
apps/api/src/modules/profile/schema/index.ts
apps/coreknot/client/src/pages/passport/EcosystemPassportPage.jsx
apps/coreknot/client/src/lib/profileApi.js
apps/coreknot/client/src/hooks/queries/profile.js
apps/coreknot/client/src/pages/passport/INTEGRATION.patch.md
.agents/phase6.5-sprint1-report.md
```

## Files changed

```
packages/database/src/index.ts
packages/types/src/index.ts
packages/contracts/src/index.ts
packages/contracts/package.json
packages/permissions/src/index.ts
apps/api/src/app.module.ts
apps/api/src/modules/identity/identity.module.ts
apps/api/src/modules/identity/identity-resolution.service.ts
apps/api/src/modules/sync/sync.module.ts
apps/api/src/modules/sync/sync.service.ts
apps/coreknot/client/src/pages/passport/ArtistPassportPage.jsx
apps/community/src/pages/ArtistPassportPage.jsx
```

---

## Merge steps (canonical schema)

1. Append `phase6.5-profile.prisma` models to `schema.prisma`.
2. Extend `Person` with `profile PersonProfile?` and `verificationRequests PersonVerificationRequest[]`.
3. Run `pnpm --filter @tsc/database prisma migrate dev`.
4. Merge CoreKnot routes per `INTEGRATION.patch.md`.
5. Proxy `/api/profile/*` to `@tsc/api`.

---

## Deferred to Sprint 2+

- CommunityMember participation engine
- EventParticipation module
- Activity Feed
- Community verification review workflow
- Real ecosystem rank percentile (Sprint 5 scoring)
- Reputation/ecosystem score recomputation pipelines
- Profile edit UI in CoreKnot operating shell
- `tsc.in` DNS / static site routing (UI patch only)
