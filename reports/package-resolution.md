# Package Resolution Audit — @tsc/database

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Package Resolution

## package.json fields (verified)

| Field | Value | Status |
|-------|-------|--------|
| `name` | `@tsc/database` | OK |
| `type` | `module` | OK (ESM package) |
| `main` | `./dist/index.js` | OK |
| `types` | `./dist/index.d.ts` | OK |
| `files` | `["dist"]` | OK (ensures dist included when packed) |
| `exports["."]` | `./dist/index.js` | OK |
| `exports["./client"]` | `./dist/client.js` | OK |

## Build output

Expected after `prisma generate && tsc`:

```
packages/database/dist/
  index.js / index.d.ts
  client.js / client.d.ts
  … (compiled modules)
```

## Resolution test (apps/api context)

```powershell
cd apps/api
node -e "const p=require.resolve('@tsc/database'); console.log(p)"
# → …/packages/database/dist/index.js

node -e "const d=require('@tsc/database'); console.log('OK', typeof d.slugifyWorkspace)"
# → OK function (when dist present)
```

## Error analysis

Railway error:

```
Cannot find module @tsc/database/dist/index.js
```

Node resolves `@tsc/database` via `exports` → `./dist/index.js`, then fails because **file does not exist on disk**. Not an import-path bug in API source — compiled output correctly uses `require("@tsc/database")`.

### Root cause classification

| Hypothesis | Verdict |
|------------|---------|
| A — built but not included | Unlikely (workspace symlink serves full package dir) |
| B — not built | **Primary** — prior `pnpm --filter @tsc/api build` skipped workspace builds |
| C — pruned from image | Unlikely without explicit deploy prune |

## Fixes

1. Root `pnpm build` → turbo graph including all API deps
2. `files: ["dist"]` on workspace packages
3. `verify:dist` fails build if `packages/database/dist/index.js` absent

## Local Windows caveat

`pnpm build` may fail on `prisma generate` (corrupt `fast-check` / EPERM / OneDrive). Does not block Railway (Linux). Run `pnpm db:generate` after clean `pnpm install` if needed.

## Status

Package exports correct. Runtime failure is missing build artifacts, not misconfigured `exports`.
