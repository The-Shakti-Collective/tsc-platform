# Phase 6.5 Sprint 3 — Ecosystem Activation Layer

**Agent:** Implementer-Phase6.5-Sprint3  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Sprint 3 ships **Module 6 — Activity Feed** (persisted `Activity` entity, personalized/public/community feeds) and **PersonFollow / Following System** (`PersonFollow` table + `FOLLOWS` graph edge). Replaces Sprint 2 `ActivityStubEmitter` logging with `ActivityService.record()`. CoreKnot UI: infinite-scroll feed page, follow button on ecosystem passport, mock fallbacks.

No Sprint 4+ scope (collaboration marketplace posts, reputation engine, credits, discovery). No new analytics calculators.

---

## Module 6 — Activity Feed

### Schema fragment

`packages/database/prisma/phase6.5-activity.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `ActivityAction` | joined_community, left_community, registered_event, checked_in_event, applied_opportunity, followed_person, updated_profile, etc. |
| `ActivityVisibility` | public, followers, private |
| `Activity` | actorPersonId, action, targetType, targetId, metadata, timestamp, visibility |
| `PersonFollow` | followerPersonId, followingPersonId, createdAt |

Merge into canonical `schema.prisma` + extend `Person` with `activities`, `following`, `followers` relations.

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/activity.ts`, `src/follow.ts` |
| `@tsc/types` | `src/activity.ts`, `src/follow.ts` |
| `@tsc/contracts` | `src/activity/index.ts`, `src/follow/index.ts` |

### API (`apps/api/src/modules/activity`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/activity/feed` | StubAuthGuard | Personalized feed (following + own communities + trending stub) |
| GET | `/activity/person/:personId` | Public | Person's public activity |
| GET | `/activity/community/:communityId` | Public | Community-scoped activity |
| POST | `/activity` | StubAuthGuard | Internal/service record |

**Feed composition (`GET /activity/feed`):**

1. Activities from self + followed people
2. Recent public activity in member communities (up to 5 communities)
3. Global trending stub (latest public activities, capped)

Deduped by activity id, sorted by timestamp desc.

### ActivityService

- `record()` — direct persistence (graceful no-op if Prisma model not merged)
- `recordFromStub()` — maps Sprint 2 stub types → `ActivityAction`
- Enriched feed items include `message` (e.g. "Ritviz joined TSC Underground")

`ActivityModule` registered in `app.module.ts`, exported for Community/Event/Profile/Opportunity modules.

---

## PersonFollow / Following System

### API (extended `apps/api/src/modules/profile`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/profile/follow/:personId` | StubAuthGuard | Follow + `FOLLOWS` edge + activity |
| DELETE | `/profile/unfollow/:personId` | StubAuthGuard | Unfollow + end edge + private activity |
| GET | `/profile/:personId/followers` | StubAuthGuard | Paginated followers |
| GET | `/profile/:personId/following` | StubAuthGuard | Paginated following |
| GET | `/profile/:personId/follow-status` | StubAuthGuard | isFollowing + counts |
| GET | `/profile/me/following/feed` | StubAuthGuard | Activities from followed people |

**Graph:** follow upserts `FOLLOWS` Person → Person; unfollow sets `effectiveTo`.

---

## Emitter wiring (Sprint 2 → Sprint 3)

| Module | Trigger | Activity action |
|--------|---------|-----------------|
| `CommunityService` | join / leave / add | joined_community / left_community via `recordFromStub` |
| `EventService` | register / check-in | registered_event / checked_in_event via `recordFromStub` |
| `ProfileService` | PATCH `/profile/me` | updated_profile via `record()` |
| `OpportunityService` | apply | applied_opportunity via `record()` |
| `ProfileService` | follow / unfollow | followed_person / unfollowed_person |

Role-change stub events (`community.member.role_changed`, `event.participant.role_changed`) intentionally not persisted — no matching feed action in Sprint 3 scope.

`ActivityStubEmitter` deprecated; types re-exported from `activity.repository.ts`.

---

## CoreKnot UI

