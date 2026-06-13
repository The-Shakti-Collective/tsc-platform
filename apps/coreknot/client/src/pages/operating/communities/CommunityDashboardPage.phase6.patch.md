# Phase 6 Community OS integration patches (apply when full client tree present)

## App.jsx

Lazy imports:

```javascript
const CommunityDashboardPage = lazyWithRetry(() =>
  import('./pages/operating/communities/CommunityDashboardPage'),
);
const CommunityLeaderPortal = lazyWithRetry(() =>
  import('./pages/operating/communities/CommunityLeaderPortal'),
);
```

Routes under `PageRoute page="dashboard"`:

```javascript
<Route path="/operating/communities/:communityId" element={<CommunityDashboardPage />} />
<Route path="/operating/communities/:communityId/leader" element={<CommunityLeaderPortal />} />
```

Optional default route for TSC Underground:

```javascript
<Route path="/operating/communities" element={<Navigate to="/operating/communities/com-tsc-underground" replace />} />
```

## foundationNav.cjs

Add to `OPERATING_V2_PATHS` after Command Center:

```javascript
{ path: '/operating/communities/com-tsc-underground', label: 'TSC Underground', order: 3 },
```

## navPageAccess.js

Merge from `navPageAccess.phase6.js`.

## OutletSidebar.jsx

```javascript
'/operating/communities/com-tsc-underground': { icon: Users, label: 'TSC Underground', accessKey: 'dashboard' },
```

Import `Users` from lucide-react.

## OperatingDashboardPage.jsx

Link to community dashboard:

```jsx
<Link to="/operating/communities/com-tsc-underground" className="text-sm px-4 py-2 rounded-lg border ...">
  TSC Underground →
</Link>
```

## API proxy (CoreKnot server or Vite)

Ensure `/api/communities/*` proxies to `@tsc/api` Nest service (same as `/api/intelligence/*`).

## Example community id

`com-tsc-underground` — matches mock data in `communityApi.js`.
