# Career OS — CoreKnot router integration (Phase 9 Step 2)

## App.jsx (or routes file)

```jsx
import CareerOSPage from './pages/career/CareerOSPage';

<Route path="/operating/artists/:artistId/career-os" element={<CareerOSPage />} />
```

## ArtistWorkspacePage.jsx

Add link in header actions (alongside Audience OS):

```jsx
<Link
  to={`/operating/artists/${artistId}/career-os`}
  className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
>
  Career OS →
</Link>
```

## API proxy

Ensure `/api/agents/career/*` proxies to `@tsc/api` (same as `/api/agents/opportunity/*`).

## Endpoints

| Method | Route |
|--------|-------|
| POST | `/api/agents/career/run/:artistId` |
| GET | `/api/agents/career/actions/:artistId` |
| POST | `/api/agents/career/actions/:id/dismiss` |
| GET | `/api/agents/career/dashboard/:artistId` |
