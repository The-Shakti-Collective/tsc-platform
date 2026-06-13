# Railway Runtime Fix

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Railway / Nixpacks

## Symptom

Build succeeds, API crashes at start:

```
Cannot find module @tsc/database/dist/index.js
```

## Root cause

**B — workspace packages not built before API start.**

NestJS compiles API to `apps/api/dist/` with `require("@tsc/database")`. At runtime Node resolves to `packages/database/dist/index.js` via workspace symlink. If only `@tsc/api` was built (historical `pnpm --filter @tsc/api build`), `dist/` never existed for `@tsc/database`.

## Fix summary

| File | Change |
|------|--------|
| `nixpacks.toml` | Build: `pnpm db:generate`, `pnpm build`, `pnpm verify:dist` |
| `package.json` | `build` → `turbo run build --filter=@tsc/api...` |
| `package.json` | Added `verify:dist` script |
| `packages/*/package.json` | Added `"files": ["dist"]` |
| `apps/api/railway.toml` | buildCommand includes db:generate + verify:dist |
| `scripts/verify-workspace-dist.mjs` | Fails build if dist artifacts missing |

## nixpacks.toml (canonical)

```toml
[phases.setup]
nixPkgs = ["nodejs_20","pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = ["pnpm db:generate", "pnpm build", "pnpm verify:dist"]

[start]
cmd = "pnpm --filter @tsc/api start:prod"
```

## Railway dashboard checklist

| Setting | Value |
|---------|-------|
| Root Directory | *(empty — monorepo root)* |
| Builder | Nixpacks |
| Config | `/nixpacks.toml` or `railway.json` |
| Start command | `pnpm --filter @tsc/api start:prod` |
| Health check | `/api/health/ready` |

## Env vars (founder)

`DATABASE_URL`, `REDIS_URL`, Clerk keys, `SENTRY_DSN` — required for healthy readiness, not for module resolution.

## Hypothesis matrix

| ID | Hypothesis | Result |
|----|------------|--------|
| A | dist built but excluded from image | Rejected — symlinks serve package dir |
| B | dist never built | **Confirmed** |
| C | pnpm prune removed workspace dist | Rejected — no prod-only prune in nixpacks |

## Post-deploy verification

```bash
curl https://api.theshakticollective.in/api/health/live
curl https://api.theshakticollective.in/api/health/ready
```

## Status

Fixes applied. Redeploy required for Railway to pick up nixpacks + build graph changes.
