# Phase 6.5 Sprint 4 — Ecosystem Activation Layer

**Agent:** Implementer-Phase6.5-Sprint4  
**Date:** 2026-06-12  
**Status:** Complete (implementation)

## Summary

Sprint 4 ships **Module 5 — Collaboration Engine / Collaboration Marketplace**: `Collaboration` + `CollaborationApplication` entities, full CRUD/apply/accept API, activity feed integration (`posted_collaboration`, `applied_collaboration`), graph relationship stubs on accept (`COLLABORATED_WITH` + `WORKED_WITH`), and CoreKnot UI with mock fallback.

No Sprint 5 scope (reputation engine, ecosystem credits, discovery engine, command center participation upgrade). No new analytics/scoring calculators.

---

## Module 5 — Collaboration Marketplace

### Schema fragment

`packages/database/prisma/phase6.5-collaboration.prisma`

| Model / enum | Purpose |
|--------------|---------|
| `CollaborationType` | need_rapper, need_producer, need_guitarist, need_videographer, need_cover_artist, general |
| `CollaborationStatus` | open, filled, closed, expired |
| `CollaborationApplicationStatus` | applied, accepted, rejected, withdrawn |
| `Collaboration` | creatorPersonId, title, description, type, genres[], city, status, expiresAt |
| `CollaborationApplication` | collaborationId, applicantPersonId, message, status, appliedAt |

Merge into canonical `schema.prisma` + extend `Person` with `collaborationsCreated`, `collaborationApplications` relations.

Also append `applied_collaboration` to `ActivityAction` enum (updated in `phase6.5-activity.prisma`).

### Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/collaboration.ts` |
| `@tsc/types` | `src/collaboration.ts` |
| `@tsc/contracts` | `src/collaboration/index.ts` |

### API (`apps/api/src/modules/collaboration`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/collaborations` | StubAuthGuard | Browse/filter (type, genre, city, status=open) |
| GET | `/collaborations/me/created` | StubAuthGuard | Creator's posted collaborations |
| GET | `/collaborations/me/applications` | StubAuthGuard | Applicant's applications |
| GET | `/collaborations/:id` | StubAuthGuard | Detail + applications (creator only) + myApplication |
| POST | `/collaborations` | StubAuthGuard | Post collaboration request |
| PATCH | `/collaborations/:id` | StubAuthGuard | Update/close (creator only) |
| POST | `/collaborations/:id/apply` | StubAuthGuard | Apply with message |
| PATCH | `/collaborations/:id/applications/:applicationId` | StubAuthGuard | Accept/reject (creator only) |

**Activity integration:**

| Trigger | Activity action |
|---------|-----------------|
| POST `/collaborations` | `posted_collaboration` via `ActivityService.record()` |
| POST `/collaborations/:id/apply` | `applied_collaboration` via `ActivityService.record()` |

**Graph integration on accept:**

- Upserts `COLLABORATED_WITH` Person → Person (creator → applicant)
- Upserts `WORKED_WITH` Person → Person (creator → applicant)
- Sets collaboration status to `filled`

`CollaborationModule` registered in `app.module.ts` (import was pre-staged; module now implemented).

---

## CoreKnot UI

| Component | Path | Wired |
|-----------|------|-------|
| `CollaborationMarketplacePage` | `pages/collaboration/CollaborationMarketplacePage.jsx` | Patch doc |
| `CollaborationDetailPage` | `pages/collaboration/CollaborationDetailPage.jsx` | Apply + manage apps |
| `PostCollaborationForm` | `components/collaboration/PostCollaborationForm.jsx` | Create flow |
| `PostCollaborationPage` | `pages/collaboration/PostCollaborationPage.jsx` | Wrapper |
| `MyCollaborationsPage` | `pages/collaboration/MyCollaborationsPage.jsx` | Creator list |
| `MyCollaborationApplicationsPage` | `pages/collaboration/MyCollaborationApplicationsPage.jsx` | Applicant list |
| `collaborationApi.js` | browse / detail / CRUD / apply | mock fallback |
| Hooks | `hooks/queries/collaboration.js` | React Query |
| Artist workspace link | `ArtistWorkspacePage.jsx` | Browse + post CTAs |

See `apps/coreknot/client/src/pages/collaboration/INTEGRATION.patch.md` for routes.

---

## Files created

```
packages/database/prisma/phase6.5-collaboration.prisma
packages/database/src/collaboration.ts
packages/types/src/collaboration.ts
packages/contracts/src/collaboration/index.ts
apps/api/src/modules/collaboration/collaboration.module.ts
apps/api/src/modules/collaboration/collaboration.controller.ts
apps/api/src/modules/collaboration/collaboration.service.ts
apps/api/src/modules/collaboration/collaboration.repository.ts
apps/api/src/modules/collaboration/application-state.ts
apps/api/src/modules/collaboration/dto.ts
apps/api/src/modules/collaboration/schema/index.ts
apps/coreknot/client/src/lib/collaborationApi.js
apps/coreknot/client/src/hooks/queries/collaboration.js
apps/coreknot/client/src/components/collaboration/PostCollaborationForm.jsx
apps/coreknot/client/src/pages/collaboration/CollaborationMarketplacePage.jsx
apps/coreknot/client/src/pages/collaboration/CollaborationDetailPage.jsx
apps/coreknot/client/src/pages/collaboration/PostCollaborationPage.jsx
apps/coreknot/client/src/pages/collaboration/MyCollaborationsPage.jsx
apps/coreknot/client/src/pages/collaboration/MyCollaborationApplicationsPage.jsx
apps/coreknot/client/src/pages/collaboration/INTEGRATION.patch.md
.agents/phase6.5-sprint4-report.md
```

## Files changed

```
packages/database/prisma/phase6.5-activity.prisma
packages/database/src/activity.ts
packages/database/src/index.ts
packages/types/src/activity.ts
packages/types/src/index.ts
packages/contracts/src/activity/index.ts
packages/contracts/src/index.ts
packages/contracts/package.json
apps/api/src/modules/activity/activity.service.ts
apps/api/src/modules/activity/activity.repository.ts
apps/coreknot/client/src/components/activity/ActivityFeedItem.jsx
apps/coreknot/client/src/pages/operating/artists/ArtistWorkspacePage.jsx
```

---

## Merge steps (canonical schema)

1. Append `phase6.5-collaboration.prisma` to `schema.prisma`.
2. Re-merge `applied_collaboration` into `ActivityAction` enum if not already present.
3. Extend `Person`:
   - `collaborationsCreated Collaboration[] @relation("CollaborationCreator")`
   - `collaborationApplications CollaborationApplication[] @relation("CollaborationApplicant")`
4. Run `pnpm --filter @tsc/database prisma migrate dev --name phase6_5_sprint4_collaboration`.
5. Build packages: `pnpm --filter @tsc/contracts build && pnpm --filter @tsc/database build`.
6. Proxy `/api/collaborations/*` in CoreKnot dev server.
7. Merge CoreKnot routes per `INTEGRATION.patch.md`.

---

## Deferred to Sprint 5

- Reputation engine + ecosystem score recomputation from collaborations
- Ecosystem Credits for collaboration matches
- Discovery engine / intelligence ranking for collaboration suggestions
- Command Center participation upgrade
- Auto-expire collaborations (`expired` status cron)
- Withdraw application flow (API state machine supports it; UI not wired)
- Notifications (email/push) on apply/accept
- Collaboration messaging / chat thread
- Multi-slot collaborations (accept multiple applicants)
- `won_opportunity` / `launched_opportunity` activity triggers (marketplace lifecycle — separate module)
