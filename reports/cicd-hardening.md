# CI/CD Hardening

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** CI/CD

## New workflow

**`.github/workflows/runtime-validation.yml`**

| Step | Purpose |
|------|---------|
| `pnpm db:generate` | Prisma client before compile |
| `pnpm build` | Turbo API dependency graph |
| `pnpm verify:dist` | Assert all required `dist/` files exist |
| `require.resolve('@tsc/database')` | Module resolution smoke test |
| `require('@tsc/database')` | Export smoke test |
| `timeout 8s node dist/main.js` | Boot smoke (exit on timeout OK without DB) |

Uses Node 20 (matches `nixpacks.toml` `nodejs_20`).

## Updated workflow

**`.github/workflows/build.yml`**

Added `pnpm verify:dist` after `pnpm build`.

## New script

**`scripts/verify-workspace-dist.mjs`**

Exits non-zero if any required artifact missing:

- `packages/database/dist/index.js`
- `packages/database/dist/client.js`
- All direct API workspace package `dist/index.js`
- `apps/api/dist/main.js`

## Root package.json scripts

```json
"build": "turbo run build --filter=@tsc/api...",
"verify:dist": "node scripts/verify-workspace-dist.mjs"
```

## Railway parity

Nixpacks build phase mirrors CI:

```
pnpm db:generate → pnpm build → pnpm verify:dist
```

## Recommended follow-ups

1. Add `runtime-validation` as required check in branch protection
2. Wire `TURBO_TOKEN` for remote cache (already in build.yml env)
3. Post-deploy: `pnpm sweep:prod` against `api.theshakticollective.in`

## Status

CI now catches missing workspace `dist/` before merge/deploy.
