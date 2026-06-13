# TSC Platform Recovery Sprint — QA Test Report

**Agent:** AGENT 11 — Quality Assurance  
**Date:** 2026-06-13  
**Workspace:** `c:\Users\ragha\OneDrive\Desktop\TSC Platform`  
**Environment:** Windows 10, Node.js v24.16.0, pnpm 9.15.0, Docker skipped (`TSC_SKIP_DOCKER=true`)

---

## Executive summary

Recovery sprint QA found **5 passing** and **12 failing** acceptance checklist items. Remote infrastructure (Neon Postgres, Upstash Redis) is reachable. CoreKnot production build and preview work. Shared packages compile. **Critical blockers:** NestJS API cannot start due to a `ProfileModule` circular dependency; Community and Website return HTTP 500 because Clerk publishable keys are placeholders (`pk_test_REPLACE_ME`); no Prisma migration history exists; mock/placeholder code remains in API agents and Community routes.

**Score: 5 green / 12 red**

---

## Acceptance checklist

| Status | Item | Notes |
|--------|------|-------|
| ❌ | API boots | Runtime crash on module load |
| ✅ | PostgreSQL connected | Neon reachable after cold-start retry |
| ✅ | Redis connected | Upstash `PONG` |
| ❌ | Clerk connected | Placeholder keys; invalid publishable key |
| ✅ | CoreKnot runs | Build + preview HTTP 200 |
| ❌ | Community runs | Dev server up; all routes HTTP 500 |
| ❌ | Website runs | Dev server up; root HTTP 500 |
| ✅ | Shared package works | `types`, `contracts`, `constants`, `database`, `community-sdk`, `permissions` build OK |
| ❌ | CI passes | Local turbo lint crashes (Windows DLL); community `next build` fails; `gh` unavailable (no Git) |
| ❌ | Production deploy succeeds | No deploy workflow in `.github/workflows/`; API cannot boot |
| ❌ | No mock data remains | Forecast/talent-discovery agents + CoreKnot client libs use mocks |
| ❌ | No placeholder code remains | Community `PlaceholderPage` routes; API stub health endpoints |
| ✅ | No TODO stubs remain | No `TODO`/`FIXME` in `apps/**` or `packages/**` TypeScript source |
| ❌ | Authentication works across apps | Auth stub env set but `ClerkProvider` still requires invalid key |
| ❌ | Health checks pass | API not running; cannot hit `/api/health` |
| ❌ | Database migrations pass | No migrations in `prisma/migrations` (only `.gitkeep`) |
| ❌ | End-to-end user flow verified | Blocked by API boot failure + Clerk 500s |

---

## Detailed verification

### 1. API connectivity & boot

**Commands:**
```powershell
pnpm dev:api
node apps/api/dist/main.js
curl.exe -s -w "\nHTTP:%{http_code}" http://127.0.0.1:4000/api/feed/health
```

**Result: FAIL**

- `pnpm dev:api` compiles 307 files then crashes on startup.
- Production `dist/main.js` fails with the same error.
- `curl` to `:4000` returns `HTTP:000` (no listener).

**Evidence:**
```
ReferenceError: Cannot access 'ProfileModule' before initialization
    at Object.ProfileModule (.../apps/api/src/modules/profile/profile.module.ts:26:14)
    at Object.<anonymous> (.../apps/api/src/modules/event/event.module.ts:12:13)
    at Object.<anonymous> (.../apps/api/src/modules/event-intelligence/event-intelligence.module.ts:1:24)
```

**Build (compile-only) passes:**
```
pnpm --filter @tsc/api build
> Successfully compiled: 307 files with swc
```

**Root cause:** Circular import between `ProfileModule` ↔ `EventModule` (via `event-intelligence`). `EventModule` imports `ProfileModule` directly; Nest module graph initializes before `forwardRef` can resolve.

**Health endpoints (when API runs):**
- Liveness: `GET /api/health`
- Readiness: `GET /api/health/ready` (DB + Redis checks)
- Module stubs: `GET /api/feed/health` → `{ module: 'feed', status: 'stub', sprint: 1 }`

---

### 2. PostgreSQL (Prisma)

**Commands:**
```powershell
pnpm db:validate
pnpm --filter @tsc/database exec prisma migrate status
node packages/database/.qa-db-test.cjs   # SELECT 1 via PrismaClient
```

