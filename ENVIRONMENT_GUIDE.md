# Environment Guide



How TSC Platform separates **local**, **staging**, and **production** configuration. Never commit `.env`, `.env.local`, or secret values.



## Quick start (local)



```powershell

# First-time: create all env files from per-app templates (never overwrites existing)

.\scripts\setup.ps1



# Or manually:

Copy-Item .env.example .env

Copy-Item apps\api\.env.example apps\api\.env

Copy-Item apps\community\.env.example apps\community\.env.local

Copy-Item apps\website\.env.example apps\website\.env.local

Copy-Item apps\coreknot\client\.env.example apps\coreknot\client\.env.local

Copy-Item apps\coreknot\server\.env.example apps\coreknot\server\.env



pnpm start

```



On macOS/Linux: `./scripts/setup.sh` (same behavior).



---



## Env file matrix



| App | Role | Template | Local secret file | Port |

|-----|------|----------|-------------------|------|

| Monorepo root | Shared Postgres/Redis + dev tooling | `.env.example` | `.env` | — |

| `apps/api` | NestJS TSC API (backend) | `apps/api/.env.example` | `apps/api/.env` | 4000 |

| `apps/community` | Next.js Community (frontend + SSR auth) | `apps/community/.env.example` | `apps/community/.env.local` | 3000 |

| `apps/website` | Next.js marketing site | `apps/website/.env.example` | `apps/website/.env.local` | 3002 |

| `apps/coreknot/server` | CoreKnot CRM Express API (backend) | `apps/coreknot/server/.env.example` | `apps/coreknot/server/.env` | 5000 |

| `apps/coreknot/client` | Vite CoreKnot SPA (frontend) | `apps/coreknot/client/.env.example` | `apps/coreknot/client/.env.local` | 3001 |

| `packages/database` | Prisma CLI only | `packages/database/.env.example` | `packages/database/.env` (optional) | — |



**Packages** under `packages/*` (except `@tsc/database` Prisma CLI) do not load their own env files — they inherit `DATABASE_URL` / `TSC_PUBLIC_URL` from the app process that imports them.



### Prefix rules



| Prefix | Where | Exposed to browser? |

|--------|-------|---------------------|

| _(none)_ | Backend `.env` only | No |

| `NEXT_PUBLIC_*` | Next.js apps | Yes |

| `VITE_*` | CoreKnot Vite client | Yes (build-time) |

| `CLERK_SECRET_KEY`, `TSC_AUTH_STUB` | Next.js server + API | No |



---



## Load order and overrides



### Root `.env` (shared infra)



Contains **only** cross-cutting local infrastructure:



- `DATABASE_URL`, `REDIS_URL`

- Dev stack flags: `TSC_SKIP_DOCKER`, `TSC_KILL_PORTS`, `TSC_OPEN_BROWSER`



Does **not** contain Clerk keys, frontend URLs, or app-specific secrets. Each app template holds vars that app actually reads.



### TSC API (`apps/api/.env`)



| Loader | Order | Override rule |

|--------|-------|---------------|

| `scripts/run-api-dev.ps1` | 1. `apps/api/.env` → 2. root `.env` | First file wins per key (only fills unset shell vars) |

| `pnpm dev:api` (direct) | Shell / platform env only | Set vars in shell or use `run-api-dev.ps1` |



Copy `DATABASE_URL` / `REDIS_URL` from root or keep identical defaults in `apps/api/.env.example`.



### Next.js (`apps/community`, `apps/website`)



Next.js reads **only** `apps/<app>/.env.local` (and `.env.development` if present). It does **not** read repo root `.env`.



**No sync** from root on `pnpm start` — edit each app's `.env.local` directly.



### CoreKnot CRM server (`apps/coreknot/server/.env`)



| Loader | Order | Override rule |

|--------|-------|---------------|

| `run-coreknot-server-dev.ps1` | 1. server `.env` → 2. root `.env` | Root `.env` overwrites matching keys |

| `server.js` (dotenv) | server `.env` only | Standalone `pnpm dev:coreknot:server` without script |



For Postgres migration paths, set `DATABASE_URL` in root `.env` (canonical) or uncomment in server `.env`.



### CoreKnot ETL (`pnpm migrate:coreknot:p0`)



Documented in [scripts/migrations/coreknot/README.md](scripts/migrations/coreknot/README.md):



1. `apps/coreknot/server/.env` — fills unset keys (Mongo source)

2. Root `.env` — fills unset keys

3. Root `.env` **overrides** `DATABASE_URL`

