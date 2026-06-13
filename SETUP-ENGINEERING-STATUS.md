# TSC Platform — Engineering Setup Status

**Date:** 2026-06-14  
**Scope:** In-repo setup phases 1–8 executed; phases 9–17 documented for founder  
**Founder steps:** [SETUP-FOUNDER-RUNBOOK.md](./SETUP-FOUNDER-RUNBOOK.md)

---

## Summary

| Area | Status | Notes |
|------|--------|-------|
| Monorepo / pnpm | **GREEN** | Install OK; Turbo fallback works on Windows |
| `@tsc/database` / Prisma | **GREEN** | `prisma generate`, build, typecheck pass |
| `@tsc/analytics` | **GREEN** | build + typecheck pass |
| ESLint (packages) | **GREEN** | Root `.npmrc` hoists `@typescript-eslint/*` |
| `@tsc/api` build | **GREEN** | SWC 324 files |
| `@tsc/api` typecheck | **GREEN** | 0 errors (`moduleResolution: bundler`, `module: ES2022`) |
| `@tsc/api` tests | **GREEN** | 14/14 pass (Vitest Nest inline deps) |
| `@tsc/api` local boot | **GREEN** | Boots without `SENTRY_DSN` (conditional Sentry) |
| Community build/typecheck | **GREEN** | Stub-safe Clerk split |
| Website build/typecheck | **GREEN** | Stub-safe Clerk split |
| CoreKnot build/typecheck | **GREEN** | Unchanged; already healthy |
| Production deploy | **BLOCKED** | Founder: Railway, Vercel, DNS, secrets |
| Playwright E2E | **NOT RUN** | Requires API + Community running with prod/local stack |
| Global rate limit / helmet | **OPEN** | P1 security; not in this pass |
| BullMQ workers | **OPEN** | Queues registered; no workers yet |

---

## Phase 1 — Monorepo

**Verified**

- `pnpm install` — 20 workspace projects
- `pnpm run build` — Turbo fallback → API dependency graph builds
- `pnpm run verify:dist` — 11 artifacts OK
- `pnpm run verify:deploy` — 6 deploy bundle artifacts OK
- `@tsc/e2e` in workspace (`pnpm-workspace.yaml`)

**Known limitation**

- Turbo native binary still crashes on Windows (`0xC0000135`); use `pnpm run *:fallback` scripts.

---

## Phase 2 — Packages

**Fixed**

| Issue | Fix |
|-------|-----|
| `fast-check` corruption blocked `prisma generate` | `pnpm.overrides.fast-check = 3.22.0` in root `package.json`; clean `node_modules` reinstall |
| ESLint `@typescript-eslint/eslint-plugin` not found | Root `.npmrc` `public-hoist-pattern[]=@typescript-eslint/*` |
| `@tsc/analytics` Prisma type errors | Unblocked by working Prisma client generation |

---

## Phase 3 — Database

**Fixed**

- `pnpm --filter @tsc/database prisma:generate` — exit 0
- `pnpm --filter @tsc/database build` — exit 0
- `pnpm --filter @tsc/database typecheck` — exit 0
- Added `packages/database/prisma/migrations/migration_lock.toml` (`provider = "postgresql"`)

---

## Phase 4 — API

**Fixed**

| Issue | Fix |
|-------|-----|
| Boot crash `@sentry/node-core` | `apps/api/src/sentry.bootstrap.ts` — conditional `require()` when `SENTRY_DSN` set |
| `app.module.ts` unconditional Sentry filter | Uses `getSentryGlobalFilterProvider()` |
| Vitest Nest/swagger load failures | `apps/api/vitest.config.ts` — `server.deps.inline: [/@nestjs\/.*/]` |
| Typecheck `moduleResolution` / contracts subpaths | `tsconfig.json`: `module: ES2022`, `moduleResolution: bundler` |

**Verification**

```
pnpm --filter @tsc/api typecheck   → exit 0
pnpm --filter @tsc/api build       → exit 0
pnpm --filter @tsc/api test        → 14/14 pass
node apps/api/dist/main.js         → Nest boots (with DATABASE_URL)
```

---

## Phase 5 — Auth (stub-safe)

**Fixed — Community**

