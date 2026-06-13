# TSC Platform Audit Report

**Auditor:** AGENT 1 — Platform Auditor  
**Date:** 2026-06-13  
**Workspace:** `c:\Users\ragha\OneDrive\Desktop\TSC Platform`  
**Mode:** Read-only audit (commands run; report persisted by coordinator)

---

## Executive summary

Monorepo has **18 workspace packages** (3 apps + 1 coreknot client + 14 packages). **14/17 build targets passed** on first `pnpm build`; **`@tsc/community` failed**; **`@tsc/website` and `@tsc/constants` were skipped** (website uninstalled; constants builds separately). **API SWC compile succeeds** with `typeCheck: false`, but **`pnpm --filter @tsc/api typecheck` → 319 errors**. **Prisma validate passes**. Multi-repo migration is **blocked** per `.agents/production-setup-runbook.md` until `pnpm build` exits 0.

---

## Repository map

| Repo (target) | Monorepo location | Status |
|---------------|-------------------|--------|
| **tsc-api** | `apps/api/` (`@tsc/api`) | NestJS 11 — builds (SWC), typecheck broken |
| **tsc-community** | `apps/community/` (`@tsc/community`) | Next.js 15.5.19 — build fails (OneDrive) |
| **tsc-coreknot** | `apps/coreknot/client/` (`@tsc/coreknot-client`) | Vite 6 shell only; legacy JSX unwired |
| **tsc-web** | `apps/website/` (`@tsc/website`) | In monorepo (not org-scaffold-only); **no node_modules** |
| **tsc-shared** | `packages/*` + `org-scaffold/tsc-shared/` | Active packages in monorepo; scaffold is migration template |

**Not in pnpm workspace:** `org-scaffold/` (CI/terraform/docs templates only).

---

## Framework & tooling versions

| Layer | Version |
|-------|---------|
| Package manager | **pnpm 9.15.0** (`packageManager` in root) |
| Node (documented) | 20+ |
| TypeScript | ^5.7.0 (resolved 5.9.3 in lockfile) |
| Turbo | ^2.3.0 |
| **@tsc/api** | NestJS ^11, BullMQ ^5.34, Prisma client via `@tsc/database` |
| **@tsc/community** | Next.js **15.5.19**, React 19, Clerk ^6.9 |
| **@tsc/coreknot-client** | Vite **6.4.3**, React 19 |
| **@tsc/website** | Next.js ^15.1, React 19 |
| **@tsc/database** | Prisma ^6.0 |

---

## 1. Dependency issues

| Issue | Severity | Details |
|-------|----------|---------|
| **`@tsc/website` not installed** | **Blocker** | `pnpm --filter @tsc/website build` → `'next' is not recognized` + `node_modules missing` |
| **CoreKnot client missing declared deps** | **High** | `package.json` only lists `react`/`react-dom`; source imports `@clerk/clerk-react`, `react-router-dom`, `@tanstack/react-query`, `lucide-react`, `axios` (100+ legacy pages). Vite shell build passes only because **App.jsx is minimal** (~127 lines). |
| **`packages/database/src/agents.ts` not re-exported** | **High** | File defines `OPPORTUNITY_AGENT_SLUG`, `CAREER_AGENT_SLUG`, etc.; **`packages/database/src/index.ts` omits `export * from "./agents.js"`** → API imports fail at typecheck |
| **`@tsc/constants` vs org-scaffold duplicate** | Medium | `packages/constants` (full) vs `org-scaffold/tsc-shared/packages/constants` (2 exports) — drift risk on migration |
| **PostHog version skew** | Low | API `posthog-node@^5.37`; website `posthog-node@^4.10` |
| **STARTUP.md stale** | Low | Says coreknot "not in pnpm workspace" and website "placeholder/separate repo" — both are now in workspace |

---

## 2. Build issues

### Commands run

```text
pnpm build                          → EXIT 1
pnpm db:validate                      → EXIT 0
pnpm --filter @tsc/constants build    → EXIT 0
pnpm --filter @tsc/website build      → EXIT 1 (next not found)
pnpm --filter @tsc/api build          → EXIT 1 on retry (EBUSY OneDrive lock); EXIT 0 on first root build
pnpm --filter @tsc/api typecheck      → EXIT 2 (319 errors)
pnpm lint (turbo)                     → EXIT 3221225781 (native crash)
pnpm --filter @tsc/api lint           → EXIT 2 (no eslint.config.*)
pnpm --filter @tsc/community exec next lint → EXIT 0
```

### Per-package build results (root `pnpm build`)

