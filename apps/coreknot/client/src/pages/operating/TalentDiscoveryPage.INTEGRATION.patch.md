# Talent Discovery — CoreKnot router integration (Phase 9 Step 6)

## App.jsx (or routes file)

```jsx
import TalentDiscoveryPage from './pages/operating/TalentDiscoveryPage';

<Route path="/operating/talent-discovery" element={<TalentDiscoveryPage />} />
<Route path="/operating/analytics/talent-discovery" element={<TalentDiscoveryPage />} />
```

## ExecutiveCommandCenterPage.jsx

Add link in header or audience section:

```jsx
<Link
  to="/operating/talent-discovery"
  className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
>
  Talent Discovery →
</Link>
```

## API proxy

Ensure `/api/agents/talent-discovery/*` proxies to `@tsc/api`.

## Endpoints

| Method | Route |
|--------|-------|
| POST | `/api/agents/talent-discovery/run` |
| GET | `/api/agents/talent-discovery/alerts` |
| POST | `/api/agents/talent-discovery/alerts/:id/acknowledge` |
| GET | `/api/agents/talent-discovery/emerging-cities` |
| GET | `/api/agents/talent-discovery/fast-growing-artists` |
