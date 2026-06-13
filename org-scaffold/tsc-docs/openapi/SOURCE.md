# OpenAPI source pointer

| Field | Value |
|-------|-------|
| Generated from | `TheShaktiCollective/tsc-api` |
| Command | `pnpm openapi:export` (add to tsc-api during migration) |
| Output path in api repo | `openapi/tsc-api.openapi.json` |
| Sync to docs | CI artifact download or `scripts/sync-openapi.sh` |

Do not commit stale specs. Regenerate on every API release.

## Placeholder

Until export script exists in tsc-api, use monorepo:

```
packages/database/ + apps/api/ → manual Swagger at /api/docs
```

Copy exported JSON to `openapi/tsc-api.openapi.json` when ready.
