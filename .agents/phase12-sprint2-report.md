# Phase 12 Sprint 2 — Projects + Tasks

**Status:** Complete (implementation)  
**Date:** 2026-06-12

## Summary

Sprint 2 ships **workspace-scoped Projects and Tasks** — schema, API modules, CoreKnot UI (list, detail, kanban board, task drawer), package stubs, and activity events. Builds on Sprint 1 Workspace shell.

**Out of scope (deferred):** Calendar UI, Events pipeline, Goals, Documents, Contacts, Workspace AI, Templates, email invite, ownership transfer, Opportunity/Event FK links (metadata-only stub).

---

## Schema

Fragment: `packages/database/prisma/phase12-sprint2.prisma`  
Merged into `packages/database/prisma/schema.prisma`:

| Model / enum | Purpose |
|--------------|---------|
| `Project` | workspaceId, slug, name, type, status, budget, timeline, metadata |
| `ProjectMember` | projectId + personId composite PK, role |
| `Task` | workspace-scoped, optional projectId, status, priority, dueAt |
| `TaskAssignee` | taskId + personId |
| `TaskComment` | author, body |
| `TaskChecklist` | title, isDone, order |
| `ProjectType` | album, tour, festival, community_campaign, brand_campaign, music_video, general |
| `ProjectStatus` | planning, active, on_hold, completed, archived |
| `TaskStatus` | todo, in_progress, blocked, done |
| `TaskPriority` | low, medium, high, urgent |

`Person` extended: `projectMembers`, `createdTasks`, `taskAssignees`, `taskComments`.  
`Workspace` extended: `projects`, `tasks`.

Activity actions added: `project_created`, `task_created`, `task_completed`.

---

## Packages

| Package | Files |
|---------|-------|
| `@tsc/database` | `src/project.ts`, `src/task.ts` |
| `@tsc/types` | `src/project.ts`, `src/task.ts` |
| `@tsc/contracts` | `src/project/index.ts`, `src/task/index.ts` |
| `@tsc/projects` | `packages/projects/` — re-exports + route helpers |
| `@tsc/tasks` | `packages/tasks/` — re-exports + route helpers |

---

## API

### Project (`apps/api/src/modules/project`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/workspace/:slug/projects` | StubAuthGuard | List projects |
| POST | `/workspace/:slug/projects` | StubAuthGuard | Create project (+ owner member) |
| GET | `/workspace/:slug/projects/:projectSlug` | StubAuthGuard | Project detail |
| PATCH | `/workspace/:slug/projects/:projectSlug` | StubAuthGuard | Update project |
| DELETE | `/workspace/:slug/projects/:projectSlug` | StubAuthGuard | Delete project |
| GET | `/workspace/:slug/projects/:projectSlug/members` | StubAuthGuard | List members |
| POST | `/workspace/:slug/projects/:projectSlug/members` | StubAuthGuard | Add member + WORKED_WITH stub |

### Task (`apps/api/src/modules/task`)

| Method | Route | Auth | Purpose |
|--------|-------|------|---------|
| GET | `/workspace/:slug/tasks` | StubAuthGuard | List or board (`?view=board`, filter project/status/assignee) |
| POST | `/workspace/:slug/tasks` | StubAuthGuard | Create task |
| GET | `/workspace/:slug/tasks/:taskId` | StubAuthGuard | Task detail |
| PATCH | `/workspace/:slug/tasks/:taskId` | StubAuthGuard | Update task (+ assignees) |
| DELETE | `/workspace/:slug/tasks/:taskId` | StubAuthGuard | Delete task |
| POST | `/workspace/:slug/tasks/:taskId/comments` | StubAuthGuard | Add comment |
| POST | `/workspace/:slug/tasks/:taskId/checklist` | StubAuthGuard | Add checklist item |
| PATCH | `/workspace/:slug/tasks/:taskId/checklist/:itemId` | StubAuthGuard | Toggle/edit checklist item |

Shared access via `WorkspaceContextService` (member read, admin write for projects).

---

## CoreKnot UI

| File | Purpose |
|------|---------|
| `pages/workspace/ProjectListPage.jsx` | Project grid + create |
| `pages/workspace/ProjectDetailPage.jsx` | Status, members, link to tasks |
| `pages/workspace/TaskBoardPage.jsx` | Kanban by status |
| `components/workspace/TaskDetailDrawer.jsx` | Comments, checklist, assignees |
| `lib/projectApi.js` | API client + mocks |
| `lib/taskApi.js` | API client + mocks |
| `components/workspace/WorkspaceLayout.jsx` | Nav: Projects, Tasks |
| `pages/workspace/WorkspaceDashboardPage.jsx` | Links to projects/tasks |
| `pages/workspace/INTEGRATION.patch.md` | App.jsx merge steps |

---

## Merge steps

1. Run `pnpm install` (new `@tsc/projects`, `@tsc/tasks` workspace packages).
2. Run `pnpm db:generate` after schema merge.
3. Register `ProjectModule`, `TaskModule` in `app.module.ts` (done).
4. Merge `INTEGRATION.patch.md` routes into CoreKnot `App.jsx`.
5. Proxy `/api/workspace/*` to `@tsc/api`.

---

## Deferred to Sprint 3+

| Feature | Sprint |
|---------|--------|
| Calendar UI | Sprint 3 |
| Events workspace pipeline | Sprint 3 |
| Goals | Sprint 3+ |
| Documents | Sprint 3+ |
| Contacts | Sprint 3+ |
| Workspace AI / Copilot | Sprint 4+ |
| Templates | Sprint 4+ |
| Email invite flow | Sprint 2+ (still deferred) |
| Ownership transfer | Sprint 2+ |
| MANAGES-driven manager workspaces | Sprint 2+ |
| Opportunity/Event hard links on tasks | Sprint 3+ |

---

## Files created / modified

**Created:** phase12-sprint2.prisma, project/task packages/modules/UI/report  
**Modified:** schema.prisma, database/types/contracts/activity indexes, app.module.ts, api package.json, WorkspaceLayout, WorkspaceDashboardPage, WorkspaceModule (WorkspaceContextService), INTEGRATION.patch.md
