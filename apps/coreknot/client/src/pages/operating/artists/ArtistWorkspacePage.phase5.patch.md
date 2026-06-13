# Phase 5 integration patches (apply when full client tree present)

## App.jsx

Lazy import after OperatingDashboardPage:

```javascript
const ExecutiveCommandCenterPage = lazyWithRetry(() => import('./pages/operating/ExecutiveCommandCenterPage'));
```

Routes under `PageRoute page="dashboard"`:

```javascript
<Route path="/operating/command-center" element={<ExecutiveCommandCenterPage />} />
<Route path="/dashboard/intelligence" element={<ExecutiveCommandCenterPage />} />
```

## OperatingDashboardPage.jsx

Add `Link` import from react-router-dom. Replace header block with flex row + link:

```jsx
<Link to="/operating/command-center" className="text-sm px-4 py-2 rounded-lg border border-[var(--color-bg-border)] text-[var(--color-brand-primary)] hover:bg-[var(--token-surface-2)] shrink-0">
  Command Center →
</Link>
```

## ArtistWorkspacePage.jsx

Imports:

```javascript
import ArtistHealthPanel from '../../../components/intelligence/ArtistHealthPanel';
import OpportunityIntelligencePanel from '../../../components/intelligence/OpportunityIntelligencePanel';
import EcosystemGraphView from '../../../components/intelligence/EcosystemGraphView';
```

After overview section, before ArtistIndustryPanel:

```jsx
<ArtistHealthPanel artistId={artistId} />
<ArtistIndustryPanel artistId={artistId} />
<EcosystemGraphView artistId={artistId} />
<OpportunityIntelligencePanel compact />
```

## navPageAccess.js

NAV_PATH_ACCESS:

```javascript
'/operating/command-center': 'dashboard',
'/dashboard/intelligence': 'dashboard',
```

NAV_PATH_PREFIXES (after operating/dashboard):

```javascript
['/operating/command-center', 'dashboard'],
['/dashboard/intelligence', 'dashboard'],
```

## OutletSidebar.jsx

PAGE_CONFIG:

```javascript
'/operating/command-center': { icon: Brain, label: 'Command Center', accessKey: 'dashboard' },
```

Import `Brain` from lucide-react.

NAV_ICON_TONES:

```javascript
'/operating/command-center': { chip: 'rgba(244, 114, 182, 0.16)', icon: '#f472b6' },
```