| Component | Path | Wired |
|-----------|------|-------|
| `ActivityFeedPage` | `pages/feed/ActivityFeedPage.jsx` | Patch doc |
| `ActivityFeedList` | `components/activity/ActivityFeedList.jsx` | Infinite scroll |
| `ActivityFeedItem` | `components/activity/ActivityFeedItem.jsx` | Message + relative time |
| `FollowButton` | `components/profile/FollowButton.jsx` | `EcosystemPassportPage` |
| `activityApi.js` | feed / person / community / following feed | mock fallback |
| `profileApi.js` | follow / unfollow / follow-status | mock fallback |
| Hooks | `hooks/queries/activity.js`, extended `profile.js` | React Query |

See `apps/coreknot/client/src/pages/feed/INTEGRATION.patch.md` for routes `/feed`, `/activity`.

---

## Files created

```
packages/database/prisma/phase6.5-activity.prisma
packages/database/src/activity.ts
packages/database/src/follow.ts
packages/types/src/activity.ts
packages/types/src/follow.ts
packages/contracts/src/activity/index.ts
packages/contracts/src/follow/index.ts
apps/api/src/modules/activity/activity.module.ts
apps/api/src/modules/activity/activity.controller.ts
apps/api/src/modules/activity/activity.service.ts
apps/api/src/modules/activity/activity.repository.ts
apps/api/src/modules/activity/dto.ts
apps/api/src/modules/activity/schema/index.ts
apps/coreknot/client/src/lib/activityApi.js
apps/coreknot/client/src/hooks/queries/activity.js
apps/coreknot/client/src/components/activity/ActivityFeedItem.jsx
apps/coreknot/client/src/components/activity/ActivityFeedList.jsx
apps/coreknot/client/src/components/profile/FollowButton.jsx
apps/coreknot/client/src/pages/feed/ActivityFeedPage.jsx
apps/coreknot/client/src/pages/feed/INTEGRATION.patch.md
.agents/phase6.5-sprint3-report.md
```

## Files changed

```
packages/database/src/index.ts
packages/types/src/index.ts
packages/contracts/src/index.ts
packages/contracts/package.json
apps/api/src/app.module.ts
apps/api/src/common/activity/activity-stub.emitter.ts
apps/api/src/modules/community/community.module.ts
apps/api/src/modules/community/community.service.ts
apps/api/src/modules/event/event.module.ts
apps/api/src/modules/event/event.service.ts
apps/api/src/modules/opportunity/opportunity.module.ts
apps/api/src/modules/opportunity/opportunity.service.ts
apps/api/src/modules/profile/profile.module.ts
apps/api/src/modules/profile/profile.controller.ts
apps/api/src/modules/profile/profile.service.ts
apps/api/src/modules/profile/profile.repository.ts
apps/coreknot/client/src/lib/profileApi.js
apps/coreknot/client/src/hooks/queries/profile.js
apps/coreknot/client/src/pages/passport/EcosystemPassportPage.jsx
```

---

## Merge steps (canonical schema)

1. Append `phase6.5-activity.prisma` to `schema.prisma`.
2. Extend `Person`:
   - `activities Activity[] @relation("PersonActivities")`
   - `following PersonFollow[] @relation("PersonFollowing")`
   - `followers PersonFollow[] @relation("PersonFollowers")`
3. Run `pnpm --filter @tsc/database prisma migrate dev --name phase6_5_sprint3_activity_follow`.
4. Build packages: `pnpm --filter @tsc/contracts build && pnpm --filter @tsc/database build`.
5. Proxy `/api/activity/*` and follow routes in CoreKnot dev server.
6. Merge CoreKnot routes per `INTEGRATION.patch.md`.

---

## Deferred to Sprint 4+

- Collaboration marketplace (`posted_collaboration` action stub enum only)
- `won_opportunity` / `launched_opportunity` activity triggers (marketplace lifecycle)
- Reputation engine + ecosystem score recomputation from feed
- Credits / Discovery modules
- Feed ranking / intelligence scoring (trending is latest-public stub)
- Real-time feed push / websockets
- Block/mute, feed privacy controls beyond visibility enum
- Follow suggestions / discovery graph queries