- Split `site-header` → stub vs clerk components (no top-level `@clerk/nextjs` in stub path)
- Split `auth-token-provider` → stub vs clerk providers
- Stub auth pages for `/sign-in`, `/sign-up`
- `layout.tsx` dynamic import of `clerk-root-layout.tsx`
- `middleware.ts` skips Clerk when `TSC_AUTH_STUB=true`
- Aligned `@clerk/nextjs` to `^6.39.5`

**Fixed — Website**

- Same stub/clerk split for header, layout, sign-in, sign-up
- Added `NEXT_PUBLIC_WEBSITE_URL` to `.env.example`

**CoreKnot**

- Already stub-safe via `ProtectedRoute.jsx` + `isAuthStubEnabled()`

**Env examples**

- `apps/community/.env.example`, `apps/api/.env.example`, `apps/website/.env.example` already document `TSC_AUTH_STUB=true` for local dev

---

## Phase 6–8 — Apps

| App | typecheck | build |
|-----|-----------|-------|
| `@tsc/community` | exit 0 | exit 0 (Next.js 15) |
| `@tsc/website` | exit 0 | exit 0 (Next.js 15) |
| `@tsc/coreknot-client` | exit 0 | exit 0 (Vite) |

---

## Phases 9–17 — Documented only (founder / future engineering)

| Phase | Owner | Action |
|-------|-------|--------|
| 9 Railway deploy + secrets | Founder | [SETUP-FOUNDER-RUNBOOK.md §5](./SETUP-FOUNDER-RUNBOOK.md) |
| 10 Vercel projects + token | Founder | [SETUP-FOUNDER-RUNBOOK.md §7](./SETUP-FOUNDER-RUNBOOK.md) |
| 11 Cloudflare DNS | Founder | [SETUP-FOUNDER-RUNBOOK.md §6](./SETUP-FOUNDER-RUNBOOK.md) |
| 12 Redis prod URL | Founder | Step 3 + Railway vars |
| 13 Observability tokens | Founder | Step 8 |
| 14 Security (helmet, throttler, audience-os guard) | Engineering P1 | Not implemented this pass |
| 15 `vercel.json` for community/coreknot | Engineering P1 | Optional; Vercel dashboard root dir may suffice |
| 16 Playwright in CI | Engineering P1 | `@tsc/e2e` wired; smoke not in default CI |
| 17 Local infra | Founder/dev | `pnpm start:infra`; Docker Postgres/Redis |

---

## Files changed (this setup pass)

### Root

- `package.json` — `pnpm.overrides.fast-check`
- `pnpm-lock.yaml` — lockfile refresh
- `.npmrc` — ESLint hoisting
- `.nvmrc` — Node 22

### Database

- `packages/database/prisma/migrations/migration_lock.toml`

### API

- `apps/api/src/sentry.bootstrap.ts` (new)
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/tsconfig.json`
- `apps/api/vitest.config.ts` (new)

### Community

- `apps/community/package.json`
- `apps/community/src/middleware.ts`
- `apps/community/src/clerk-middleware.ts` (new)
- `apps/community/src/app/layout.tsx`
- `apps/community/src/app/clerk-root-layout.tsx` (new)
- `apps/community/src/components/layout/site-header*.tsx`
- `apps/community/src/components/providers/*`
- `apps/community/src/components/auth/stub-auth-page.tsx` (new)
- `apps/community/src/app/(auth)/sign-in/**`, `sign-up/**`

### Website

- `apps/website/.env.example`
- `apps/website/src/app/layout.tsx`
- `apps/website/src/app/clerk-root-layout.tsx` (new)
- `apps/website/src/components/layout/site-header*.tsx`
- `apps/website/src/components/auth/stub-auth-page.tsx` (new)
- `apps/website/src/app/sign-in/**`, `sign-up/**`

### Docs (this pass)

- `SETUP-FOUNDER-RUNBOOK.md` (new)
- `SETUP-ENGINEERING-STATUS.md` (new)

---

## Recommended next engineering tasks (post-founder cutover)

1. Re-run Playwright smoke: `cd e2e && pnpm exec playwright test`
2. Add `@nestjs/throttler` + `helmet` on API
3. Guard `/api/audience-os/*` with `ClerkAuthGuard`
4. Wire Playwright into CI after prod probes green
5. Add BullMQ `Worker` processors for registered queues

---

*For executive readiness context see [MASTER-E2E-READINESS-REPORT.md](./MASTER-E2E-READINESS-REPORT.md).*
