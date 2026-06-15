# Platform API — Observability

> Plan: [docs/elimination/OBSERVABILITY-PLAN.md](../../../../docs/elimination/OBSERVABILITY-PLAN.md)

## Current implementation

| Component | File | Behavior |
|-----------|------|----------|
| BetterStack heartbeat | `betterstack-heartbeat.service.ts` | GET ping every 60s when `BETTERSTACK_HEARTBEAT_URL` set |
| Module | `observability.module.ts` | Global; registered in `app.module.ts` |

All integrations **no-op** when env vars are unset (safe for local dev).

## Environment variables

| Variable | Purpose |
|----------|---------|
| `BETTERSTACK_HEARTBEAT_URL` | Uptime heartbeat (implemented) |
| `SENTRY_DSN` | Error tracking (P1 — wire `@sentry/nestjs`) |
| `SENTRY_TRACES_SAMPLE_RATE` | Performance sampling |
| `POSTHOG_PROJECT_TOKEN` / `POSTHOG_API_KEY` | Server-side product analytics (P1) |
| `POSTHOG_HOST` | Default `https://us.i.posthog.com` |

Templates: `apps/api/.env.example`, `.env.platform.example`.

## P1 roadmap

1. Sentry NestJS integration in this module
2. PostHog server capture for unhandled exceptions + key domain events
3. Structured JSON logging for Railway log drains
