# CoreKnot — Sentry alert playbook

## Projects

Create separate Sentry projects (recommended):

| App | DSN env | Platform |
|-----|---------|----------|
| coreknot-api | `SENTRY_DSN` | Railway / Render |
| coreknot-web | `VITE_SENTRY_DSN` | Vercel |

## Release tracking

Set matching release strings on deploy:

```env
SENTRY_RELEASE=coreknot@1.0.7
VITE_SENTRY_RELEASE=coreknot@1.0.7
```

Wire CI source map upload when Vite build runs on Vercel (optional `SENTRY_AUTH_TOKEN`).

## Suggested alerts

1. **New issue** — any unhandled exception in production.
2. **Spike** — issue count > 10× baseline in 1h.
3. **Regression** — issue reappears after `resolved` within same release.

## Noise to ignore (optional inbound filters)

- Browser extension errors
- `ResizeObserver loop` (client)
- CORS preflight failures from unknown origins

## Verify after deploy

1. Trigger test error in staging (dev route or manual `captureException`).
2. Confirm issue appears in Sentry with correct environment + release.
3. Confirm user context after login (`setSentryUser` in AuthContext).
