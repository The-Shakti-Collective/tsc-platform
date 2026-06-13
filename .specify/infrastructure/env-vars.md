# Environment Variables

[← Master index](../MASTER.md)

> Source of truth template: `.env.example` at repo root.  
> **Never commit `.env`** or paste secret values into docs.

---

## Setup Flow

```mermaid
flowchart LR
    EX[".env.example"]
    ENV[".env (gitignored)"]
    COMM["apps/community/.env.local"]
    CK["apps/coreknot/client/.env.local"]
    WEB["apps/website/.env.local"]

    EX -->|"copy on first setup"| ENV
    ENV -->|"setup.ps1 sync"| COMM
    ENV -->|"setup.ps1 sync"| CK
    ENV -->|"setup.ps1 sync"| WEB
```

---

## Database

| Variable | Required | Default / example | Notes |
|----------|----------|-------------------|-------|
| `DATABASE_URL` | **Yes** | `postgresql://postgres:postgres@localhost:5432/tsc_community` | Neon URL for no-Docker dev |

---

## Redis

| Variable | Required | Default / example | Notes |
|----------|----------|-------------------|-------|
| `REDIS_URL` | No | `redis://localhost:6379` | Empty = stub queue mode (BullMQ no-op) |

Upstash example (no secret):

```
rediss://default:YOUR_TOKEN@YOUR-ENDPOINT.upstash.io:6379
```

---

## API (NestJS)

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `PORT` | No | `4000` | Railway injects in prod |
| `API_GLOBAL_PREFIX` | No | `api` | All routes under `/api` |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Comma-separated for `start:all` |
| `NODE_ENV` | No | `development` | Set `production` on Railway |

Production runbook uses `CORS_ORIGINS` (plural) for multi-subdomain — local `.env.example` uses singular `CORS_ORIGIN`.

---

## Clerk (SSO — Community, CoreKnot, Website, API)

Single Clerk application shared across all frontends. API validates `Authorization: Bearer <session JWT>` via `@clerk/backend`.

| Variable | Required | Where | Secret? |
|----------|----------|-------|---------|
| `CLERK_SECRET_KEY` | **Yes** | API (`apps/api`), server-side Next | **Yes** |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **Yes** | Community, Website (Next.js) | No |
| `VITE_CLERK_PUBLISHABLE_KEY` | **Yes** | CoreKnot client (Vite) | No |
| `CLERK_WEBHOOK_SECRET` | Prod | API webhooks | **Yes** |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | No | Community, Website | No |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | No | Community, Website | No |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | No | Community | No |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | No | Community | No |
| `TSC_ADMIN_USER_IDS` | No | API — comma-separated Clerk user IDs with platform admin role | No |

Production multi-domain SSO (optional):

| Variable | Notes |
|----------|-------|
| `NEXT_PUBLIC_CLERK_IS_SATELLITE` | `true` on satellite frontends |
| `NEXT_PUBLIC_CLERK_DOMAIN` | Satellite domain |
| `CLERK_SIGN_IN_URL` | Primary app sign-in URL |

Local dev: set the same publishable key in root `.env`; `setup.ps1` syncs to `apps/community/.env.local`, `apps/website/.env.local`, and `apps/coreknot/client/.env.local`. Also set `VITE_CLERK_PUBLISHABLE_KEY` to the same value as `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`.

---

## Community Frontend

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `NEXT_PUBLIC_API_URL` | No | `http://localhost:4000/api` | Browser → API |
| `NEXT_PUBLIC_TSC_API_URL` | No | `http://localhost:4000/api` | Alias |
| `NEXT_PUBLIC_APP_URL` | No | `http://localhost:3000` | Self-reference for links |

---

## Docker / Dev UX

| Variable | Required | Default | Notes |
|----------|----------|---------|-------|
| `TSC_SKIP_DOCKER` | No | unset | Force skip Docker infra checks |
| `TSC_OPEN_BROWSER` | No | `true` | Open system browser on `start:*` |
| `TSC_KILL_PORTS` | No | `true` | Auto-free 3000-3002, 4000 before start |

