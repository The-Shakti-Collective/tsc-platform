# Railway Runtime Fix

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14 (updated)  
**Agent:** Railway / Nixpacks

## Symptom

Build succeeds, API crashes at start:

```
> @tsc/api@0.0.0 start:prod /app/apps/api
> node dist/main.js
Error: Cannot find module '/app/apps/api/node_modules/@tsc/database/dist/index.js'
  path: '/app/apps/api/node_modules/@tsc/database/package.json'
```

## Root cause

**A — dist built during Nixpacks build phase, then lost before runtime.**

Nixpacks runs `pnpm build` + `verify:dist` successfully, then performs a final `COPY . /app` from the git build context. Workspace package directories (`packages/database/`, etc.) are replaced with git-tracked source only. `dist/` is in `.gitignore`, so compiled artifacts disappear while pnpm workspace symlinks under `apps/api/node_modules/@tsc/*` still point at the now-dist-less package dirs.

Prior fix (turbo full graph + `verify:dist`) addressed **B — dist never built** but could not survive the Nixpacks copy step.

## Fix summary

| File | Change |
|------|--------|
| `nixpacks.toml` | After build: `pnpm --filter @tsc/api --prod deploy /app/deploy` + `verify-deploy-bundle` |
| `railway.json` | Start: `node scripts/railway-start.mjs` |
| `apps/api/railway.toml` | buildCommand + startCommand aligned |
| `scripts/railway-start.mjs` | Start API from `/app/deploy` with preflight checks |
| `scripts/verify-deploy-bundle.mjs` | Fail build if deploy bundle missing `@tsc/database/dist` |
| `package.json` | `deploy:api`, `verify:deploy`, `start:prod:railway` |
| `.gitignore` | Ignore `deploy/` |

`pnpm deploy` materializes workspace deps into a self-contained directory with real `node_modules` copies (not monorepo symlinks). `/app/deploy` is created during the build RUN layer and is **not** overwritten by the final git-context COPY.

## nixpacks.toml (canonical)

```toml
[phases.setup]
nixPkgs = ["nodejs_20","pnpm"]

[phases.install]
cmds = ["pnpm install --frozen-lockfile"]

[phases.build]
cmds = [
  "pnpm db:generate",
  "pnpm build",
  "pnpm verify:dist",
  "pnpm --filter @tsc/api --prod deploy /app/deploy",
  "node scripts/verify-deploy-bundle.mjs",
]

[start]
cmd = "node scripts/railway-start.mjs"
```

## Railway dashboard checklist

| Setting | Value |
|---------|-------|
| Root Directory | *(empty — monorepo root `/app`)* |
| Builder | Nixpacks |
| Config | `/nixpacks.toml` or `/railway.json` at repo root |
| Start command | `node scripts/railway-start.mjs` *(or leave blank to use nixpacks)* |
| Health check | `/api/health/ready` |

**Critical:** Root Directory must be empty. If set to `apps/api`, monorepo packages are not deployed and deploy step cannot run.

## Env vars (founder)

`DATABASE_URL`, `REDIS_URL`, Clerk keys, `SENTRY_DSN` — required for healthy readiness, not for module resolution.

## Hypothesis matrix

| ID | Hypothesis | Result |
|----|------------|--------|
| A | dist built but wiped by Nixpacks final COPY | **Confirmed** |
| B | dist never built | Fixed earlier via turbo graph + verify:dist |
| C | pnpm prune removed workspace dist | Rejected — no prod-only prune in nixpacks |
| D | wrong start cwd | Secondary — start now uses `/app/deploy` bundle |

## Local verification

```powershell
pnpm build
pnpm deploy:api
pnpm verify:deploy
pnpm start:prod:railway
# or from repo root after deploy:
node -e "process.chdir('deploy'); console.log(require.resolve('@tsc/database'))"
```

## Post-deploy verification

```bash
curl https://api.theshakticollective.in/api/health/live
curl https://api.theshakticollective.in/api/health/ready
```

Build logs should show:

```
[verify:dist] OK — 11 artifacts present
[verify:deploy] OK — 6 artifacts in /app/deploy
```

## Status

Deploy-bundle fix applied. Redeploy required.