| Package | Result |
|---------|--------|
| `@tsc/ui`, `@tsc/permissions`, `@tsc/database`, `@tsc/types`, `@tsc/contracts` | ✅ |
| `@tsc/analytics`, `@tsc/graph`, `@tsc/community-sdk`, `@tsc/projects`, `@tsc/search`, `@tsc/tasks`, `@tsc/workspace`, `@tsc/reputation` | ✅ |
| `@tsc/coreknot-client` | ✅ (28 modules — shell only) |
| `@tsc/api` | ✅ SWC (304 files); parallel fail when community aborted |
| `@tsc/community` | ❌ **FAILED** |
| `@tsc/constants` | Not in parallel batch (no dependents triggered) |
| `@tsc/website` | Not reached / not installed |

### `@tsc/community` exact error

```text
Build error occurred
[Error: EINVAL: invalid argument, readlink '...\apps\community\.next\diagnostics\build-diagnostics.json']
  errno: -4071, code: 'EINVAL', syscall: 'readlink'
```

**Likely cause:** OneDrive-synced `.next` cache + Windows readlink. **Fix:** delete `apps/community/.next`, build outside OneDrive or exclude `.next` from sync.

### `@tsc/api` typecheck (319 errors — categories)

1. **`moduleResolution: "node"`** — cannot resolve `@tsc/database/client`, `@tsc/contracts/agents` subpath exports (files exist; need `node16`/`nodenext`/`bundler`)
2. **Missing `@tsc/database` exports** — agent slugs, `agentRecommendationInclude`, etc. (file exists, not in barrel)
3. **`MembershipContext.personId`** — used widely; interface only has `userId`
4. **Activity action union too narrow** — e.g. `"workspace_created"`, `"brand_match_run_completed"` not in allowed set
5. **Zod optional vs required** — controller DTOs pass optional fields where service expects required

Nest build intentionally skips typecheck:

```json
"compilerOptions": {
  "deleteOutDir": true,
  "builder": "swc",
  "typeCheck": false
}
```

---

## 3. Runtime issues

| Issue | Impact |
|-------|--------|
| **CoreKnot `main.jsx` hard-requires Clerk key** | Missing `VITE_CLERK_PUBLISHABLE_KEY` in `apps/coreknot/client/.env.local` → **throws at startup** |
| **Auth stub mode active** | `.env`: `TSC_AUTH_STUB=true`, Clerk keys `pk_test_REPLACE_ME` — production auth disabled |
| **CORS single origin** | `CORS_ORIGIN=http://localhost:3000` — CoreKnot `:3001` and Website `:3002` not included |
| **Inconsistent public URL fallbacks** | `opportunity.service.ts` → `https://tsc.onrender.com`; passport/verification → `https://tsc.in` when `TSC_PUBLIC_URL` unset |
| **Redis stub mode** | If `REDIS_URL` empty, BullMQ queues null — jobs no-op (by design) |
| **Empty API modules** | `ArtistModule`, `CityModule`, `DirectoryModule`, `FinanceModule` — registered but **no controllers** |
| **Community UX** | 11 listing/detail routes render `PlaceholderPage` — nav works, no data |
| **CoreKnot legacy pages orphaned** | Full operator UI under `src/pages/**` not imported by current `App.jsx` — no router |

---

## 4. Environment issues

### Root `.env.example` vs `.env` (keys only — no secret values)

| Variable | In `.env.example` | In `.env` | Code usage gap |
|----------|-------------------|-----------|------------------|
| `DATABASE_URL` | ✅ | ✅ (Neon) | OK |
| `REDIS_URL` | ✅ | ✅ (Upstash) | OK |
| `PORT`, `API_GLOBAL_PREFIX`, `CORS_ORIGIN` | ✅ | ✅ | CORS too narrow for multi-frontend |
| Clerk keys + URLs | ✅ | ✅ (placeholders) | Stub mode active |
| `TSC_AUTH_STUB`, `NEXT_PUBLIC_AUTH_STUB` | ✅ | ✅ | Dev only |
| `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_TSC_API_URL`, `NEXT_PUBLIC_APP_URL` | ✅ | ✅ | OK |
| `TSC_STUB_USER_ID`, `NEXT_PUBLIC_STUB_PERSON_ID` | ✅ | ✅ | OK |
| `POSTHOG_*` | ✅ | ✅ | OK |
| `TSC_PUBLIC_URL` | Commented optional | **Missing** | Hardcoded fallbacks in API |
| `COREKNOT_SYNC_URL`, `COREKNOT_SYNC_SECRET` | Commented | **Missing** | Sync outbound disabled |
| `STRIPE_KEY`, `RAZORPAY_KEY`, `CASHFREE_KEY` | Commented | **Missing** | Payment stubs only |
| `TSC_SKIP_DOCKER` | Commented | ✅ | OK |