4. Server `.env` **overrides** `MONGODB_*`



### Prisma (`packages/database`)



`pnpm db:*` runs Prisma from `packages/database`. Use `packages/database/.env` with same `DATABASE_URL` as root, or export `DATABASE_URL` in shell. `setup.ps1` creates `packages/database/.env` from root on first run.



---



## Founder copy-paste (per app)



```powershell

# From repo root — PowerShell

Copy-Item .env.example .env

Copy-Item apps\api\.env.example apps\api\.env

Copy-Item apps\community\.env.example apps\community\.env.local

Copy-Item apps\website\.env.example apps\website\.env.local

Copy-Item apps\coreknot\client\.env.example apps\coreknot\client\.env.local

Copy-Item apps\coreknot\server\.env.example apps\coreknot\server\.env

Copy-Item packages\database\.env.example packages\database\.env

```



```bash

# macOS / Linux

cp .env.example .env

cp apps/api/.env.example apps/api/.env

cp apps/community/.env.example apps/community/.env.local

cp apps/website/.env.example apps/website/.env.local

cp apps/coreknot/client/.env.example apps/coreknot/client/.env.local

cp apps/coreknot/server/.env.example apps/coreknot/server/.env

cp packages/database/.env.example packages/database/.env

```



Edit secrets in place. Re-run `setup.ps1` only to create **missing** files — it never overwrites existing `.env` / `.env.local`.



---



## CoreKnot dev admin bypass (local only)



One-click admin login on `/login` without Clerk. **Never enabled in production.**



| Layer | File | Variable | Local value |

|-------|------|----------|-------------|

| CRM API | `apps/coreknot/server/.env` | `DEBUG_BYPASS` | `true` |

| CRM API | optional | `DEBUG_BYPASS_TOKEN` | `bypass_token` |

| Vite client | `apps/coreknot/client/.env.local` | `VITE_ENABLE_DEV_BYPASS` | unset (on in dev) or `false` |



Disable UI: `VITE_ENABLE_DEV_BYPASS=false`. Disable API: omit `DEBUG_BYPASS` or set `false`.



---



## Environment matrix



| Concern | Local | Staging | Production |

|---------|-------|---------|------------|

| `NODE_ENV` | `development` | `production` | `production` |

| `TSC_AUTH_STUB` | `true` (API / Next server) | `false` | **`false` — required** |

| `NEXT_PUBLIC_AUTH_STUB` | `true` (Next client) | unset / `false` | unset / `false` |

| `VITE_AUTH_STUB` | optional (CoreKnot) | unset / `false` | unset / `false` |

| `DATABASE_URL` | Docker Postgres or Neon dev | Neon staging | Neon production |

| `REDIS_URL` | Docker Redis or empty | Upstash staging | Upstash production |

| Clerk keys | Per-app `.env` / `.env.local` | Platform dashboards | Platform dashboards |

| `CORS_ORIGIN` | `localhost:3000-3002` | Staging subdomains | `*.theshakticollective.in` |



---



## Auth modes



### Stub (local dev only)



Triggered when **all** of:



- `NODE_ENV !== 'production'`, and

- `TSC_AUTH_STUB=true` **or** `NEXT_PUBLIC_AUTH_STUB=true` **or** Clerk keys unset / contain `REPLACE_ME`



| Layer | Behavior |

|-------|----------|

| API `ClerkAuthGuard` | Delegates to `StubAuthGuard` — no JWT verify |

| Community / Website middleware | Passthrough — no `auth.protect()` |

| Frontends `ClerkProvider` | Omitted in stub mode |



**API stub protocol:**



1. `Authorization: Bearer stub:<clerkUserId>`

2. `Authorization: Bearer <opaque-id>` (no dots)

3. Header `X-Stub-User-Id: <id>`

4. Fallback: `TSC_STUB_USER_ID` or `stub-dev-user`



Stub is **disabled in production** even if `TSC_AUTH_STUB=true` is set by mistake.



### Clerk (staging + production)



| Variable | Platform |

|----------|----------|

| `CLERK_SECRET_KEY` | API `.env`, Next.js `.env.local` (server) |

| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Community, Website `.env.local` |

| `VITE_CLERK_PUBLISHABLE_KEY` | CoreKnot client `.env.local` |

| `CLERK_WEBHOOK_SECRET` | API `.env` (prod) |

| `TSC_ADMIN_USER_IDS` | API `.env` — comma-separated Clerk user IDs |



One Clerk application shared across all apps. See [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) Step 2.



---



## Variable reference by deploy target



### Local backends



