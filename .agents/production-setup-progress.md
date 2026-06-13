# Production Setup Progress

> Living checklist for TSC Platform production readiness.  
> Runbook: `.agents/production-setup-runbook.md`  
> Last updated: 2026-06-12 (agent session)

---

## Completed

### Phase A — Local foundation

- [x] Monorepo builds (`pnpm build` — re-verify after changes)
- [x] **Neon Postgres** — `DATABASE_URL` wired in root `.env`, `apps/api/.env`, `packages/database/.env`
- [x] **PostHog (partial)** — project token + host set in `.env` for API and community
- [x] **Dev stub auth** — Clerk bypass when keys are placeholders or `TSC_AUTH_STUB=true` (see `STARTUP.md` § Temp auth)
- [x] **GitHub org repos** — all 7 repos exist under [The-Shakti-Collective](https://github.com/The-Shakti-Collective):
  - tsc-shared, tsc-api, tsc-coreknot, tsc-community, tsc-infra (private)
  - tsc-web, tsc-docs (public)
- [x] **Local Redis** — `REDIS_URL=redis://localhost:6379` (Docker compose)

### Blocked / deferred

- [ ] **Clerk** — dashboard CAPTCHA blocks login; using dev stub auth until real keys available
- [ ] **Org teams + branch protection** — requires org admin in GitHub UI or `gh api`
- [ ] **Repo migration** — monorepo not yet extracted into org repos

---

## Next 3 human steps

### 1. Provision Upstash Redis (staging)

1. Open [console.upstash.com](https://console.upstash.com/) → **Create database**
2. Name: `tsc-staging`, region closest to Railway deploy target
3. Copy the **Redis URL** (`rediss://default:...@....upstash.io:6379`)
4. Save as `REDIS_URL` in Railway staging env (after step 3) — do not commit

Local dev can keep `redis://localhost:6379` via Docker.

### 2. Create Railway project for tsc-api (staging)

1. Open [railway.app/new](https://railway.app/new) → **Deploy from GitHub repo**
2. Select `The-Shakti-Collective/tsc-api` (or monorepo root until migration)
3. Set env vars (minimum):

   | Variable | Source |
   |----------|--------|
   | `DATABASE_URL` | Neon staging branch connection string |
   | `REDIS_URL` | Upstash `tsc-staging` URL |
   | `PORT` | Railway injects automatically |
   | `CORS_ORIGIN` | Vercel preview URL or `https://community-staging.theshakticollective.in` |
   | `CLERK_SECRET_KEY` | Clerk staging app (when unblocked) |
   | `POSTHOG_PROJECT_TOKEN` | PostHog project settings |

4. Health check path: `/api/health` (confirm after first deploy)

Docs: [Railway web services](https://docs.railway.app/guides/public-networking)

### 3. Link Vercel project for tsc-community (staging)

1. Open [vercel.com/new](https://vercel.com/new) → import `The-Shakti-Collective/tsc-community`
2. Root directory: `apps/community` (or repo root with monorepo config)
3. Set env vars:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Railway staging API URL + `/api` |
   | `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk staging publishable key |
   | `CLERK_SECRET_KEY` | Clerk staging secret |
   | `NEXT_PUBLIC_POSTHOG_KEY` | PostHog project key |
   | `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` |

4. Disable stub flags in production: `NEXT_PUBLIC_AUTH_STUB` must **not** be set

Docs: [Vercel environment variables](https://vercel.com/docs/projects/environment-variables)

---

## Environment groups checklist (when platforms exist)

| Group | Platform | Keys |
|-------|----------|------|
| **Database** | Railway (tsc-api) | `DATABASE_URL` |
| **Queue/cache** | Railway (tsc-api) | `REDIS_URL` |
| **Auth** | Railway + Vercel | `CLERK_SECRET_KEY`, `NEXT_PUBLIC_CLERK_*`, `CLERK_WEBHOOK_SECRET` |
| **Analytics** | Railway + Vercel | `POSTHOG_PROJECT_TOKEN`, `NEXT_PUBLIC_POSTHOG_*` |
| **Storage** | Railway (tsc-api) | `R2_*` (Cloudflare R2 — Phase C) |
| **Search** | Railway (tsc-api) | `TYPESENSE_*` (Phase C) |
| **CI/CD** | GitHub Org secrets | See runbook §3 Organization secrets |

---

## Agent session log (2026-06-12)

**Part A — Dev stub auth**

- Added `apps/community/src/lib/auth-stub.ts` — detects placeholder Clerk keys + stub flags (dev only)
- Updated community middleware, layout, header, sign-in/up, settings, `useCommunityClient`
- Added `apps/api/src/common/auth/stub-membership.ts` — reads `TSC_STUB_USER_ID` from env
- Updated `StubAuthGuard` + `Membership` decorator
- Set `TSC_AUTH_STUB=true`, `NEXT_PUBLIC_AUTH_STUB=true` in `.env`, `.env.example`, synced app env files
- Documented in `STARTUP.md` § Temp auth (Clerk unavailable)

**Part B — Production prep**

- Verified GitHub org repos already exist (7/7)
- Confirmed `gh` CLI authenticated as member of The-Shakti-Collective
- Documented Upstash Redis, Railway, and Vercel next steps above
- Clerk remains blocked — stub auth unblocks local development

---

## Phase map (runbook reference)

| Phase | Status | Notes |
|-------|--------|-------|
| A — Monorepo health + local infra | ✅ Mostly done | Re-run `pnpm build` after stub auth changes |
| B — GitHub org + Neon + Upstash + deploy prep | 🔄 In progress | Neon ✅, PostHog partial ✅, Upstash pending |
| C — R2, Typesense, Sentry, DNS cutover | ⏳ Not started | After staging API live |
| D — Multi-repo migration | ⏳ Not started | Gate: `pnpm build` = 0 |
