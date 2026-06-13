# Phase 6.5 Sprint 2 — Ecosystem Activation Layer

**Agent:** Implementer-Phase6.5-Sprint2  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Sprint 2 ships **Community Membership Engine** (join/leave/role, `MEMBER_OF` edges, activity stub) and **Event Participation Layer** (`EventParticipation`, register/check-in/role, `ATTENDED`/`PERFORMED_AT`/`MANAGES` edges). Minimal CoreKnot UI: community join/leave button, event register stub + integration patch. No Activity Feed, Following, Reputation, or new analytics calculators.

---

## Module 3 — Community Membership Engine

### Schema fragment

`packages/database/prisma/phase6.5-membership.prisma`

| Field / enum | Values |
|--------------|--------|
| `CommunityMemberRole` | Founder, Moderator, Member, Contributor |
| `CommunityMemberStatus` | active, left, banned, pending |
| `CommunityMember` | communityId, personId, role, status, joinedAt, leftAt? |

Legacy `Leader` → `Founder` via `normalizeCommunityMemberRole()`.

Merge into canonical `schema.prisma` + extend `Community` / `Person` relations.

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/membership.ts`, merged in `index.ts` |
| `@tsc/types` | `src/membership.ts`, merged in `index.ts` |
| `@tsc/contracts` | `src/membership/index.ts`, export `./membership` |

### API (`apps/api/src/modules/community` — extended)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/communities/:id/join` | StubAuthGuard | Authenticated person joins as Member |
| POST | `/communities/:id/leave` | StubAuthGuard | Member leaves; ends `MEMBER_OF` edge |
| PATCH | `/communities/:id/members/:personId/role` | StubAuthGuard (leader) | Promote/demote role |
| GET | `/communities/:id/members` | StubAuthGuard | Paginated list + status, joinedAt, lastActive stub |
| POST | `/communities/:id/members` | StubAuthGuard (leader) | Leader add (existing; aligned with sync) |

**Graph:** join/leave/add upsert or end `MEMBER_OF` Person → Community with `effectiveFrom` / `effectiveTo`.

**Identity:** `join` calls `ProfileService.ensureProfileStub()` after person lookup.

**Activity stub:** `ActivityStubEmitter` logs `community.member.joined`, `.left`, `.role_changed`, `.added` (Sprint 3 persists).

**Sync alignment:** `sync.repository.ensureCommunityMember` sets `status: active`, maps Leader → Founder; `community.member.added` handler unchanged path, same edge type.

---

## Module 4 — Event Participation Layer

### Schema fragment

`packages/database/prisma/phase6.5-participation.prisma`

| Field / enum | Values |
|--------------|--------|
| `EventParticipationRole` | Attendee, Artist, Volunteer, Organizer, Judge, Speaker |
| `EventParticipationStatus` | registered, checked_in, cancelled, no_show |
| `EventParticipation` | eventId, personId, role, status, checkedInAt? |

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/participation.ts` (`PARTICIPATION_ROLE_RELATIONSHIP_MAP`) |
| `@tsc/types` | `src/participation.ts` |
| `@tsc/contracts` | `src/participation/index.ts`, export `./participation` |

### API (`apps/api/src/modules/event` — new module)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/events/:id/register` | StubAuthGuard | Register as Attendee (or role in body) |
| POST | `/events/:id/check-in` | StubAuthGuard | Check in (QR token stub) |
| GET | `/events/:id/participants` | StubAuthGuard | Paginated by role/status |
| PATCH | `/events/:id/participants/:personId/role` | StubAuthGuard (organizer) | Assign participation role |

**Graph edges (role → relationship):**

| Role | Relationship |
|------|----------------|
| Attendee, Volunteer, Judge | ATTENDED |
| Artist, Speaker | PERFORMED_AT |
| Organizer | MANAGES |

Stale edges ended on role change via `removeStaleParticipationRelationships`.

**Activity stub:** `event.participant.registered`, `.checked_in`, `.role_changed`.