| Variable | API | CoreKnot server |

|----------|-----|-----------------|

| `DATABASE_URL` | Yes | Optional (Postgres migration) |

| `REDIS_URL` | Optional | Required for mail campaigns |

| `CLERK_SECRET_KEY` | Yes (prod) | — (legacy JWT) |

| `TSC_AUTH_STUB` | Yes | — |



### Local frontends



| Variable | Community | Website | CoreKnot client |

|----------|-----------|---------|-----------------|

| `NEXT_PUBLIC_*` / `VITE_*` API URL | Yes | Yes | `VITE_TSC_API_URL` |

| Clerk publishable | `NEXT_PUBLIC_CLERK_*` | same | `VITE_CLERK_*` |

| Auth stub flag | `NEXT_PUBLIC_AUTH_STUB` | same | `VITE_AUTH_STUB` |



### Production (Railway + Vercel + Cloudflare)



Set on platform dashboards — do not copy prod secrets into repo.



| Variable | Platform | Secret? |

|----------|----------|---------|

| `DATABASE_URL` | Railway | Yes |

| `REDIS_URL` | Railway | Yes |

| `CLERK_*` | Railway + Vercel | Yes |

| `NEXT_PUBLIC_*` / `VITE_*` | Vercel | Client-safe only |

| `SENTRY_DSN` | Railway + Vercel | Yes (server) |

| `NEXT_PUBLIC_SENTRY_DSN` / `VITE_SENTRY_DSN` | Vercel | Client DSN |



Production runbook: [.specify/operations/setup-runbook.md](.specify/operations/setup-runbook.md)  

Detailed var catalog: `.specify/infrastructure/env-vars.md`



### CoreKnot mail campaigns (founder checklist)



Large sends use BullMQ queue `coreknot.mail` + separate worker. Full steps: [docs/migration/mail-campaign-workers.md](docs/migration/mail-campaign-workers.md).



| Step | Action |

|------|--------|

| 1 | Provision Redis → `REDIS_URL` on web **and** worker |

| 2 | Deploy **coreknot-api** (`RUN_WORKERS=false`) |

| 3 | Deploy **coreknot-worker** (`RUN_WORKERS=true`) |

| 4 | Set `RESEND_API_KEY`, `MONGODB_URI_PROD`, JWT secrets on both |

| 5 | Optional: `MAIL_CAMPAIGN_BATCH_SIZE=100`, `MAIL_CAMPAIGN_SEND_DELAY_MS=150` |



Local: terminal 1 `pnpm dev:coreknot:server`, terminal 2 `pnpm start:coreknot:workers` (requires `REDIS_URL=redis://127.0.0.1:6379` + `pnpm infra:up`).



---



## Setup workflow



```

Per-app .env.example  →  gitignored secret file  →  app runtime

         ↑

  scripts/setup.ps1 (creates missing files only)

```



**Breaking change (2026-06):** `pnpm start` / `start-stack.ps1` no longer copies root `.env` into frontends or `apps/api/.env`. Each app keeps its own file. Existing dev `.env` files are untouched; new clones use `setup.ps1`.



---



## Switching local → Clerk



1. Create Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)

2. Copy `pk_test_*` into each frontend `.env.local` (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`)

3. Copy `sk_test_*` → `CLERK_SECRET_KEY` in API `.env` and Next.js `.env.local`

4. Set `TSC_AUTH_STUB=false`, `NEXT_PUBLIC_AUTH_STUB=false` in each app that uses stub

5. Verify: sign in on Community → API calls include `Authorization: Bearer <jwt>`



---



## Security rules



- Never commit `.env`, `.env.local`, or files containing real keys

- Never set `TSC_AUTH_STUB=true` in staging or production

- Rotate `CLERK_WEBHOOK_SECRET` if exposed

- Use separate Clerk apps (or instances) for staging vs production

- CI secrets live in GitHub Actions — not in repo files



---



## Related docs



- [env-vars.md](.specify/infrastructure/env-vars.md) — full variable catalog

- [03-auth-recovery.md](.specify/agents/execution/03-auth-recovery.md) — `ClerkAuthGuard` and dev stub path

- [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) — Clerk, Railway, Vercel setup

- [CoreKnot server `.env.example`](apps/coreknot/server/.env.example) — CRM/OAuth/backup vars
- [CoreKnot production runbook](docs/coreknot-production-runbook.md) — deploy API, worker, Vercel, DNS
- [CoreKnot observability setup](docs/coreknot-observability-setup.md) — Sentry, PostHog, BetterStack