**Schema validation: PASS**
```
The schema at prisma\schema.prisma is valid 🚀
```

**Migrations: FAIL**
```
No migration found in prisma/migrations
The current database is not managed by Prisma Migrate.
```

**Connectivity: PASS** (second attempt; first failed during Neon cold start)
```
DB_OK [{"ok":1}]
```

**First attempt (cold start):**
```
DB_FAIL Can't reach database server at ep-lucky-mouse-aolj3e09...neon.tech:5432
```

---

### 3. Redis

**Command:** `node apps/api/.qa-redis-test.cjs` (loads `apps/api/.env`)

**Result: PASS**
```
REDIS_OK PONG
```

`REDIS_URL` points to Upstash (`rediss://...upstash.io:6379`).

---

### 4. Clerk / authentication

**Config observed (`.env`, `.env.local`):**
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
TSC_AUTH_STUB=true
NEXT_PUBLIC_AUTH_STUB=true
```

**Result: FAIL**

- Keys are placeholders (`REPLACE_ME`). `auth-stub.ts` exists but `layout.tsx` always wraps with `ClerkProvider` via `requireClerkPublishableKey()` — no stub bypass in layout.
- Community middleware uses `clerkMiddleware` unconditionally.

**Community dev log:**
```
⨯ [Error: Publishable key not valid.]
```

**HTTP checks (Community `:3000`):**
```
home:500
sign-in:500
onboarding:500
profile:500
communities:500
```

**Login/logout/session persistence:** Not verified — Clerk rejects invalid key before any session flow.

**CoreKnot sign-in:** `GET /sign-in` → **200** (local auth page; not Clerk-backed).

---

### 5. CoreKnot

**Commands:**
```powershell
pnpm --filter @tsc/coreknot-client build
pnpm --filter @tsc/coreknot-client preview
curl.exe -s -o NUL -w "coreknot:%{http_code}" http://127.0.0.1:3001/
```

**Build: PASS**
```
✓ built in 1.43s
dist/assets/index-Beg7WfOj.js  262.45 kB
```

**Preview: PASS**
```
➜  Local:   http://localhost:3001/
coreknot:200
sign-in:200
```

Routing: React Router in `apps/coreknot/client/src/routes.jsx` — workspace, passport, operating, white-label tenant routes, protected routes via `ProtectedRoute`.

---

### 6. Community

**Commands:**
```powershell
pnpm --filter @tsc/community dev
pnpm --filter @tsc/community build
pnpm --filter @tsc/community typecheck
```

**Dev server:** Starts (`Ready in 2.2s`) but **all tested routes return 500** (Clerk error).

**Build: FAIL**
```
./src/components/search/search-form.tsx:20:40
Type error: 'searchParams' is possibly 'null'.
```

**Typecheck:** PASS (standalone `tsc --noEmit`).

**Routing (App Router):** Home `/`, auth `/sign-in`, `/sign-up`, onboarding `/onboarding`, profile `/profile`, `/u/[username]`, feed stubs under `(feed)/`, public listings `/artists`, `/communities`, `/events`, etc. Many routes render `PlaceholderPage`.

**Prior stack start log (`logs/frontend-dev.log` / terminal 48):** Community frontend did not respond within 60s on first `pnpm start` attempt (same Clerk issue).

---

### 7. Website

**Command:** `pnpm --filter @tsc/website dev` (package exists at `apps/website`; root `package.json` `dev:website` script still references old stub message in comment but runs `@tsc/website`)

**Dev server:** Starts on `:3002`
```
✓ Ready in 1885ms
```

**HTTP: FAIL**
```
website:500
```

Likely same Clerk key issue as Community (`@clerk/nextjs` dependency).

---

### 8. Shared packages

**Commands:**
```powershell
pnpm --filter @tsc/types build
pnpm --filter @tsc/contracts build
pnpm --filter @tsc/constants build
pnpm --filter @tsc/database build
pnpm --filter @tsc/community-sdk build
pnpm --filter @tsc/permissions build
```

**Result: PASS** — all exited 0.

---

### 9. CI

**Workflow:** `.github/workflows/ci.yml` — lint, typecheck, test, build on `main`/`develop`.

**Local reproduction:**
```powershell
pnpm lint          # turbo → exit 3221225781 (STATUS_DLL_NOT_FOUND on Windows)
pnpm turbo run lint typecheck test build  # same DLL crash
pnpm --filter @tsc/api lint               # ESLint 9: no eslint.config.js
pnpm --filter @tsc/community build        # type error in search-form.tsx
```

**GitHub CLI:** `gh run list` failed — Git not in PATH on this machine.

**Result: FAIL / not verified on GitHub** — local signals indicate CI would fail on community build; turbo unreliable on this Windows host.

---

### 10. Deployment readiness

**Findings:**
- No `render.yaml`, `Dockerfile`, or deploy workflow in repo root.
- `.github/workflows/` contains CI only (`ci.yml`, `ci-api.yml`, `ci-community.yml`, etc.) — no deploy pipeline.
- Production runbook (`.agents/production-setup-runbook.md`) documents Railway (API) + Vercel (frontends) but marks monorepo health as **current blocker**.
- API must bind `0.0.0.0:$PORT` for Render/Railway — `main.ts` already uses `0.0.0.0`.

**Result: FAIL** — cannot deploy until API boots and real Clerk keys are configured.

---

### 11. Mock data & placeholder code

**Mock data (FAIL):**
- `apps/api/src/modules/agents/forecast-agent.service.ts` — `mockEntityForecasts`, `mockPlatformRollups`, `mockInsights`
- `apps/api/src/modules/agents/talent-discovery-agent.service.ts` — `mockEmergingCities`
- `apps/coreknot/client/src/lib/*` — multiple `mock*` fallbacks (e.g. `agentsApi.js`, `careerApi.js`, `communityAgentApi.js`)

**Placeholder routes (FAIL):**
- `apps/community/src/app/(feed)/feed/page.tsx` and 10+ siblings use `PlaceholderPage`
- API stub health: `feed.controller.ts`, `post.controller.ts`, `notification.controller.ts` return `status: 'stub'`

**TODO stubs (PASS):**
- No `TODO` or `FIXME` in `apps/**/*.ts(x)` or `packages/**/*.ts` source.

---

### 12. End-to-end user flow

**Not verified.** Blocked by:
1. API crash on boot (no backend for profile/onboarding API calls)
2. Community/Website HTTP 500 on all pages (Clerk)
3. Auth stub enabled but not wired in Community layout

**Intended flow:** sign-up → onboarding → profile — cannot complete.

---

## Port status (during QA)

| Port | Service | Status |
|------|---------|--------|
| 4000 | NestJS API | CLOSED (crash) |
| 3000 | Community | OPEN (500 responses) |
| 3001 | CoreKnot | OPEN (200 responses) |
| 3002 | Website | OPEN (500 responses) |

---

## Priority remediation

1. **P0 — Fix `ProfileModule` circular dependency** so `pnpm dev:api` and `node apps/api/dist/main.js` start. Add `forwardRef(() => ProfileModule)` in `EventModule` and audit `event-intelligence` import chain.
2. **P0 — Clerk keys** — Replace `pk_test_REPLACE_ME` / `sk_test_REPLACE_ME` with real Clerk test keys, **or** wire `auth-stub.ts` / `isClerkEnabled()` into `layout.tsx` and middleware when stub mode is active.
3. **P1 — Community build** — Fix `search-form.tsx` `searchParams` null check; re-run `next build`.
4. **P1 — Prisma migrations** — Baseline or create initial migration; document `db push` vs `migrate deploy` for Neon.
5. **P2 — Remove mocks** — Replace forecast/talent-discovery mocks and CoreKnot client mock fallbacks with API calls or feature flags.
6. **P2 — CI** — Fix ESLint 9 flat config for API; verify turbo on Windows or document `npx pnpm@9.15.0` workaround.
7. **P2 — Deploy workflow** — Add Railway/Vercel deploy pipeline after P0 fixes.

---

## Commands reference (re-run QA)

```powershell
cd "c:\Users\ragha\OneDrive\Desktop\TSC Platform"

pnpm db:validate
pnpm --filter @tsc/api build
pnpm dev:api                    # expect crash until ProfileModule fixed

pnpm --filter @tsc/community dev
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/

pnpm --filter @tsc/coreknot-client build
pnpm --filter @tsc/coreknot-client preview
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3001/

pnpm --filter @tsc/website dev
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3002/
```

---

*Generated by AGENT 11 — Quality Assurance for TSC Platform Recovery Sprint.*
