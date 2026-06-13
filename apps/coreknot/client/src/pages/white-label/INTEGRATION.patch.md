# CoreKnot Phase 10.4 — White Label tenant routes

Merge into `App.jsx`:

```jsx
import { useParams } from 'react-router-dom';
import WhiteLabelShell from './components/white-label/WhiteLabelShell';

function TenantRouteShell() {
  const { tenantSlug } = useParams();
  return (
    <WhiteLabelShell tenantSlug={tenantSlug}>
      {/* nested tenant pages */}
      <Outlet />
    </WhiteLabelShell>
  );
}

<Route path="/t/:tenantSlug/*" element={<TenantRouteShell />}>
  <Route index element={<TenantHomePage />} />
  <Route path="artists" element={<TenantArtistsPage />} />
</Route>
```

Proxy (Vite / CoreKnot server): forward to `@tsc/api`:

- `/api/public/v1` and `/api/public/v1/*`
- `/api/admin/api-keys` and `/api/admin/api-keys/*`
- `/api/white-label` and `/api/white-label/*`
- `/api/admin/white-label` and `/api/admin/white-label/*`

Public API requests require header:

```
X-TSC-Api-Key: tsc_...
```

White label config is public (no API key). Agency roster at `/white-label/tenants/:slug/artists`.
