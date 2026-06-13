# Local Development Infrastructure

[← Master index](../MASTER.md)

## Prerequisites

| Tool | Version | Required |
|------|---------|----------|
| Node.js | 20+ | Yes |
| pnpm | 9.15+ | Yes (`corepack enable`) |
| Docker Desktop | 4.x | Optional (recommended) |
| PowerShell | 5.1+ | Windows scripts |

---

## Port Map

```mermaid
flowchart LR
    C["Community :3000"]
    K["CoreKnot :3001"]
    W["Website :3002"]
    A["API :4000"]
    P["Postgres :5432"]
    R["Redis :6379"]
    S["Prisma Studio :5555"]

    C --> A
    K --> A
    W -.-> A
    A --> P
    A --> R
```

| Service | Port | Package / container |
|---------|------|---------------------|
| Community | 3000 | `@tsc/community` |
| CoreKnot | 3001 | `@tsc/coreknot-client` |
| Website (stub) | 3002 | Not in monorepo |
| API | 4000 | `@tsc/api` |
| Postgres | 5432 | `tsc-postgres` container |
| Redis | 6379 | `tsc-redis` container |
| Prisma Studio | 5555 | `pnpm db:studio` |

---

## Docker Compose

File: `docker-compose.yml`

```mermaid
flowchart TB
    COMPOSE["docker compose"]
    COMPOSE --> PG["postgres:16-alpine<br/>tsc-postgres"]
    COMPOSE --> REDIS["redis:7-alpine<br/>tsc-redis"]
    
    PG --> VOL1["tsc_postgres_data"]
    REDIS --> VOL2["tsc_redis_data"]
```

| Service | Image | Credentials |
|---------|-------|-------------|
| Postgres | postgres:16-alpine | `postgres` / `postgres`, DB `tsc_community` |
| Redis | redis:7-alpine | no auth locally |

Commands:

```powershell
pnpm start:infra    # smart start (alias: pnpm infra:up)
pnpm infra:down     # docker compose down
pnpm stop           # stop.ps1
docker compose ps   # verify health
```

---

## Smart Infra (`start-infra.ps1`)

Unlike `setup.ps1`, `start-infra.ps1` reads `.env` and selectively starts containers:

```mermaid
flowchart TD
    START["start-infra.ps1"]
    DOCKER{"Docker available?"}
    SKIP["TSC_SKIP_DOCKER=true?"]
    NEON{"DATABASE_URL has neon.tech?"}
    REMOTE{"REDIS_URL remote/empty?"}

    START --> SKIP
    SKIP -->|yes| EXIT["Exit 0 + guidance"]
    SKIP -->|no| DOCKER
    DOCKER -->|no| EXIT
    DOCKER -->|yes| NEON
    NEON -->|yes| SKIP_PG["Skip Postgres container"]
    NEON -->|no| START_PG["Start Postgres"]
    START_PG --> REMOTE
    SKIP_PG --> REMOTE
    REMOTE -->|Upstash/rediss| SKIP_REDIS["Skip Redis container"]
    REMOTE -->|localhost:6379| START_REDIS["Start Redis"]
    REMOTE -->|empty| SKIP_REDIS
```

Status messages printed:

- `Neon = DB OK` — remote Postgres
- `Redis = remote OK` — Upstash/cloud
- `Redis = skipped` — stub queue mode

---

## Setup vs Start: Fragility

| Script | Docker behavior | Issue |
|--------|-----------------|-------|
| `setup.ps1` | Always `docker compose up -d` if docker exists | No Neon/Upstash awareness |
| `start-infra.ps1` | Smart service selection | Preferred for daily dev |

**Recommendation:** After initial `pnpm setup`, use `pnpm start:infra` or let `start-stack.ps1` call infra — not re-run full setup.

---

## Start Commands

### Full stacks (infra + API + frontend)

```powershell
pnpm start:community     # default pnpm start
pnpm start:coreknot
pnpm start:website
pnpm start:all
```

### Variants

| Command | Difference |
|---------|------------|
| `start:coreknot:single` | One terminal via `concurrently` |
| `start:*:nodocker` | `-SkipInfra` flag |
| `start:coreknot:nodocker` | Also `-KillPorts` |

### Frontend + API only (infra already up)

```powershell
pnpm dev:stack:community
pnpm dev:stack:coreknot
pnpm dev:stack:website
```

### Manual two-terminal

```powershell
# Terminal 1
pnpm dev:api

# Terminal 2
pnpm dev:community   # or dev:coreknot
```

---

## Startup Sequence

```mermaid
sequenceDiagram
    participant SS as start-stack.ps1
    participant INF as start-infra.ps1
    participant KILL as kill-ports (optional)
    participant API as run-api-dev.ps1
    participant H as /api/feed/health
    participant FE as run-frontend-dev.ps1
    participant BR as Browser

    SS->>KILL: TSC_KILL_PORTS=true
    SS->>INF: unless -SkipInfra
    SS->>API: new PS window
    API->>H: poll 60s
    H-->>API: 200
    SS->>FE: new PS window
    SS->>BR: TSC_OPEN_BROWSER=true
```

API logs when using separate window: `logs/api-dev.log`

---

## No Docker Path

When virtualization unavailable or `TSC_SKIP_DOCKER=true`:

```powershell
# .env
DATABASE_URL=postgresql://...@ep-xxx.neon.tech/...?sslmode=require
REDIS_URL=                    # empty = stub queues
TSC_SKIP_DOCKER=true          # optional silence

pnpm start:coreknot:nodocker
# or
pnpm db:push    # first time with Neon
pnpm dev:api
pnpm dev:coreknot
```

---

## Hybrid Local Setup (Common)

```
Frontend :3000-3001  →  API :4000  →  Neon Postgres (remote)
                                   →  Docker Redis :6379 (local BullMQ)
```

Set `DATABASE_URL` to Neon, keep `REDIS_URL=redis://localhost:6379`, run `pnpm start:infra` for Redis only.

---

## Port Cleanup

```powershell
pnpm kill:ports              # 3000, 3001, 3002, 4000
pnpm kill:port 4000            # single port
```

`start-stack.ps1` auto-kills when `TSC_KILL_PORTS=true` (default).

**Critical:** Do not run `pnpm dev:api` while `start:*` already launched API in another window.

---

## Unix Scripts

| Windows | Unix |
|---------|------|
| `pnpm setup` | `pnpm setup:unix` / `scripts/setup.sh` |
| `pnpm start:community` | `pnpm start:unix` / `scripts/start-stack.sh` |

---

## Cursor Slash Commands

`.cursor/commands/` maps to `pnpm start:*`:

- `/start community`
- `/start coreknot`
- `/start website`
- `/start all`

---

## Related

- [setup-runbook.md](../operations/setup-runbook.md)
- [troubleshooting.md](../operations/troubleshooting.md)
- [env-vars.md](env-vars.md)
