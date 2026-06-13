# Data Flow

[← Master index](../MASTER.md)

## Request Flow (Typical Read)

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as NestJS Controller
    participant SVC as Service
    participant REPO as Repository
    participant PRISMA as Prisma Client
    participant PG as PostgreSQL

    UI->>API: GET /api/profile/:id
    API->>SVC: validate + authorize
    SVC->>REPO: findProfile(id)
    REPO->>PRISMA: prisma.person.findUnique(...)
    PRISMA->>PG: SQL query
    PG-->>PRISMA: rows
    PRISMA-->>REPO: typed model
    REPO-->>SVC: domain object
    SVC-->>API: DTO
    API-->>UI: JSON response
```

Community app uses `@tsc/community-sdk` (built on `@tsc/contracts` + `@tsc/types`) for typed API calls via `use-community-client.ts`.

---

## Write Flow with Optional Queue

```mermaid
sequenceDiagram
    participant UI as Frontend
    participant API as NestJS
    participant SVC as Service
    participant PG as PostgreSQL
    participant Q as QueueRegistry
    participant REDIS as Redis / Upstash

    UI->>API: POST /api/feed/...
    API->>SVC: handle mutation
    SVC->>PG: prisma transaction
    SVC->>Q: enqueueFeedStub(...)

    alt REDIS_URL set
        Q->>REDIS: BullMQ job add
        REDIS-->>Q: job id
    else REDIS_URL empty
        Q->>Q: return null (no-op)
    end

    API-->>UI: 201 + payload
```

Stub queue behavior is in `apps/api/src/queues/queue-registry.service.ts`: when `REDIS_URL` is unset, all queue handles are `null` and enqueue methods return `null` without error.

---

## Database Access Pattern

```mermaid
flowchart TB
    subgraph consumers["Consumers"]
        API_MOD["API modules<br/>*.repository.ts"]
        PKG["@tsc/* packages<br/>graph, reputation, …"]
    end

    subgraph database_pkg["@tsc/database"]
        INDEX["index.ts — exports"]
        CLIENT["client.ts — Prisma singleton"]
        PRISMA["prisma/schema.prisma"]
    end

    subgraph prisma_mod["apps/api PrismaModule"]
        PROVIDER["PrismaService injection"]
    end

    API_MOD --> PROVIDER
    PKG --> CLIENT
    PROVIDER --> CLIENT
    CLIENT --> PRISMA
    PRISMA --> NEON[("PostgreSQL")]
```

**Schema location:** `packages/database/prisma/schema.prisma`  
**Canonical comment:** "Stage 1 Step 1 merged schema" with phase fragments in `prisma/phase*.prisma` for audit.

---

## Redis / BullMQ Queues

| Queue name constant | Purpose |
|---------------------|---------|
| `feed` | Feed-related async jobs |
| `reputation` | Reputation recalculation |
| `graph` | Graph edge maintenance |
| `recommendation` | Recommendation engine jobs |

```mermaid
flowchart LR
    API["API mutation"] --> REG["QueueRegistryService"]
    REG --> FEED_Q["feed queue"]
    REG --> REP_Q["reputation queue"]
    REG --> GRAPH_Q["graph queue"]
    REG --> REC_Q["recommendation queue"]
    FEED_Q --> REDIS[("Redis")]
    REP_Q --> REDIS
    GRAPH_Q --> REDIS
    REC_Q --> REDIS
```

Local: `redis://localhost:6379` via Docker.  
Production: `rediss://` Upstash URL.  
Dev without Redis: queues disabled, HTTP + Postgres still work.

---

## Frontend → API Connectivity

### Community (Next.js)

```mermaid
flowchart LR
    COMM["apps/community<br/>:3000"]
    ENV["NEXT_PUBLIC_API_URL<br/>http://localhost:4000/api"]
    API["apps/api :4000"]

    COMM -->|"browser fetch"| ENV
    ENV --> API
```

Env synced from root `.env` → `apps/community/.env.local` by setup scripts.

### CoreKnot (Vite)

```mermaid
flowchart LR
    CK["apps/coreknot/client<br/>:3001"]
    PROXY["Vite proxy /api"]
    API["apps/api :4000"]

    CK -->|"relative /api/*"| PROXY
    PROXY --> API
```

Configured in `apps/coreknot/client/vite.config.js`:

```javascript
proxy: { '/api': { target: 'http://localhost:4000', changeOrigin: true } }
```

### CORS

API reads `CORS_ORIGIN` (comma-separated). `start-stack.ps1` sets origin per target:

| Target | CORS origin |
|--------|-------------|
| community | `http://localhost:3000` |
| coreknot | `http://localhost:3001` |
| website | `http://localhost:3002` |
| all | all three comma-separated |

---

## Sync / CoreKnot Bridge (Optional)

```mermaid
flowchart LR
    API["@tsc/api"]
    SYNC["sync module"]
    LEGACY["COREKNOT_SYNC_URL<br/>legacy server :3001"]

    API --> SYNC
    SYNC -.->|"optional"| LEGACY
```

Env vars (optional, commented in `.env.example`):

- `COREKNOT_SYNC_URL`
- `COREKNOT_SYNC_SECRET`

Used when a legacy CoreKnot server runs alongside the new API during migration.

---

## Analytics Data Flow

```mermaid
flowchart TB
    FE["Frontends"] -->|"NEXT_PUBLIC_POSTHOG_KEY"| PH_CLIENT["PostHog JS"]
    API -->|"POSTHOG_PROJECT_TOKEN"| PH_SERVER["posthog.service.ts"]
    PH_CLIENT --> POSTHOG[("PostHog cloud")]
    PH_SERVER --> POSTHOG
```

Both paths are optional — empty keys disable tracking.

---

## Production Data Path

```mermaid
flowchart TB
    USER["User"] --> VERCEL["Vercel edge"]
    VERCEL --> RAILWAY["Railway API"]
    RAILWAY --> NEON[("Neon Postgres")]
    RAILWAY --> UPSTASH[("Upstash Redis")]
    RAILWAY --> R2["Cloudflare R2<br/>file uploads"]
    RAILWAY --> TYPESENSE["Typesense<br/>search index"]
```

See [production-deploy.md](../infrastructure/production-deploy.md).

---

## Related

- [database.md](../packages/database.md)
- [api.md](../apps/api.md)
- [env-vars.md](../infrastructure/env-vars.md)
