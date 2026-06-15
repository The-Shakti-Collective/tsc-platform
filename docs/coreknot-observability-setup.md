# CoreKnot observability setup

> **Aligned with:** [architecture/DEPLOYMENT-ARCHITECTURE.md](./architecture/DEPLOYMENT-ARCHITECTURE.md) · Shared stack: Sentry, PostHog, BetterStack (Platform + CoreKnot)

Wire error tracking, product analytics, and uptime for CoreKnot API (Express) + Vite client.

## Quick start (local dev)

### Why the dashboard shows “Add keys in .env.local”

The **Analytics & Monitoring** widget on `/dashboard` (admin only) opens external dashboards for **Sentry**, **PostHog**, and **BetterStack**. Tiles still link to useful defaults (Sentry org, PostHog app, BetterStack uptime) even before keys are set. **Datadog is not shown on the widget** — RUM/APM can still be wired via `lib/datadog.js` and server env (see below).

The badge means **client SDK keys are missing** — not that the link is broken:

| Tile | Badge clears when |
|------|-------------------|
| Sentry | `VITE_SENTRY_DSN` or `VITE_SENTRY_ORG_URL` |
| PostHog | `VITE_POSTHOG_KEY`, `VITE_POSTHOG_PROJECT_ID`, or `VITE_POSTHOG_PROJECT_URL` |
| BetterStack | No badge (default uptime URL always works); optional `VITE_BETTERSTACK_DASHBOARD_URL` for a deep link |

Vite reads `VITE_*` only at **dev-server start** or **build** — restart after editing `.env.local`.

### Client — `apps/coreknot/client/.env.local`

Copy from `apps/coreknot/client/.env.example`. Add observability block (names only — paste real values from each provider):

```env
# SDK instrumentation (required for badges to clear + live capture)
VITE_SENTRY_DSN=
VITE_POSTHOG_KEY=
VITE_POSTHOG_HOST=https://us.i.posthog.com

# Dashboard deep-links (optional — public URLs only, never API secrets)
VITE_POSTHOG_PROJECT_ID=
VITE_SENTRY_ORG_URL=
VITE_POSTHOG_PROJECT_URL=
VITE_BETTERSTACK_DASHBOARD_URL=
```

### Server — `apps/coreknot/server/.env`

```env
SENTRY_DSN=
BETTERSTACK_HEARTBEAT_URL=
DD_API_KEY=
```

Optional: `SENTRY_ENVIRONMENT`, `SENTRY_RELEASE`, `SENTRY_TRACES_SAMPLE_RATE`, `DD_SITE`, `DD_ENV`, `DD_SERVICE`.

### Account setup (founder order)