### CoreKnot client env (`apps/coreknot/client/`)

| Variable | `.env.example` | `.env.local` | Issue |
|----------|----------------|--------------|-------|
| `VITE_TSC_API_URL` | ✅ | ✅ | OK |
| `VITE_CLERK_PUBLISHABLE_KEY` | ✅ (empty) | **Missing** | **Runtime crash** |
| `VITE_API_URL` | — | ✅ | Used by legacy `apiBase.js` |

### Website env (not in root `.env.example`)

From `apps/website/src/lib/config/site.ts`: `NEXT_PUBLIC_WEBSITE_URL`, `NEXT_PUBLIC_COMMUNITY_URL`, `NEXT_PUBLIC_API_URL`.

---

## 5. Migration issues

Per `.agents/production-setup-runbook.md` **§2 Gate: do not migrate until:**

| Gate | Status |
|------|--------|
| `pnpm db:validate` | ✅ Pass |
| `pnpm db:generate` | ⚠️ Not run (write blocked in audit mode) |
| `pnpm build` | ❌ Fail |
| Local API smoke test | ⚠️ Not run |

**Additional migration risks:**

- **7-repo split** (`tsc-api`, `tsc-coreknot`, `tsc-community`, `tsc-web`, `tsc-shared`, `tsc-infra`, `tsc-docs`) copies broken builds
- **`org-scaffold/tsc-web`** says greenfield; **`apps/website` already exists** in monorepo — reconcile before extract
- **`packages/constants`** duplicated in scaffold with subset of exports
- **GitHub org repos** not bootstrapped (`gh` unavailable per runbook)
- **Branch protection requires** `lint`, `typecheck`, `test`, `build` — none pass cleanly today

---

## 6. Mock / placeholder inventory

### Package-level stubs

| Location | Description |
|----------|-------------|
| `packages/ui` | `UI_PACKAGE_VERSION = "0.0.0-stub"` |
| `packages/search` | `searchPlaceholder()` — no Typesense/ES |
| `packages/reputation` | Facade stub re-exports |
| `packages/analytics` | Intelligence snapshot stubs (Stage 2 deferred models) |

### API stubs (representative)

| Module | Stub behavior |
|--------|---------------|
| `payment/adapters/stub-adapters.ts` | Stripe/Razorpay/Cashfree fake checkout URLs |
| `contract/contract.service.ts` | `https://tsc.in/contracts/.../signed-stub.pdf` |
| `queues/queue-registry.service.ts` | No-op when `REDIS_URL` empty |
| `common/auth/stub-auth.guard.ts` | Dev auth bypass |
| `modules/artist|city|directory|finance` | Empty `@Module({})` |
| `agents/*`, `intelligence/automation-engine-v2` | Automation V2 stub steps |
| `sync/sync.service.ts` | CoreKnot CRM update stubs |
| `data-exchange/webhook-emitter.service.ts` | HTTP POST log-only |
| `public-api/api-key-rate-limit.service.ts` | Rate limit log stub |

### Community UI placeholders

Routes using `PlaceholderPage`: `/feed`, `/discover`, `/bookmarks`, `/notifications`, `/messages`, `/communities`, `/events`, `/artists`, `/collaborations`, `/opportunities`, `/community/[slug]`, `/event/[slug]`.

**Implemented:** `/`, `/u/[username]`, `/profile`, `/onboarding`, `/search` (partial), auth/settings.

### CoreKnot legacy

- `OpportunityMarketplacePage.jsx`, `CollaborationMarketplacePage.jsx` — inline "Sample marketplace data" messages
- Many `INTEGRATION.patch.md` files — routes never wired to shell

---

## 7. Hardcoded URL inventory

| File | URL / pattern |
|------|---------------|
| `apps/api/src/main.ts` | Fallback CORS `http://localhost:3000` |
| `apps/api/src/modules/opportunity/opportunity.service.ts` | `TSC_PUBLIC_URL ?? 'https://tsc.onrender.com'` |
| `apps/api/src/modules/passport/passport.service.ts` | `?? 'https://tsc.in'` |
| `apps/api/src/modules/profile/verification.service.ts` | `?? 'https://tsc.in'` |
| `apps/api/src/modules/payment/adapters/stub-adapters.ts` | `https://pay.tsc.in/stub/...` |
| `apps/api/src/modules/contract/contract.service.ts` | `https://tsc.in/contracts/...` |
| `packages/database/src/data-exchange.ts` | `https://tsc.in/vocab/`, `https://tsc.in/ns/` |
| `packages/database/src/tsc-identity.ts`, `creative-identity.ts` | `?? 'https://tsc.in'` |
| `apps/community/src/lib/utils.ts` | `?? 'http://localhost:4000/api'`, `?? 'http://localhost:3000'` |
| `apps/coreknot/client/vite.config.js` | Proxy target `http://localhost:4000` |
| `apps/website/src/lib/config/site.ts` | localhost:3002/3000/4000 fallbacks |
| `org-scaffold/tsc-web/README.md` | Production `https://theshakticollective.in` |

