# CoreKnot — monitoring & alerts

## Health endpoints

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /api/health/live` | Liveness | 200 always when process up |
| `GET /api/health/ready` | Readiness | 200 when Postgres (and Mongo if required) healthy; 503 when degraded |
| `GET /api/health` | Combined status | 200 + `ready` in JSON body |

Configure platform health checks on `/api/health` (Render/Railway) or `/api/health/ready` for stricter probes.

## Uptime (BetterStack)

**Heartbeat (in-process):**

1. Create heartbeat in [BetterStack Uptime](https://betterstack.com/uptime).
2. Set `BETTERSTACK_HEARTBEAT_URL` on **coreknot-api** service (web only, not worker).
3. Server pings every 60s when URL is set (`utils/betterstackHeartbeat.js`).

**HTTP monitor (alternative):** monitor `GET /api/health/ready` externally — no env var required. See [coreknot-observability-setup.md](../../docs/coreknot-observability-setup.md).


## Error tracking (Sentry)

- **API:** `SENTRY_DSN`, `SENTRY_ENVIRONMENT=production`, optional `SENTRY_RELEASE=coreknot@x.y.z`
- **Client:** `VITE_SENTRY_DSN` on Vercel

Alert on new issues + regression in release after deploy. Details: [SENTRY_ALERTS.md](./SENTRY_ALERTS.md).

## Product analytics (PostHog)

- **Client:** `VITE_POSTHOG_KEY`, `VITE_POSTHOG_HOST=https://us.i.posthog.com`
- SPA `$pageview` on React Router changes via `PosthogRouteTracker`; user identify on login in `AuthContext`
- Project: Community or dedicated CoreKnot project in PostHog org

Setup: [coreknot-observability-setup.md](../../docs/coreknot-observability-setup.md).

## Mail worker

Monitor worker logs for:

- `Worker bootstrap failed`
- `Campaign resume skipped`
- BullMQ connection errors (check `REDIS_URL`)

## Admin system health

Authenticated admins: `GET /api/admin/system-health` — internal probe report.

## Keep-warm (Render free tier)

Cron in `render.yaml` pings `/api/health` every 14 minutes. Prefer paid tier or Railway for production.
