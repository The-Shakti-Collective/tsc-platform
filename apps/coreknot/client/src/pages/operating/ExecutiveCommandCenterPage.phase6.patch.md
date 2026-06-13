# Phase 6 integration patches — Command Center v2 (Operational)

Apply when full CoreKnot client tree (`App.jsx`, `OutletSidebar.jsx`, `navPageAccess.js`) is present.

## App.jsx

Lazy import:

```javascript
const ExecutiveCommandCenterPage = lazyWithRetry(() => import('./pages/operating/ExecutiveCommandCenterPage'));
```

Routes under `PageRoute page="dashboard"`:

```javascript
<Route path="/operating/command-center" element={<ExecutiveCommandCenterPage />} />
<Route path="/dashboard/intelligence" element={<ExecutiveCommandCenterPage />} />
```

## navPageAccess.js

Merge from `utils/navPageAccess.phase5.js` (or import `utils/navPageAccess.js`):

```javascript
'/operating/command-center': 'dashboard',
'/dashboard/intelligence': 'dashboard',
```

Prefix entries:

```javascript
['/operating/command-center', 'dashboard'],
['/dashboard/intelligence', 'dashboard'],
```

## OutletSidebar.jsx

`PAGE_CONFIG`:

```javascript
'/operating/command-center': { icon: Brain, label: 'Command Center', accessKey: 'dashboard' },
```

Import `Brain` from `lucide-react`.

`NAV_ICON_TONES`:

```javascript
'/operating/command-center': { chip: 'rgba(244, 114, 182, 0.16)', icon: '#f472b6' },
```

## API (@tsc/api)

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/intelligence/command-center?period=weekly\|monthly` | Operational aggregate |
| POST | `/api/intelligence/actions/create-campaign` | City campaign stub |
| POST | `/api/intelligence/actions/invite-artists` | Artist outreach stub |
| POST | `/api/intelligence/actions/launch-opportunity` | Marketplace action stub |
| POST | `/api/intelligence/actions/contact-community` | Community outreach stub |

Client falls back to mock when API unreachable (`_source === 'mock'`).
