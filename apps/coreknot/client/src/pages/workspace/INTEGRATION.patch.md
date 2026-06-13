# CoreKnot Phase 12 Sprint 2 — Projects + Tasks routes

Merge into `App.jsx`:

```jsx
import { Outlet } from 'react-router-dom';
import WorkspaceLayout from './components/workspace/WorkspaceLayout';
import WorkspaceDashboardPage from './pages/workspace/WorkspaceDashboardPage';
import WorkspaceSettingsPage from './pages/workspace/WorkspaceSettingsPage';
import TeamListPage from './pages/workspace/TeamListPage';
import ProjectListPage from './pages/workspace/ProjectListPage';
import ProjectDetailPage from './pages/workspace/ProjectDetailPage';
import TaskBoardPage from './pages/workspace/TaskBoardPage';

<Route path="/workspace" element={<WorkspaceLayout />}>
  <Route index element={<WorkspaceDashboardPage />} />
  <Route path=":slug" element={<WorkspaceDashboardPage />} />
  <Route path=":slug/settings" element={<WorkspaceSettingsPage />} />
  <Route path=":slug/teams" element={<TeamListPage />} />
  <Route path=":slug/projects" element={<ProjectListPage />} />
  <Route path=":slug/projects/:projectSlug" element={<ProjectDetailPage />} />
  <Route path=":slug/tasks" element={<TaskBoardPage />} />
</Route>
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Workspace', path: '/workspace', roles: ['artist', 'manager', 'admin', 'community_leader'] },
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/workspace` and `/api/workspace/*` (includes `/projects` and `/tasks` sub-routes)

Activity events: `project_created`, `task_created`, `task_completed` (+ Sprint 1 `workspace_created`, `workspace_member_added`).

Relationship stub: `WORKED_WITH` between actor and new project member (optional, ignores duplicates).

Task metadata may reference ecosystem `Opportunity` / `Event` IDs — no hard FK in Sprint 2.

**Deferred Sprint 3+:** Calendar UI, Events workspace pipeline, Goals, Documents, Contacts, Workspace AI, Templates, email invite flow, ownership transfer, MANAGES-driven manager workspaces.