---

## 8. Duplicated types inventory

| Type / constant | Locations | Notes |
|-----------------|-----------|-------|
| `COMMUNITY_ROLES` / `CommunityRole` | `packages/types/src/community.ts`, `packages/permissions/src/index.ts` | **Identical literals duplicated** |
| `CommunityMemberRole` vs `CommunityMemberRoleValue` | `packages/types/src/membership.ts`, `packages/database/src/membership.ts` | Same enum values, different names |
| `CommunityMemberStatus` vs `CommunityMemberStatusValue` | types vs database | Parallel |
| Agent types | `packages/types/src/agents.ts`, `packages/contracts/src/agents/`, `packages/database/src/agents.ts` | Three-layer split; database barrel **incomplete** |
| Domain DTOs | `packages/types/*` + `packages/contracts/*` (z.infer) | Intentional but high maintenance |
| `TSC_API_VERSION`, `DEFAULT_PAGE_SIZE` | `packages/constants`, `org-scaffold/tsc-shared/.../constants` | Scaffold subset |
| Phase index files | `packages/types/src/index.phase6*.ts` | Legacy parallel exports |

---

## 9. Routing issues

### Community (`apps/community`)

- **Middleware:** Clerk bypass when stub; public routes include listings + `/u/*`; **protected:** `/feed`, `/profile`, `/onboarding`, `/settings`, etc. — correct for auth-gated app
- **Gap:** Public nav links to placeholder pages (no 404, empty UX)
- **`/search`:** public in middleware; implementation depends on API
- **Auth stub + `useCommunityClient`:** returns null token — API must accept stub headers (`TSC_STUB_USER_ID`)

### CoreKnot

- **Active:** single-page shell, no `react-router-dom` in `App.jsx`
- **Legacy:** full router tree exists under `src/pages/**` — **not mounted**
- **API:** Vite proxy `/api` → `:4000` (works for shell health check)

### Website

- Routes: `/`, `/about`, `/programs`, `/discover`, `/contact`, `/blog`, `/blog/[slug]`, API routes `/api/health`, `/api/contact`
- **Cannot verify build** until `pnpm install` links website

---

## 10. Per-app status summary

| App | Build | Lint | Typecheck | Runtime readiness | Recovery priority |
|-----|-------|------|-----------|-------------------|-------------------|
| **@tsc/api** | ✅ SWC | ❌ No flat ESLint config | ❌ 319 errors | Dev stack OK with Neon/Upstash; type safety off | **P0** — fix exports + tsconfig |
| **@tsc/community** | ❌ OneDrive `.next` | ✅ next lint | ⚠️ via next build | Dev likely OK; prod build blocked | **P0** |
| **@tsc/coreknot-client** | ✅ (shell) | Skipped (echo) | N/A (JS) | ❌ Missing Clerk env; legacy UI unwired | **P1** |
| **@tsc/website** | ❌ Not installed | — | — | Not runnable | **P1** — `pnpm install` |
| **packages/** (14) | ✅ All tsc packages | Partial | Mostly via build | Shared libs OK | **P2** — export hygiene |

---

## Top 5 blockers for recovery sprint

1. **`pnpm build` exit 0** — fix `@tsc/community` OneDrive `.next` readlink (`EINVAL`); confirm `@tsc/website` after install
2. **`@tsc/website` workspace install** — missing `node_modules`; `next` not on PATH
3. **API type system** — 319 `tsc` errors; add `agents` to database barrel; fix `moduleResolution`; align `MembershipContext` and activity action unions
4. **CoreKnot recovery path** — wire router + declare deps OR document shell-only scope; set `VITE_CLERK_PUBLISHABLE_KEY`
5. **CI/tooling on Windows** — turbo lint native crash (`3221225781`); API ESLint v9 flat config missing; nest `typeCheck: false` hides errors until CI enforces typecheck

---

## Recommended next commands (for recovery agents)

```powershell
# Fix community build environment
Remove-Item -Recurse -Force "apps\community\.next" -ErrorAction SilentlyContinue

# Ensure all workspace packages linked
pnpm install

# Re-verify gates
pnpm db:validate
pnpm db:generate
pnpm build
pnpm --filter @tsc/api typecheck
```
