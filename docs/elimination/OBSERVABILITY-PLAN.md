# Observability Plan (Agent 13)

> **Date:** 2026-06-15  
> **CoreKnot detail:** [../coreknot-observability-setup.md](../coreknot-observability-setup.md)

## Before state

| Surface | Sentry | PostHog | BetterStack | Logs/metrics |
|---------|--------|---------|-------------|--------------|
| Platform API (`apps/api`) | Env vars only; no SDK init in observability module | `POSTHOG_*` in `.env.example` | `BetterstackHeartbeatService` scaffold | Nest Logger default |
| TSC Community | Not wired in scope | Not wired | — | — |
| TSC Website | Not wired | Not wired | — | — |
| CoreKnot client | `lib/sentry.js`, `lib/posthog.js` | Wired | Dashboard links | — |
| CoreKnot server | `utils/sentry.js` | Server-side optional | Heartbeat on prod | Express default |

**Gap:** Platform API observability module only implements BetterStack heartbeat — Sentry/PostHog server capture not in `apps/api/src/observability/`.

## After state

| Action | Result |
|--------|--------|
| `apps/api/src/observability/README.md` | Documents env contract + planned P1 SDK wiring |
| `.env.platform.example` | Added `BETTERSTACK_HEARTBEAT_URL` for parity |
| `docs/elimination/OBSERVABILITY-PLAN.md` | This unified plan |

## Target observability stack

| Tool | Platform API | Frontends | CoreKnot |
|------|--------------|-----------|----------|
| **Sentry** | `SENTRY_DSN` on Railway | `NEXT_PUBLIC_SENTRY_DSN` (P2) | Wired |
| **PostHog** | Server capture via `POSTHOG_PROJECT_TOKEN` (P1) | `NEXT_PUBLIC_POSTHOG_KEY` (P2) | Wired client |
| **BetterStack** | Heartbeat URL on API | Uptime monitors on public URLs | Wired server |
| **Structured logs** | JSON logger + Railway log drain (P2) | Vercel logs | Railway logs |

## Platform API scaffold (current)

```
apps/api/src/observability/
├── observability.module.ts      # Global module
├── betterstack-heartbeat.service.ts  # GET ping every 60s when URL set
└── README.md                    # Env + roadmap
```

Registered in `app.module.ts` — no-op when env unset.

## Env variables (certified names)

| Variable | Service | Required prod |
|----------|---------|---------------|
| `SENTRY_DSN` | API, CoreKnot server | Recommended |
| `SENTRY_TRACES_SAMPLE_RATE` | API | Optional (0.1 default in example) |
| `POSTHOG_PROJECT_TOKEN` / `POSTHOG_API_KEY` | API server events | P1 |
| `POSTHOG_HOST` | API | Default `https://us.i.posthog.com` |
| `BETTERSTACK_HEARTBEAT_URL` | API, CoreKnot API | Optional until founder Step 8 |
| `VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY` | CoreKnot client | Recommended |
| `NEXT_PUBLIC_POSTHOG_KEY` | Community/Website | P2 |

## Implementation phases

### P0 (done — scaffold)

- [x] BetterStack heartbeat service (Platform API)
- [x] Env templates document all keys
- [x] CoreKnot client/server instrumentation (prior work)

### P1 (next sprint — Platform)

- [ ] `@sentry/nestjs` in `observability.module.ts`
- [ ] PostHog Node capture for API errors + key business events
- [ ] Founder: create Sentry project `platform-api`, PostHog project "Community"

### P2 (frontends)

- [ ] PostHog + Sentry in Community/Website Next.js layouts
- [ ] Session replay sampling (PostHog)
- [ ] OpenTelemetry export to PostHog logs (optional)

## Verification checklist

```powershell
# Local — heartbeat no-op without URL
pnpm dev:api
# Set BETTERSTACK_HEARTBEAT_URL → logs "BetterStack heartbeat enabled"

# Prod
pnpm sweep:prod
# GET /api/health/ready + BetterStack monitor green
```

## Risk

| Risk | Mitigation |
|------|------------|
| Double-capture if SDK added twice | Single `ObservabilityModule` owner |
| PII in PostHog | Redact in capture middleware; use person IDs not emails |

## Rollback

Remove observability README; revert env example additions — no runtime behavior change.
