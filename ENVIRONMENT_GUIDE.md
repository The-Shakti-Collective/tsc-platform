# Environment Guide

How TSC Platform separates **local**, **staging**, and **production** configuration. Never commit `.env`, `.env.local`, or secret values.

## Quick start (local)

```powershell
# 1. Copy template
Copy-Item .env.example .env

# 2. Sync to apps (or run full setup)
.\scripts\setup.ps1

# 3. Edit .env — DATABASE_URL required; Clerk keys optional with stub auth
pnpm start
```

| App | Port | Env file read |
|-----|------|---------------|
| API (`apps/api`) | 4000 | Root `.env` (Nest loads from cwd) |
| Community (`apps/community`) | 3000 | `apps/community/.env.local` |
| CoreKnot (`apps/coreknot/client`) | 3001 | `apps/coreknot/client/.env.local` |
| Website (`apps/website`) | 3002 | `apps/website/.env.local` |

**Source templates:** `.env.example` (monorepo root) plus per-app `.env.example` in each app directory.

---

## Environment matrix

| Concern | Local | Staging | Production |
|---------|-------|---------|------------|
| `NODE_ENV` | `development` | `production` | `production` |
| `TSC_AUTH_STUB` | `true` (or auto via placeholder keys) | `false` | **`false` — required** |
| `NEXT_PUBLIC_AUTH_STUB` | `true` | unset / `false` | unset / `false` |
| `DATABASE_URL` | Docker Postgres or Neon dev branch | Neon staging | Neon production |
| `REDIS_URL` | Docker Redis, Upstash dev, or empty (stub queues) | Upstash staging | Upstash production |
| Clerk keys | Placeholder OK with stub | Clerk staging app | Clerk production app |
| `CORS_ORIGIN` / `CORS_ORIGINS` | `localhost:3000-3002` | Staging subdomains | `*.theshakticollective.in` |
| PostHog | Optional / dev project | Staging project | Production project |
| Sentry | Optional | Staging DSN | Production DSN |
| Typesense, R2 | Optional locally | Staging instances | Production instances |

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
| Frontends `ClerkProvider` | Omitted in stub mode — no invalid placeholder keys |

**API stub protocol:**

1. `Authorization: Bearer stub:<clerkUserId>`
2. `Authorization: Bearer <opaque-id>` (no dots)
3. Header `X-Stub-User-Id: <id>`
4. Fallback: `TSC_STUB_USER_ID` or `stub-dev-user`

Stub is **disabled in production** even if `TSC_AUTH_STUB=true` is set by mistake.

### Clerk (staging + production)

| Variable | Platform |
|----------|----------|
| `CLERK_SECRET_KEY` | API (Railway), Next.js server |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Community, Website |
| `VITE_CLERK_PUBLISHABLE_KEY` | CoreKnot client |
| `CLERK_WEBHOOK_SECRET` | API webhooks (prod) |
| `TSC_ADMIN_USER_IDS` | API — comma-separated Clerk user IDs with admin role |

One Clerk application shared across all apps. See [FOUNDER-TASKS.md](.specify/agents/execution/FOUNDER-TASKS.md) Step 2.

---

## Variable reference by deploy target

### Local (`.env` + synced `.env.local`)

| Variable | Required | Notes |
|----------|----------|-------|
| `DATABASE_URL` | Yes | Postgres connection string |
| `CORS_ORIGIN` | Recommended | All frontend origins |
| `TSC_AUTH_STUB` | No | `true` for dev without Clerk |
| `CLERK_*` | No (with stub) | Real keys enable full SSO |
| `REDIS_URL` | No | Empty = API stub queue mode |

### Staging (Railway + Vercel preview)

Set on platform dashboards — do not copy prod secrets.

| Variable | Where |
|----------|-------|
| `DATABASE_URL` | Railway (Neon staging branch) |
| `REDIS_URL` | Railway (Upstash staging) |
| `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | Railway |
| `NEXT_PUBLIC_CLERK_*`, `NEXT_PUBLIC_API_URL` | Vercel (Community, Website) |
| `VITE_*` | Vercel / build env (CoreKnot) |
| `TSC_AUTH_STUB=false` | Railway + Vercel |
| `SENTRY_DSN`, `POSTHOG_*` | Optional per environment |

### Production (Railway + Vercel + Cloudflare)

| Variable | Platform | Secret? |
|----------|----------|---------|
| `DATABASE_URL` | Railway | Yes |
| `REDIS_URL` | Railway | Yes |
| `CLERK_SECRET_KEY`, `CLERK_WEBHOOK_SECRET` | Railway | Yes |
| `TYPESENSE_*` | Railway | API key yes |
| `R2_*` | Railway | Keys yes |
| `SENTRY_DSN` | Railway + Vercel | Yes |
| `NEXT_PUBLIC_SENTRY_DSN` | Vercel | No (client DSN) |
| `NEXT_PUBLIC_API_URL` | Vercel | No — `https://api.theshakticollective.in/api` |
| CI tokens (`RAILWAY_TOKEN`, `VERCEL_*`, `SENTRY_AUTH_TOKEN`) | GitHub Actions | Yes |

Production runbook: [.specify/operations/setup-runbook.md](.specify/operations/setup-runbook.md)  
Detailed var catalog: `.specify/infrastructure/env-vars.md`

---

## Sync workflow

```
.env.example  →  .env (gitignored)  →  apps/*/.env.local (gitignored)
                      ↑
              scripts/setup.ps1
```

`setup.ps1` copies root `.env` to:

- `apps/community/.env.local`
- `apps/website/.env.local`
- `apps/coreknot/client/.env.local`

API reads from repo root when started via `pnpm dev:api` or monorepo scripts.

---

## Per-app `.env.example` files

| Path | Scope |
|------|-------|
| `.env.example` | Full monorepo template |
| `apps/api/.env.example` | NestJS API only |
| `apps/community/.env.example` | Next.js Community |
| `apps/website/.env.example` | Next.js marketing site |
| `apps/coreknot/client/.env.example` | Vite CoreKnot client |

Shared packages under `packages/` do not need `.env.example` — they inherit `DATABASE_URL` / `TSC_PUBLIC_URL` from the app that imports them.

---

## Switching local → Clerk

1. Create Clerk application at [dashboard.clerk.com](https://dashboard.clerk.com)
2. Copy `pk_test_*` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `VITE_CLERK_PUBLISHABLE_KEY`
3. Copy `sk_test_*` → `CLERK_SECRET_KEY`
4. Set `TSC_AUTH_STUB=false`, `NEXT_PUBLIC_AUTH_STUB=false`
5. Re-run `.\scripts\setup.ps1` to sync frontends
6. Verify: sign in on Community → API calls include `Authorization: Bearer <jwt>`

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
