# 04 — Runtime Recovery

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Order** | 4 of 15 |

## Mission

Start and verify local dev stack: API :4000, Community :3000, CoreKnot :3001 — health endpoints return 200.

## Input

- Agents 02 (typecheck) and 03 (auth) complete or non-blocking
- `package.json` scripts: `dev:api`, `dev:community`, `dev:coreknot`, `start:community`
- `docker-compose.yml` for Postgres/Redis

## Tasks

1. Free ports: `pnpm kill:ports` if needed.
2. Start infra: `pnpm start:infra` or Docker Compose for Postgres :5432, Redis :6379.
3. Boot API: `pnpm dev:api` — confirm listen on :4000, no ProfileModule circular crash.
4. Hit health: `/api/feed/health`, `/api/health`, `/api/health/ready` (note MISSING global health).
5. Start Community: `pnpm dev:community` — verify page or `/api/health` 200.
6. Start CoreKnot: `pnpm dev:coreknot` — verify `/health.json` or preview 200.
7. Document BullMQ stub vs live mode based on `REDIS_URL`.
8. Capture runtime log excerpts for any BROKEN service in deliverable.

## Verification commands

```powershell
pnpm kill:ports
pnpm start:infra
docker compose ps
pnpm dev:api
Invoke-RestMethod http://127.0.0.1:4000/api/feed/health
pnpm dev:community
Invoke-RestMethod http://127.0.0.1:3000/api/health -ErrorAction SilentlyContinue
pnpm dev:coreknot
Invoke-WebRequest http://127.0.0.1:3001/health.json -UseBasicParsing -ErrorAction SilentlyContinue
```

## Deliverable path

`.agents/reports/execution/04-runtime-recovery.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| API | `GET :4000/api/feed/health` → 200 |
| Community | Responds on :3000 without boot failure |
| CoreKnot | Responds on :3001 |
| Infra | Postgres reachable; Redis documented stub/live |
| Report | Each service WORKING / PARTIAL / BROKEN |
