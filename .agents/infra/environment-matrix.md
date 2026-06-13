# Environment Variable Matrix

No secret values in this document. See [production-setup-runbook.md §6](../production-setup-runbook.md#6-environment-matrix).

Legend: **S** = store as secret | **P** = public (client-safe) | **—** = not used

---

## URLs by environment

| Service | Dev (local) | Staging | Production |
|---------|-------------|---------|------------|
| tsc-web | `http://localhost:3000` | Vercel preview / `develop` | `https://theshakticollective.in` |
| tsc-community | `http://localhost:3000` | `https://community-staging.theshakticollective.in` | `https://community.theshakticollective.in` |
| tsc-coreknot | `http://localhost:3001` | `https://coreknot-staging.theshakticollective.in` | `https://coreknot.theshakticollective.in` |
| tsc-docs | `http://localhost:3003` | Vercel preview | `https://docs.theshakticollective.in` |
| tsc-api | `http://localhost:4000` | `https://api-staging.theshakticollective.in` | `https://api.theshakticollective.in` |

---

## tsc-api (Railway)

| Variable | Dev | Staging | Prod | Secret |
|----------|-----|---------|------|--------|
| `NODE_ENV` | `development` | `staging` | `production` | — |
| `PORT` | `4000` | Railway injects | Railway injects | — |
| `API_GLOBAL_PREFIX` | `api` | `api` | `api` | — |
| `DATABASE_URL` | local Docker / Neon dev | Neon staging branch | Neon prod branch | **S** |
| `REDIS_URL` | `redis://localhost:6379` | Upstash staging | Upstash prod | **S** |
| `CLERK_SECRET_KEY` | Clerk dev instance | Clerk staging | Clerk prod | **S** |
| `CLERK_WEBHOOK_SECRET` | — | staging webhook | prod webhook | **S** |
| `TYPESENSE_HOST` | local or dev cluster | staging cluster | prod cluster | — |
| `TYPESENSE_API_KEY` | dev key | staging key | prod key | **S** |
| `TYPESENSE_PROTOCOL` | `http` or `https` | `https` | `https` | — |
| `TYPESENSE_PORT` | `8108` or `443` | `443` | `443` | — |
| `R2_ACCESS_KEY_ID` | dev token | staging token | prod token | **S** |
| `R2_SECRET_ACCESS_KEY` | dev token | staging token | prod token | **S** |
| `R2_BUCKET` | `tsc-assets-dev` | `tsc-assets-staging` | `tsc-assets-prod` | — |
| `R2_ENDPOINT` | `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` | same | same | — |
| `R2_PUBLIC_URL` | optional local | staging CDN URL | `https://assets.theshakticollective.in` | — |
| `CORS_ORIGIN` / `CORS_ORIGINS` | `http://localhost:3000,...` | staging subdomains | prod subdomains | — |
| `SENTRY_DSN` | optional | staging DSN | prod DSN | **S** |
| `POSTHOG_PROJECT_TOKEN` | optional | staging key | prod key | **S** |
| `POSTHOG_HOST` | `https://us.i.posthog.com` | same | same | — |

---

## tsc-community (Vercel)

| Variable | Dev | Staging | Prod | Secret |
|----------|-----|---------|------|--------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000/api` | `https://api-staging.theshakticollective.in/api` | `https://api.theshakticollective.in/api` | P |
| `NEXT_PUBLIC_TSC_API_URL` | same as above | same | same | P |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | staging community URL | prod community URL | P |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dev | Clerk staging | Clerk prod | P |
| `CLERK_SECRET_KEY` | Clerk dev | Clerk staging | Clerk prod | **S** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | `/sign-in` | `/sign-in` | `/sign-in` | P |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | `/sign-up` | `/sign-up` | `/sign-up` | P |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | staging | prod | P |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | same | same | P |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | staging | prod | P |
| `SENTRY_AUTH_TOKEN` | — | CI only | CI only | **S** |

---

## tsc-coreknot (Vercel)

| Variable | Dev | Staging | Prod | Secret |
|----------|-----|---------|------|--------|
| `VITE_API_URL` | `http://localhost:4000/api` | staging API | prod API | P |
| `NEXT_PUBLIC_API_URL` | (if Next wrapper) | staging API | prod API | P |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dev | Clerk staging | Clerk prod | P |
| `CLERK_SECRET_KEY` | Clerk dev | Clerk staging | Clerk prod | **S** |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | staging | prod | P |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | staging | prod | P |

---

## tsc-web (Vercel)

| Variable | Dev | Staging | Prod | Secret |
|----------|-----|---------|------|--------|
| `NEXT_PUBLIC_API_URL` | optional | optional | optional | P |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | optional | optional | optional | P |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | staging | prod | P |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | staging | prod | P |

---

## tsc-docs (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.theshakticollective.in` (try-it console) |
| `OPENAPI_SPEC_URL` | `/openapi/tsc-api.openapi.json` |

---

## GitHub Actions (Organization secrets)

| Secret | Used by |
|--------|---------|
| `RAILWAY_TOKEN` | tsc-api deploy |
| `RAILWAY_SERVICE_ID_STAGING` | tsc-api staging |
| `RAILWAY_SERVICE_ID_PROD` | tsc-api prod |
| `VERCEL_TOKEN` | All Vercel frontends |
| `VERCEL_ORG_ID` | All Vercel frontends |
| `VERCEL_PROJECT_ID_WEB` | tsc-web |
| `VERCEL_PROJECT_ID_COMMUNITY` | tsc-community |
| `VERCEL_PROJECT_ID_COREKNOT` | tsc-coreknot |
| `VERCEL_PROJECT_ID_DOCS` | tsc-docs |
| `DATABASE_URL` | CI integration tests |
| `REDIS_URL` | CI integration tests |
| `CLERK_SECRET_KEY` | CI smoke tests |
| `CLERK_PUBLISHABLE_KEY` | CI frontends |
| `TYPESENSE_HOST`, `TYPESENSE_API_KEY` | CI search tests |
| `R2_*` | CI upload tests |
| `CLOUDFLARE_API_TOKEN` | tsc-infra DNS automation (optional) |

---

## Clerk dashboard (per environment)

| Setting | Staging | Production |
|---------|---------|------------|
| Allowed origins | `*.vercel.app`, `community-staging.*`, `coreknot-staging.*` | all prod subdomains |
| Webhook URL | `https://api-staging.theshakticollective.in/api/webhooks/clerk` | `https://api.theshakticollective.in/api/webhooks/clerk` |
| JWT template | TSC API claims (roles from `@tsc/permissions`) | same |
