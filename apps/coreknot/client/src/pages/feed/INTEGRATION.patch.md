# CoreKnot Phase 6.5 Sprint 3 — Activity Feed + Following routes

Merge into `App.jsx`:

```jsx
import ActivityFeedPage from './pages/feed/ActivityFeedPage';

<Route path="/feed" element={<ActivityFeedPage />} />
<Route path="/activity" element={<ActivityFeedPage />} />
```

Optional nav entry in `foundationNav.cjs`:

```js
{ label: 'Ecosystem Feed', path: '/feed', roles: ['artist', 'manager', 'admin'] },
```

Optional dashboard section in `OperatingDashboardPage.jsx`:

```jsx
import { ActivityFeedList } from '../../components/activity/ActivityFeedList';
import { useActivityFeed } from '../../hooks/queries/activity';

function DashboardActivitySection() {
  const feedQuery = useActivityFeed();
  return (
    <section className="rounded-xl border border-[var(--color-bg-border)] p-5">
      <h2 className="text-sm font-semibold mb-3">Recent ecosystem activity</h2>
      <ActivityFeedList query={feedQuery} />
    </section>
  );
}
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/activity/*`
- `/api/profile/follow/*`
- `/api/profile/unfollow/*`
- `/api/profile/me/following/feed`
- `/api/profile/:personId/followers`
- `/api/profile/:personId/following`
- `/api/profile/:personId/follow-status`

Existing profile proxy from Sprint 1 remains for `/api/profile/:slug/*`.

Follow button is wired on `EcosystemPassportPage` via `FollowButton` — no extra route work.