`EventModule` registered in `app.module.ts` (import existed; module scaffolded).

---

## CoreKnot UI (minimal)

| Component | Path | Wired |
|-----------|------|-------|
| `CommunityJoinButton` | `components/community/CommunityJoinButton.jsx` | `CommunityDashboardPage` |
| `EventRegisterButton` | `components/events/EventRegisterButton.jsx` | Patch doc only |
| `communityApi.js` | join/leave/membership/role | mock fallback |
| `eventApi.js` | register/check-in/participants | mock fallback |
| Hooks | `hooks/queries/community.js`, `event.js` | React Query |

Event detail: see `apps/coreknot/client/src/pages/operating/events/INTEGRATION.patch.md`.

---

## Ecosystem passport / profile

Communities and events sections in `ProfileService.getEcosystemPassport()` continue reading **relationship graph** (`MEMBER_OF`, `ATTENDED`, `PERFORMED_AT`). Participation/membership tables are source of truth for API; graph edges kept in sync on write — no passport query change required.

---

## Files created

```
packages/database/prisma/phase6.5-membership.prisma
packages/database/prisma/phase6.5-participation.prisma
packages/database/src/membership.ts
packages/database/src/participation.ts
packages/types/src/membership.ts
packages/types/src/participation.ts
packages/contracts/src/membership/index.ts
packages/contracts/src/participation/index.ts
apps/api/src/common/activity/activity-stub.emitter.ts
apps/api/src/modules/event/event.module.ts
apps/api/src/modules/event/event.controller.ts
apps/api/src/modules/event/event.service.ts
apps/api/src/modules/event/event.repository.ts
apps/api/src/modules/event/schema/index.ts
apps/api/src/modules/event/dto.ts
apps/api/src/modules/event/types/index.ts
apps/coreknot/client/src/components/community/CommunityJoinButton.jsx
apps/coreknot/client/src/components/events/EventRegisterButton.jsx
apps/coreknot/client/src/lib/eventApi.js
apps/coreknot/client/src/hooks/queries/event.js
apps/coreknot/client/src/pages/operating/events/INTEGRATION.patch.md
.agents/phase6.5-sprint2-report.md
```

## Files changed

```
packages/database/src/index.ts
packages/types/src/index.ts
packages/contracts/src/index.ts
packages/contracts/package.json
apps/api/src/modules/community/community.repository.ts
apps/api/src/modules/community/community.service.ts
apps/api/src/modules/community/community.controller.ts
apps/api/src/modules/community/community.module.ts
apps/api/src/modules/community/schema/index.ts
apps/api/src/modules/community/types/index.ts
apps/api/src/modules/community/dto.ts
apps/api/src/modules/sync/sync.repository.ts
apps/coreknot/client/src/lib/communityApi.js
apps/coreknot/client/src/hooks/queries/community.js
apps/coreknot/client/src/pages/operating/communities/CommunityDashboardPage.jsx
```

---

## Merge steps (canonical schema)

1. Append `phase6.5-membership.prisma` + `phase6.5-participation.prisma` to `schema.prisma`.
2. Extend `Person`, `Community`, `Event` with relation fields per fragment comments.
3. Migrate legacy `CommunityMember.role` values: `Leader` → `Founder`; add `status` default `active`.
4. Run `pnpm --filter @tsc/database prisma migrate dev --name phase6_5_sprint2_membership_participation`.
5. Proxy `/api/communities/*` and `/api/events/*` to `@tsc/api` in CoreKnot dev server.
6. Wire `EventRegisterButton` per `INTEGRATION.patch.md` when event detail route exists.

---

## Deferred to Sprint 3+

- Activity Feed entity + persistence (stub emitter only)
- Following / Collaboration modules
- Reputation engine + ecosystem score recomputation
- Credits / Discovery
- Community verification review workflow
- Real QR check-in validation
- Event detail page + full registration UX
- New analytics calculators (intelligence reads graph edges later)
