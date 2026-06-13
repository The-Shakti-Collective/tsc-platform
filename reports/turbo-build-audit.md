# Turborepo Build Audit

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Turborepo

## turbo.json

```json
"build": {
  "dependsOn": ["^build"],
  "outputs": ["dist/**", ".next/**"]
}
```

`^build` = run `build` in **all workspace dependencies** before each package's own `build`. Correct for monorepo.

## Root build script

| Before | After |
|--------|-------|
| `pnpm -r --filter "./packages/*" --filter "@tsc/api" run build` | `turbo run build --filter=@tsc/api...` |

### Why change?

- Turbo respects `dependsOn: ^build` with caching and deterministic ordering
- `@tsc/api...` includes only packages reachable from API (faster than building all 15 packages when unnecessary)
- Previous pnpm `-r` filter built packages + api but **parallel races** possible when dependency order not strict

## Package build scripts

| Package | Script |
|---------|--------|
| `@tsc/database` | `prisma generate && tsc` |
| All other `packages/*` | `tsc` |
| `@tsc/api` | `nest build` |

## Required dist before API start

```
packages/database/dist/index.js
packages/database/dist/client.js
packages/constants/dist/index.js
packages/types/dist/index.js
packages/contracts/dist/index.js
packages/permissions/dist/index.js
packages/analytics/dist/index.js
packages/workspace/dist/index.js
packages/projects/dist/index.js
packages/tasks/dist/index.js
apps/api/dist/main.js
```

Enforced by `scripts/verify-workspace-dist.mjs` (`pnpm verify:dist`).

## CI alignment

- `.github/workflows/build.yml` — `pnpm build` + `pnpm verify:dist`
- `.github/workflows/runtime-validation.yml` — full artifact + require smoke test

## Status

Turbo graph configured correctly. Root build script now uses turbo filter for API dependency closure.