1. **Sentry** — [sentry.io](https://sentry.io) → org **The Shakti Collective** → projects **coreknot-web** (client DSN → `VITE_SENTRY_DSN`) and **coreknot-api** (server DSN → `SENTRY_DSN`). Project Settings → Client Keys (DSN).
2. **PostHog** — [us.posthog.com](https://us.posthog.com) → create **CoreKnot** project → Settings → Project API Key (`phc_…` → `VITE_POSTHOG_KEY`). Project ID is in the URL: `/project/468824` → `VITE_POSTHOG_PROJECT_ID=468824`.
3. **BetterStack** — [BetterStack Uptime](https://betterstack.com/uptime) → **Heartbeats** → copy URL → `BETTERSTACK_HEARTBEAT_URL` on server. Optional: copy your monitors page URL → `VITE_BETTERSTACK_DASHBOARD_URL`.
4. **Datadog** (optional, not on dashboard widget) — RUM via `VITE_DD_*` in `.env.local` + `initDatadogRum()` in `main.jsx`; APM → `DD_API_KEY` on server.

### After setting env

1. Restart Vite: `pnpm --filter coreknot-client dev` (or your usual client dev command).
2. Restart CoreKnot server: `pnpm --filter coreknot-server dev`.
3. Hard-refresh `/dashboard` as admin — Sentry/PostHog badges should clear when keys present; BetterStack never badges on default link.

### Verify checklist

- [ ] Widget footer shows `N/3 instrumented` (not `add VITE_* keys…`)
- [ ] Each tile opens correct dashboard in new tab
- [ ] PostHog Live events show `$pageview` while navigating app
- [ ] Sentry test error appears in **coreknot-web** project
- [ ] `curl http://localhost:5000/api/health` → 200
- [ ] BetterStack heartbeat green ~2 min after server start (when URL set)

---

| Area | Before | After |
|------|--------|-------|
| PostHog client | `posthog-js` missing from init path / duplicate dead `observability.js` | `lib/posthog.js` + `PosthogRouteTracker` SPA `$pageview` |
| PostHog identify | Not wired on login | `setPosthogUser` / `clearPosthogUser` in `AuthContext.jsx` |
| Sentry client | Working via `lib/sentry.js` | Unchanged; dead duplicate removed |
| Sentry server | Working via `utils/sentry.js` | Unchanged |
| BetterStack | Partial (prod-only, no shutdown) | Starts when `BETTERSTACK_HEARTBEAT_URL` set; stops on SIGTERM |
| Docs | Scattered | This file + existing runbooks |

## Overview

| Signal | Tool | Where configured |
|--------|------|------------------|
| Errors (API) | Sentry | Render / Railway env |
| Errors (client) | Sentry | Vercel env |
| Product analytics | PostHog | Vercel env |
| Uptime | BetterStack heartbeat | Render / Railway env |
| APM (optional) | Datadog | Server + client RUM scaffold (`lib/datadog.js`; not on dashboard widget) |

## Environment variables

### Server — `apps/coreknot/server/.env` (Render / Railway)

Copy from `apps/coreknot/server/.env.example`. Observability block:

```env
SENTRY_DSN=https://xxx@xxx.ingest.us.sentry.io/xxx
SENTRY_ENVIRONMENT=production
SENTRY_RELEASE=coreknot@1.0.7
SENTRY_TRACES_SAMPLE_RATE=0.1

BETTERSTACK_HEARTBEAT_URL=https://uptime.betterstack.com/api/v1/heartbeat/xxxxx
```

Optional Datadog: `DD_API_KEY`, `DD_SITE`, `DD_ENV`, `DD_SERVICE`, `DD_VERSION`.

### Client — `apps/coreknot/client/.env.local` (local) / Vercel Dashboard (prod)

Copy from `apps/coreknot/client/.env.example`. Observability block:

```env
VITE_SENTRY_DSN=https://xxx@xxx.ingest.us.sentry.io/xxx
VITE_SENTRY_ENVIRONMENT=production
VITE_SENTRY_RELEASE=coreknot@1.0.7
VITE_SENTRY_TRACES_SAMPLE_RATE=0.1

VITE_POSTHOG_KEY=phc_xxxxxxxx
VITE_POSTHOG_HOST=https://us.i.posthog.com
```

Vite embeds `VITE_*` at **build time** — redeploy client after changing these.

Optional **dashboard deep-links** for the admin **Analytics & Monitoring** widget on `/dashboard` (public URLs only — never API keys):

```env
VITE_SENTRY_ORG_URL=https://sentry.io/organizations/the-shakti-collective/
VITE_POSTHOG_PROJECT_URL=https://us.posthog.com/project/YOUR_PROJECT_ID
VITE_POSTHOG_PROJECT_ID=YOUR_PROJECT_ID
VITE_BETTERSTACK_DASHBOARD_URL=https://uptime.betterstack.com/
```

When unset, the widget still opens all three tools with org defaults. Tiles show **Add keys in .env.local** until SDK keys (or override URLs) are set — except BetterStack, which always uses the public uptime URL.

---

## Founder setup steps

### 1. Sentry

1. [sentry.io](https://sentry.io) → org **The Shakti Collective**.
2. Create two projects:
   - **coreknot-api** → copy DSN → `SENTRY_DSN` on Render/Railway.
   - **coreknot-web** → copy DSN → `VITE_SENTRY_DSN` on Vercel.
3. Set `SENTRY_ENVIRONMENT=production` and matching `SENTRY_RELEASE` / `VITE_SENTRY_RELEASE` (e.g. `coreknot@1.0.7`) per deploy.
4. Optional: `SENTRY_AUTH_TOKEN` in Vercel for source map upload.

Details: [SENTRY_ALERTS.md](../apps/coreknot/docs/SENTRY_ALERTS.md).

### 2. PostHog

1. [PostHog](https://us.posthog.com) → org **The Shakti Collective**.
2. Create a **CoreKnot** project (or reuse **Community** if shared analytics is OK).
3. Project Settings → copy **Project API Key** (`phc_…`).
4. Vercel → Production env:
   - `VITE_POSTHOG_KEY=phc_…`
   - `VITE_POSTHOG_HOST=https://us.i.posthog.com`
5. Redeploy client.

Code path:

- Package: `posthog-js` in `apps/coreknot/client/package.json`
- Init: `initPosthog()` in `main.jsx` → `lib/posthog.js`
- SPA pageviews: `PosthogRouteTracker` in `main.jsx` (inside `BrowserRouter`)
- User identify: `AuthContext.jsx` on session load / logout

### 3. BetterStack

**Option A — Heartbeat (recommended for API process liveness)**

1. [BetterStack Uptime](https://betterstack.com/uptime) → **Heartbeats** → Create.
2. Copy heartbeat URL → `BETTERSTACK_HEARTBEAT_URL` on API service only.
3. Server pings every 60s when URL is set (`utils/betterstackHeartbeat.js`).

**Option B — HTTP monitor (no env var)**

1. BetterStack → **Monitors** → Create HTTP monitor.
2. URL: `https://api.coreknot.in/api/health/ready` (or your Render URL).
3. Interval: 1–3 min; alert on non-200.
4. Complements heartbeat — catches external reachability; heartbeat catches process-up-but-deaf.

---

## Code map

| Component | File |
|-----------|------|
| Client Sentry | `apps/coreknot/client/src/lib/sentry.js` |
| Client PostHog | `apps/coreknot/client/src/lib/posthog.js` |
| SPA pageviews | `apps/coreknot/client/src/components/PosthogRouteTracker.jsx` |
| Client bootstrap | `apps/coreknot/client/src/main.jsx` |
| User context | `apps/coreknot/client/src/contexts/AuthContext.jsx` |
| Admin dashboard links | `apps/coreknot/client/src/components/dashboard/ObservabilityLinksCard.jsx` |
| Link resolution | `apps/coreknot/client/src/lib/observabilityLinks.js` |
| Server Sentry | `apps/coreknot/server/utils/sentry.js` |
| BetterStack | `apps/coreknot/server/utils/betterstackHeartbeat.js` |
| Server bootstrap | `apps/coreknot/server/server.js` |
| Graceful shutdown | `apps/coreknot/server/app/startServer.js` |

All integrations **no-op** when env vars are empty (dev-friendly).

---

## Deploy env cheat sheet

### Render / Railway (API)

| Variable | Required |
|----------|----------|
| `SENTRY_DSN` | Recommended |
| `SENTRY_ENVIRONMENT` | Recommended |
| `SENTRY_RELEASE` | Recommended |
| `BETTERSTACK_HEARTBEAT_URL` | Optional |

### Vercel (client)

| Variable | Required |
|----------|----------|
| `VITE_SENTRY_DSN` | Recommended |
| `VITE_SENTRY_ENVIRONMENT` | Recommended |
| `VITE_SENTRY_RELEASE` | Recommended |
| `VITE_POSTHOG_KEY` | Recommended |
| `VITE_POSTHOG_HOST` | Optional (defaults to `https://us.i.posthog.com`) |

---

## Verification checklist

| Check | How | Pass criteria |
|-------|-----|---------------|
| API health | `curl https://YOUR-API/api/health/ready` | HTTP 200, `"ok": true` |
| API Sentry | Trigger test error on staging route | Issue in **coreknot-api** with env + release |
| Client Sentry | DevTools → throw in console on staging | Issue in **coreknot-web** |
| Sentry user | Log in as real user | Issue/user shows email + id |
| PostHog live | PostHog → Live events while browsing app | `$pageview` on each route change |
| PostHog identify | Log in | Person linked to user id |
| BetterStack heartbeat | Wait ~2 min after deploy | Monitor green |
| BetterStack HTTP | Hit `/api/health/ready` from monitor | 200 OK |
| Local no-op | Dev without env vars | No console errors from observability init |

### Quick local smoke (optional)

```powershell
# Client modules load
cd apps/coreknot/client
pnpm install
node -e "import('./src/lib/posthog.js').then(m => console.log(Object.keys(m)))"

# Server modules load
cd ../server
node -e "const s=require('./utils/sentry'); const b=require('./utils/betterstackHeartbeat'); console.log(typeof s.initSentry, typeof b.startBetterstackHeartbeat)"
```

---

## Related docs

- [MONITORING_ALERTS.md](../apps/coreknot/docs/MONITORING_ALERTS.md)
- [SENTRY_ALERTS.md](../apps/coreknot/docs/SENTRY_ALERTS.md)
- [coreknot-production-runbook.md](./coreknot-production-runbook.md)
