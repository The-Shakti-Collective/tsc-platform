# Runtime Architecture Audit

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Lead Architect

## Workspace graph

| Layer | Packages |
|-------|----------|
| Data | `@tsc/database` |
| Foundation | `@tsc/constants`, `@tsc/types`, `@tsc/contracts`, `@tsc/permissions` |
| Domain libs | `@tsc/analytics`, `@tsc/workspace`, `@tsc/projects`, `@tsc/tasks`, `@tsc/graph`, `@tsc/reputation`, `@tsc/search`, `@tsc/ui`, `@tsc/community-sdk` |
| Runtime app | `@tsc/api` (NestJS, CommonJS output) |

`pnpm-workspace.yaml` includes `apps/*`, `apps/coreknot/client`, `packages/*`.

## Build order (correct)

Turbo `build` task uses `dependsOn: ["^build"]` — dependents wait for upstream `dist/`.

Root build script (fixed):

```json
"build": "turbo run build --filter=@tsc/api..."
```

The `...` suffix builds **all transitive workspace dependencies** of `@tsc/api` before the API itself.

### API direct workspace deps

`@tsc/analytics`, `@tsc/constants`, `@tsc/contracts`, `@tsc/database`, `@tsc/permissions`, `@tsc/projects`, `@tsc/tasks`, `@tsc/types`, `@tsc/workspace`

Each of these must emit `dist/index.js` (and `@tsc/database` also `dist/client.js`) before `nest build` completes.

## Runtime vs compile-only

| Kind | Examples | Railway runtime |
|------|----------|-----------------|
| Runtime deps | `@nestjs/*`, `@prisma/client`, `bullmq`, workspace `dist/` | Required |
| Build-only | `prisma` CLI, `typescript`, `@nestjs/cli`, `@swc/*` | Needed at build; not at start |
| Dev stub | `TSC_AUTH_STUB` | Optional prod bypass |

**Not standalone:** API is not bundled. Compiled `apps/api/dist/*.js` uses `require("@tsc/database")` at runtime. Workspace symlinks under `node_modules/@tsc/*` must point to packages whose `dist/` exists in the deployed image.

## Railway image contents

With monorepo root as service root:

- Full repo retained after Nixpacks build (no `pnpm deploy` prune).
- `node_modules/@tsc/database` → symlink to `packages/database`.
- Runtime crash when `packages/database/dist/index.js` missing — even if `apps/api/dist` exists.

## Missing packages in image?

No packages are omitted from install. Failure mode is **missing `dist/` artifacts**, not missing workspace entries.

## Recommendations applied

1. `turbo run build --filter=@tsc/api...` at root
2. `"files": ["dist"]` on all workspace packages (pack/deploy safety)
3. `pnpm verify:dist` post-build gate in Nixpacks + CI
4. `pnpm db:generate` before build on Railway

## Status

Architecture supports monorepo-root Railway deploy when full dependency graph is built before start.
