# Database Package Audit

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Database

## Package layout

```
packages/database/
  package.json      # exports, files, build script
  prisma/schema.prisma
  src/
    index.ts        # public API re-exports
    client.ts       # PrismaClient re-export
    …domain modules
  dist/             # tsc output (required at runtime)
```

## Build pipeline

```json
"build": "prisma generate && tsc"
```

1. `prisma generate` — creates `@prisma/client` types for schema
2. `tsc` — emits ESM `dist/*.js` with NodeNext resolution

## Exports

| Subpath | File | Consumer |
|---------|------|----------|
| `@tsc/database` | `dist/index.js` | API services, types, helpers |
| `@tsc/database/client` | `dist/client.js` | `PrismaService` |

## NodeNext compatibility

- `tsconfig.json`: `"module": "NodeNext"`, `"moduleResolution": "NodeNext"`
- Source imports use `.js` extensions (e.g. `./relationship.js`)
- Output is native ESM (`"type": "module"`)

## package.json (verified)

```json
{
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "files": ["dist"],
  "exports": {
    ".": { "types": "./dist/index.d.ts", "default": "./dist/index.js" },
    "./client": { "types": "./dist/client.d.ts", "default": "./dist/client.js" }
  }
}
```

## Prisma on Railway

- `prisma` is devDependency — available during Nixpacks build (full install)
- `@prisma/client` is runtime dependency — present after install
- `pnpm db:generate` added to nixpacks build phase as safety net

## Local Windows issues

- `prisma generate` may fail: `fast-check` module corruption, EPERM on `.prisma` client, OneDrive file locks
- Workaround documented in `reports/local-dev-recovery.md`
- Does not affect Linux Railway builds

## Status

Database package correctly configured. Railway failure = missing `dist/` from skipped workspace build.
