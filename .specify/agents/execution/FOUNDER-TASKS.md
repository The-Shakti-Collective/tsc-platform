# Founder Tasks

[← Execution agents](execution-agents.md)

Steps that **require founder secrets, billing, or org admin access**. Agents cannot complete these; unblock P0–P1 execution by finishing each step and recording values in `.env` (local) and provider dashboards (prod).

---

## Checklist

| Step | Provider | Unblocks agents | Status |
|------|----------|-----------------|--------|
| 1 | GitHub org | 12 DevOps, CI history | ☐ |
| 2 | Clerk | 03 Auth, 04 Runtime, 07 Community | ☐ |
| 3 | Cloudflare | 05 DNS, 11 Storage (R2) | ☐ |
| 4 | Railway | 05 DNS/Prod API | ☐ |
| 5 | Vercel | 05 DNS/Prod frontends | ☐ |
| 6 | R2 | 11 Storage | ☐ |
| 7 | Typesense | 10 Search | ☐ |
| 8 | Monitoring | 08 Observability | ☐ |

---

## Step 1 — GitHub organization

**Goal:** `TheShaktiCollective` (or target org) repos, Actions enabled, `gh` CLI authenticated on dev machine.

| Action | Detail |
|--------|--------|
| Create / verify org | Repos: monorepo + future `org-scaffold/` splits |
| Enable Actions | All packages CI workflows must run |
| Install `gh` + `git` on PATH | Windows sweep host currently missing git for `gh run list` |
| Secrets (if needed) | `NPM_TOKEN`, deploy keys, Railway/Vercel tokens for CI |

**Env / notes:** Document org URL in `.agents/infra/environment-matrix.md`.

---

## Step 2 — Clerk

**Goal:** Replace `pk_test_REPLACE_ME` / `sk_test_REPLACE_ME` with real test keys **or** explicitly choose stub-only dev (agents align guard + frontend).

| Variable | Where |
|----------|-------|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Community, CoreKnot, Website |
| `CLERK_SECRET_KEY` | API |
| `CLERK_WEBHOOK_SECRET` | API webhooks (prod) |

**Dashboard:** [clerk.com](https://clerk.com) → Applications → API Keys.

**Decision:** Real keys vs `TSC_AUTH_STUB=true` with consistent API bypass — document choice for agent 03.

---

## Step 3 — Cloudflare

**Goal:** DNS zone for `theshakticollective.in`; records for API and frontends.

| Record type | Name | Target |
|-------------|------|--------|
| CNAME | `api` | Railway (`tsc-platform-production.up.railway.app` — confirm in Networking) |
| CNAME | `community` | Vercel tsc-community |
| CNAME / A | `@` | Vercel website apex |

**Separate zone `coreknot.in`:** CNAME `@` → Vercel tsc-coreknot (proxied). See [dns-records.md](../../../org-scaffold/tsc-infra/cloudflare/dns-records.md).

**Also:** R2 bucket (step 6), optional Workers/Tunnel for dev.

---

## Step 4 — Railway

**Goal:** `tsc-api` service deployed; custom domain `api.theshakticollective.in` attached.

| Action | Detail |
|--------|--------|
| Link repo / monorepo root | Build: `pnpm build`; start command per `apps/api` |
| Set env vars | `DATABASE_URL`, `REDIS_URL`, `CLERK_*`, `CORS_ORIGIN`, optional R2/Typesense |
| Health check | `GET /api/health/ready` |
| Bind | `0.0.0.0:$PORT` |

---

## Step 5 — Vercel

**Goal:** Community, CoreKnot, Website projects with production domains.

| Project | Root | Domain |
|---------|------|--------|
| Community | `apps/community` | `community.theshakticollective.in` |
| CoreKnot | `apps/coreknot/client` | `coreknot.in` (+ optional `coreknot.theshakticollective.in`) |
| Website | `apps/website` | `theshakticollective.in` |

**Env:** `NEXT_PUBLIC_API_URL` / `NEXT_PUBLIC_TSC_API_URL` → prod API URL.

---

## Step 6 — Cloudflare R2

**Goal:** Object storage for media uploads.

| Variable | Purpose |
|----------|---------|
| `R2_ACCOUNT_ID` | Account |
| `R2_ACCESS_KEY_ID` | S3-compatible access |
| `R2_SECRET_ACCESS_KEY` | Secret |
| `R2_BUCKET_NAME` | Bucket name |
| `R2_PUBLIC_URL` | CDN or public bucket URL |

Create bucket + API token in Cloudflare dashboard → R2.

---

## Step 7 — Typesense

**Goal:** Managed or self-hosted search cluster for entity indexing.

| Variable | Purpose |
|----------|---------|
| `TYPESENSE_HOST` | Hostname |
| `TYPESENSE_PORT` | Usually `443` |
| `TYPESENSE_PROTOCOL` | `https` |
| `TYPESENSE_API_KEY` | Admin/search key |

Optional locally via Docker; prod via Typesense Cloud or Railway addon.

---

## Step 8 — Monitoring

**Goal:** Error tracking + uptime beyond partial PostHog.

| Service | Variable | Agent |
|---------|----------|-------|
| PostHog | `POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_KEY` | 08 Observability |
| Sentry | `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN` | 08, 14 Security |
| BetterStack / Uptime | URL + API token | 08, 12 DevOps |

Wire DSNs in Railway + Vercel env; confirm events in dashboards after deploy.

---

## After completion

1. Update `.env` locally (never commit secrets).
2. Sync production env on Railway and Vercel.
3. Notify execution agent 01 — re-run `pnpm sweep:local` and `pnpm sweep:prod`.
4. Mark checklist rows above ☐ → ☑ with date in agent 01 deliverable.

---

## Day 1 checklist — theshakticollective.in (founder)

| # | Task | Domain / target |
|---|------|-----------------|
| 1 | Clerk app + test keys | Dashboard → API keys |
| 2 | Cloudflare zone | `theshakticollective.in` |
| 3 | Railway `tsc-api` service | Link monorepo, env from `.env` |
| 4 | DNS CNAME `api` | → Railway custom domain |
| 5 | Verify health | `https://api.theshakticollective.in/api/health` |
| 6 | Set `TSC_AUTH_STUB=false` on Railway when Clerk live | Production JWT only |

## Day 2 checklist — frontends + storage

| # | Task | Domain / target |
|---|------|-----------------|
| 1 | Vercel Community project | `community.theshakticollective.in` |
| 2 | Vercel CoreKnot project | `coreknot.theshakticollective.in` |
| 3 | Vercel Website / apex | `theshakticollective.in` |
| 4 | `NEXT_PUBLIC_API_URL` → prod API on all frontends | `https://api.theshakticollective.in/api` |
| 5 | Cloudflare R2 bucket + keys | Step 6 env vars |
| 6 | Typesense Cloud cluster | Step 7 env vars |
| 7 | Sentry + BetterStack projects | Step 8 DSNs |
| 8 | GitHub org + Actions secrets | Step 1 CI deploy tokens |
