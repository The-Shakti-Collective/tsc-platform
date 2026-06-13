# Phase 12 Sprint 1 — Creator Workspace Network (Workspace + Teams + Members)

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Phase 12 Sprint 1 ships the **Personal Operating Layer** at `/workspace` — workspace entities, member management, and sub-teams wired to Phase 6.5 `Person` / `PersonProfile` and Phase 10 `TscIdentity`. Auto-provision personal workspace on profile create / first `GET /workspace/me`. CoreKnot shell + dashboard/settings/teams pages with Sprint 2–3 placeholders.

**Out of scope (deferred):** Projects, Tasks, Calendar UI, Goals, Documents, Contacts, Workspace AI, Templates, email invite flow, ownership transfer.

---

## Schema

Fragment: `packages/database/prisma/phase12-sprint1.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `Workspace` | slug, name, ownerPersonId, type, settings JSON |
| `WorkspaceMember` | workspaceId, personId, role, joinedAt, status |
| `WorkspaceTeam` | Sub-team within workspace (name, slug, description) |
| `WorkspaceType` | artist, manager, team, community_leader, agency, personal |
| `WorkspaceMemberRole` | owner, admin, member, guest |
| `WorkspaceMemberStatus` | active, invited, removed |

`Person` extended: `ownedWorkspaces`, `workspaceMembers`.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/workspace.ts` — types, labels, includes, slug helpers, identity link |
| `@tsc/types` | `src/workspace.ts` — API payloads |
| `@tsc/contracts` | `src/workspace/index.ts` — Zod schemas |
| `@tsc/workspace` | `packages/workspace/` — re-exports + route/API path helpers |

Activity actions added: `workspace_created`, `workspace_member_added`.

---

## API (`apps/api/src/modules/workspace`)

`WorkspaceModule` registered in `app.module.ts`.

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| POST | `/workspace` | StubAuthGuard | Create workspace (idempotent personal default) |
| GET | `/workspace/me` | StubAuthGuard | Current user's default workspace (auto-provision) |
| GET | `/workspace/:slug` | StubAuthGuard | Workspace detail + members + teams |
| PATCH | `/workspace/:slug` | StubAuthGuard | Update name / settings |
| GET | `/workspace/:slug/members` | StubAuthGuard | List active members |
| POST | `/workspace/:slug/members` | StubAuthGuard | Add / re-invite member |
| PATCH | `/workspace/:slug/members/:personId` | StubAuthGuard | Change role |
| DELETE | `/workspace/:slug/members/:personId` | StubAuthGuard | Remove member (soft) |
| POST | `/workspace/:slug/teams` | StubAuthGuard | Create team |
| GET | `/workspace/:slug/teams` | StubAuthGuard | List teams |

Auth resolves `personId` via `coreknot_user` identifier or artist membership (same pattern as `ProfileService`).

### Auto-provision hooks

| Trigger | Behavior |
|---------|----------|
| `ProfileService.ensureProfileStub` | `WorkspaceProvisionService.ensurePersonalWorkspace` |
| `ProfileService.getMyProfile` | Lazy ensure personal workspace |
| `GET /workspace/me` | Auto-create if missing + `workspace_created` activity |

### Identity link

Workspace `settings` stores:

```json
{
  "tscIdentitySlug": "rahul",
  "tscIdentityNamespace": "fan"
}
```

Backfilled from `PersonProfile.slug` (fan) or linked `Artist.slug` (artist). MANAGES relationship graph used for manager→artist context in future sprints; Sprint 1 stores identity metadata only.

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `components/workspace/WorkspaceLayout.jsx` | Shell for `/workspace/*` |
| `pages/workspace/WorkspaceDashboardPage.jsx` | Dashboard + Tasks/Calendar/Events stubs |
| `pages/workspace/WorkspaceSettingsPage.jsx` | Name edit, members list, invite stub |
| `pages/workspace/TeamListPage.jsx` | Team list + create |
| `lib/workspaceApi.js` | API client + mock fallback |
| `pages/workspace/INTEGRATION.patch.md` | App.jsx merge steps |

Routes: `/workspace`, `/workspace/:slug`, `/workspace/:slug/settings`, `/workspace/:slug/teams`.

---

## Merge steps

1. Run `pnpm db:generate` after schema merge.
2. Merge `INTEGRATION.patch.md` routes into CoreKnot `App.jsx`.
3. Proxy `/api/workspace/*` to `@tsc/api` (Vite / CoreKnot server).
4. Optional nav: `{ label: 'Workspace', path: '/workspace', ... }` in `foundationNav.cjs`.

---

## Deferred to Sprint 2+

| Feature | Sprint |
|---------|--------|
| Projects | Sprint 2 |
| Tasks / Kanban | Sprint 2 |
| Calendar | Sprint 2 |
| Events workspace pipeline | Sprint 3 |
| Goals | Sprint 3+ |
| Documents | Sprint 3+ |
| Contacts | Sprint 3+ |
| Workspace AI / Copilot | Sprint 4+ |
| Templates | Sprint 4+ |
| Email invite flow | Sprint 2 |
| Ownership transfer | Sprint 2+ |
| MANAGES-driven manager workspaces | Sprint 2 |

---

## Files created / modified

**Created:** phase12-sprint1.prisma, workspace packages/module/UI/report  
**Modified:** schema.prisma (Person + workspace models), database/types/contracts index, activity.ts, app.module.ts, profile.module.ts, profile.service.ts, api package.json