---

## Optional Integrations

### CoreKnot sync (legacy)

| Variable | Required | Notes |
|----------|----------|-------|
| `COREKNOT_SYNC_URL` | No | e.g. `http://localhost:3001/api/sync` |
| `COREKNOT_SYNC_SECRET` | No | Shared secret |

### Payment providers (stubs when unset)

| Variable | Required |
|----------|----------|
| `STRIPE_KEY` | No |
| `RAZORPAY_KEY` | No |
| `CASHFREE_KEY` | No |

### Public URLs

| Variable | Required | Notes |
|----------|----------|-------|
| `TSC_PUBLIC_URL` | No | Links in emails / passports |

### PostHog

| Variable | Where | Notes |
|----------|-------|-------|
| `POSTHOG_PROJECT_TOKEN` | API | Server-side events |
| `POSTHOG_HOST` | API | Default `https://us.i.posthog.com` |
| `NEXT_PUBLIC_POSTHOG_KEY` | Frontends | Client capture |
| `NEXT_PUBLIC_POSTHOG_HOST` | Frontends | Default `https://us.i.posthog.com` |

Runbook alias: `POSTHOG_API_KEY` = same project key (`phc_...`).

---

## Production-Only Variables (not in `.env.example`)

From `.agents/production-setup-runbook.md` — set on Railway/Vercel/GitHub secrets:

| Variable | Platform | Secret? |
|----------|----------|---------|
| `CLERK_WEBHOOK_SECRET` | Railway | Yes |
| `TYPESENSE_HOST` | Railway | No |
| `TYPESENSE_API_KEY` | Railway | Yes |
| `TYPESENSE_PROTOCOL` | Railway | No |
| `TYPESENSE_PORT` | Railway | No |
| `R2_ACCESS_KEY_ID` | Railway | Yes |
| `R2_SECRET_ACCESS_KEY` | Railway | Yes |
| `R2_BUCKET` | Railway | No |
| `R2_ENDPOINT` | Railway | No |
| `R2_PUBLIC_URL` | Railway | No |
| `SENTRY_DSN` | Railway + Vercel | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel | No |
| `SENTRY_AUTH_TOKEN` | GitHub CI | Yes |
| `RAILWAY_TOKEN` | GitHub CI | Yes |
| `VERCEL_TOKEN` | GitHub CI | Yes |
| `VERCEL_ORG_ID` | GitHub CI | Yes |
| `VERCEL_PROJECT_ID_*` | GitHub CI | Yes |
| `NODE_AUTH_TOKEN` | tsc-shared publish | Yes |

---

## Environment Matrix by Deploy Target

```mermaid
flowchart TB
    subgraph local["Local .env"]
        L_DB["DATABASE_URL → localhost or Neon"]
        L_REDIS["REDIS_URL → localhost, Upstash, or empty"]
        L_STUB["TSC_AUTH_STUB=true"]
    end

    subgraph staging["Staging (Railway + Vercel)"]
        S_DB["DATABASE_URL → Neon staging"]
        S_REDIS["REDIS_URL → Upstash staging"]
        S_CLERK["Clerk staging keys"]
        S_API["NEXT_PUBLIC_API_URL → api-staging..."]
    end

    subgraph prod["Production"]
        P_DB["DATABASE_URL → Neon prod"]
        P_REDIS["REDIS_URL → Upstash prod"]
        P_CLERK["Clerk prod keys"]
        P_API["NEXT_PUBLIC_API_URL → api.theshakticollective.in"]
    end

    local --> staging
    staging --> prod
```

---

## Required Minimum for Local Dev

| Scenario | Required vars |
|----------|---------------|
| Local dev | `DATABASE_URL`, valid `CLERK_*` keys, `CORS_ORIGIN` with all frontend ports |
| BullMQ jobs | `REDIS_URL` pointing to running Redis |

---

## Related

- [local-dev.md](local-dev.md)
- [production-deploy.md](production-deploy.md)
- [setup-runbook.md](../operations/setup-runbook.md)
