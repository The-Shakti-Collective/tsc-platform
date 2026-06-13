# Phase 8 Step 1 — Universal Fan Identity & Fan Graph

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 8 Step 1 ships **Module 1 — Universal Fan Identity** (`FanProfile`) and **Module 2 — Fan Graph** (relationship extensions + fan-centric APIs). Every ecosystem participant gets a fan profile auto-created on identity resolve, community join, or event register. Scores aggregate from existing `FanIntelligenceSnapshot` (Phase 5) + participation counts — no new ML calculators.

**Out of scope:** Steps 3–10 (Superfan, Memberships, Rewards, Audience V2, Fan Commerce, Audience OS, Command Center V4), Phase 9, Phase 10.

---

## Schema

Fragment: `packages/database/prisma/phase8-step1.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `FanProfile` | personId, favoriteGenres[], favoriteArtists[], cities[], 4 score columns |
| `ArtistFollow` | Person → Artist follow (fixes Phase 7 intelligence refs) |
| `FanIntelligenceSnapshot` | Phase 5 read model for score aggregation |
| `FanIntelligenceTier` | super / active / casual / dormant |
| `RelationshipType` +4 | SUPPORTED, SUBSCRIBED, PURCHASED, REFERRED |

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/fan.ts`; `relationship.ts` enum extensions |
| `@tsc/types` | `src/fan.ts`; `activity.ts` +2 actions |
| `@tsc/contracts` | `src/fan/index.ts`; relationship + activity schemas |

---

## API (`apps/api/src/modules/fan`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/fans/me/profile` | StubAuthGuard | Full fan profile for current person |
| PATCH | `/fans/me/profile` | StubAuthGuard | Update genres, artists, cities |
| GET | `/fans/:personId/profile` | Public | Partial public fan profile |
| GET | `/fans/:personId/scores` | Public | Aggregated scores (snapshot → profile → stub) |
| POST | `/fans/follow/:artistId` | StubAuthGuard | FOLLOWS edge + ArtistFollow + activity |
| POST | `/fans/support/:artistId` | StubAuthGuard | SUPPORTED edge stub + activity |
| GET | `/fans/:personId/graph` | StubAuthGuard | Fan-centric subgraph |
| GET | `/artists/:id/fans` | Public | Top fans by engagementScore |

`FanModule` registered in `app.module.ts`.

### Auto-create hooks

`FanService.ensureFanProfileStub()` called from:

- `identity-resolution.service.ts` — on identity resolve (match + create)
- `community.service.ts` — on community join
- `event.service.ts` — on event register

### Activity feed

New actions: `followed_artist`, `supported_artist` — wired from follow/support endpoints with enriched messages.

---

## CoreKnot UI

| File | Changes |
|------|---------|
| `lib/fanApi.js` | Profile, scores, follow, support, graph, artist fans + mocks |
| `components/passport/FanProfileSection.jsx` | Score pills, genres, cities, artists |
| `pages/passport/EcosystemPassportPage.jsx` | Renders `FanProfileSection` below reputation strip |

---

## Score aggregation (no new ML)

Priority chain in `FanService.refreshScores()`:

1. Latest `FanIntelligenceSnapshot` for person (global or artist-scoped)
2. Cached columns on `FanProfile`
3. Stub from `EventParticipation` + community + artist follow counts via `stubFanScoresFromParticipation()`

---

## Merge steps

1. Merge `phase8-step1.prisma` into canonical schema (already applied in workspace snapshot).
2. Run migration:
   ```bash
   cd packages/database && npx prisma migrate dev --name phase8-step1-fan
   ```
3. Rebuild packages:
   ```bash
   npm run build -w @tsc/database -w @tsc/types -w @tsc/contracts
   npm run build -w @tsc/api
   ```
4. Restart API; verify `/api/fans/me/profile` and passport page Fan Profile section.

---

## Deferred to Step 2

- Superfan tiers and membership products
- Rewards redemption flows
- Audience snapshots V2 rollups
- Fan commerce (tickets, merch, tips)
- SUBSCRIBED / PURCHASED / REFERRED edge writers (enum only; no commerce triggers yet)
- Fan graph depth > 1 traversal and cross-person recommendations
- Score refresh cron / snapshot job wiring to update FanProfile columns
- Artist follow unfollow + support undo
- Public fan graph (currently owner/admin only)

---

## Verification

- [ ] `prisma validate` passes
- [ ] `@tsc/database`, `@tsc/types`, `@tsc/contracts` build
- [ ] API boots with `FanModule`
- [ ] Follow artist creates FOLLOWS Person→Artist + activity
- [ ] Ecosystem Passport shows Fan Profile section (mock fallback OK offline)
