# Audience OS — CoreKnot router integration (Phase 8 Step 9)

## App.jsx (or routes file)

```jsx
import ArtistAudienceOSPage from './pages/audience-os/ArtistAudienceOSPage';
import CommunityAudienceOSPage from './pages/audience-os/CommunityAudienceOSPage';

<Route path="/operating/artists/:artistId/audience-os" element={<ArtistAudienceOSPage />} />
<Route path="/operating/communities/:communityId/audience-os" element={<CommunityAudienceOSPage />} />
```

## ArtistWorkspacePage.jsx

Add link in header or Fan Intelligence section:

```jsx
<Link
  to={`/operating/artists/${artistId}/audience-os`}
  className="text-xs px-3 py-1.5 rounded-md border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
>
  Audience OS →
</Link>
```

## CommunityDashboardPage.jsx

Add link near CommunityAudiencePanel:

```jsx
<Link
  to={`/operating/communities/${communityId}/audience-os`}
  className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)]"
>
  Audience OS →
</Link>
```

## API proxy

Ensure `/api/audience-os/*` proxies to `@tsc/api` (same as `/api/audience/*`).
