# 10 — Search Infrastructure

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P1 |
| **Order** | 10 of 15 |

## Mission

Configure Typesense for entity search: env vars, index schemas, API module wiring, health ping.

## Input

- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) step 7
- `TYPESENSE_*` env vars (currently MISSING locally)
- API search-related modules

## Tasks

1. Document Typesense host/key requirements for founder.
2. Add local Docker option or cloud cluster connection in `.env.example`.
3. Wire API search module to Typesense client with graceful degrade when unset.
4. Define collections/schemas for profiles, events, opportunities (minimum one).
5. Implement index-on-write or batch reindex script.
6. Add health check endpoint or infra probe for Typesense ping.
7. Verify search query returns results in dev when configured.

## Verification commands

```powershell
Select-String -Path .env -Pattern "TYPESENSE" -ErrorAction SilentlyContinue
rg "typesense|Typesense" apps/api packages
pnpm --filter @tsc/api build
docker compose ps
# When configured:
# Invoke-RestMethod "$env:TYPESENSE_PROTOCOL://$env:TYPESENSE_HOST/health"
```

## Deliverable path

`.agents/reports/execution/10-search-infra.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Env documented | All `TYPESENSE_*` in environment-matrix |
| API wiring | Module loads; fails soft without keys |
| Index | At least one collection created and populated |
| Search | Sample query returns hits when infra up |
| Founder gap | Clear if step 7 incomplete |
