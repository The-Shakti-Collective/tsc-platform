# CoreKnot Phase 6.5 Sprint 4 — Collaboration Marketplace routes

Merge into `App.jsx`:

```jsx
import CollaborationMarketplacePage from './pages/collaboration/CollaborationMarketplacePage';
import CollaborationDetailPage from './pages/collaboration/CollaborationDetailPage';
import PostCollaborationPage from './pages/collaboration/PostCollaborationPage';
import MyCollaborationsPage from './pages/collaboration/MyCollaborationsPage';
import MyCollaborationApplicationsPage from './pages/collaboration/MyCollaborationApplicationsPage';

<Route path="/collaborations" element={<CollaborationMarketplacePage />} />
<Route path="/collaborations/new" element={<PostCollaborationPage />} />
<Route path="/collaborations/me/created" element={<MyCollaborationsPage />} />
<Route path="/collaborations/me/applications" element={<MyCollaborationApplicationsPage />} />
<Route path="/collaborations/:collaborationId" element={<CollaborationDetailPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Find Collaborators', path: '/collaborations', roles: ['artist', 'manager', 'admin'] },
```

Optional feed link in `ActivityFeedPage.jsx` header:

```jsx
<Link to="/collaborations" className="text-xs text-[var(--color-brand-primary)]">
  Find collaborators →
</Link>
```

Artist workspace already links to `/collaborations` and `/collaborations/new` via `ArtistWorkspacePage.jsx`.

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/collaborations`
- `/api/collaborations/*`

Ensure `me/created` and `me/applications` routes are registered before `:id` on the API (already ordered in controller).
