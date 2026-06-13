# Production Deployment

[← Master index](../MASTER.md)

> **Canonical production stack:** Railway (API) + Vercel (frontends) + Neon (Postgres) + Upstash (Redis).  
> **Not Render** — prod is Railway + Vercel (see [production-deploy.md](production-deploy.md)).

---

## Production Topology

```mermaid
flowchart TB
    subgraph dns["Cloudflare DNS — theshakticollective.in"]
        APEX["@ / www"]
        API_DNS["api"]
        API_STG["api-staging"]
        COMM["community"]
        CK["coreknot"]
        DOCS["docs"]
    end

    subgraph vercel["Vercel"]
        WEB["tsc-web"]
        COMM_APP["tsc-community"]
        CK_APP["tsc-coreknot"]
        DOCS_APP["tsc-docs"]
    end

    subgraph railway["Railway"]
        API_PROD["tsc-api-prod<br/>main branch"]
        API_STG["tsc-api-staging<br/>develop branch"]
    end

    subgraph data["Managed data"]
        NEON[("Neon PostgreSQL")]
        UPSTASH[("Upstash Redis")]
        R2["Cloudflare R2"]
        TYPESENSE["Typesense Cloud"]
    end

    subgraph auth["Auth & observability"]
        CLERK["Clerk"]
        SENTRY["Sentry"]
        POSTHOG["PostHog"]
    end

    APEX --> WEB
    COMM --> COMM_APP
    CK --> CK_APP
    DOCS --> DOCS_APP
    API_DNS --> API_PROD
    API_STG --> API_STG

    COMM_APP --> API_PROD
    CK_APP --> API_PROD
    WEB -.-> API_PROD

    API_PROD --> NEON
    API_PROD --> UPSTASH
    API_PROD --> R2
    API_PROD --> TYPESENSE
    API_PROD --> CLERK

    API_STG --> NEON
    API_STG --> UPSTASH

    VERCEL --> SENTRY
    VERCEL --> POSTHOG
    RAILWAY --> SENTRY
    RAILWAY --> POSTHOG
```

---

## Service Matrix

| Service | Host | Repo (target) | Production domain |
|---------|------|---------------|-------------------|
| API | Railway | `The-Shakti-Collective/tsc-api` | `api.theshakticollective.in` |
| API staging | Railway | `develop` branch | `api-staging.theshakticollective.in` |
| Community | Vercel | `tsc-community` | `community.theshakticollective.in` |
| CoreKnot | Vercel | `tsc-coreknot` | `coreknot.theshakticollective.in` |
| Marketing web | Vercel | `tsc-web` | `theshakticollective.in` |
| Docs | Vercel | `tsc-docs` | `docs.theshakticollective.in` |
| Postgres | Neon | — | Pooled connection per env |
| Redis | Upstash | — | `rediss://` per env |
| Assets | Cloudflare R2 | — | `tsc-assets` bucket |
| Search | Typesense Cloud | — | Per-env cluster |
| DNS | Cloudflare | — | Zone `theshakticollective.in` |

---

## Deploy Flow

```mermaid
flowchart LR
    subgraph phase1["Phase 1 — Monorepo healthy"]
        BUILD["pnpm build = 0"]
    end

    subgraph phase2["Phase 2 — Extract repos"]
        INFRA["tsc-infra"]
        SHARED["tsc-shared publish"]
        API_R["tsc-api"]
        FE["tsc-community + tsc-coreknot"]
        DOC["tsc-docs + tsc-web"]
    end

    subgraph phase3["Phase 3 — Platform wiring"]
        NEON_SETUP["Neon branches"]
        UPSTASH_SETUP["Upstash instances"]
        RAILWAY_SETUP["Railway services"]
        VERCEL_SETUP["Vercel projects"]
        DNS_SETUP["Cloudflare records"]
    end

    BUILD --> INFRA
    INFRA --> SHARED
    SHARED --> API_R
    API_R --> FE
    FE --> DOC
    DOC --> NEON_SETUP
    NEON_SETUP --> UPSTASH_SETUP
    UPSTASH_SETUP --> RAILWAY_SETUP
    RAILWAY_SETUP --> VERCEL_SETUP
    VERCEL_SETUP --> DNS_SETUP
```

Full checklist: [setup-runbook.md](../operations/setup-runbook.md)

---

## Railway (API)

### Setup

1. Create Railway project
2. Link `The-Shakti-Collective/tsc-api` GitHub repo
3. Two services:

| Service | Branch | Domain |
|---------|--------|--------|
| `tsc-api-staging` | `develop` | `api-staging.theshakticollective.in` |
| `tsc-api-prod` | `main` | `api.theshakticollective.in` |

4. Build command: `pnpm install && pnpm build` (monorepo extract may differ)
5. Start command: `node dist/main.js`
6. Bind: `0.0.0.0:$PORT` (already in `main.ts`)

### Health check

Until global health exists, configure Railway health path:

```
/api/feed/health
```

Runbook also references `/health` or `/api/health` — **not implemented** in current codebase.

### Database migrations (prod)

```bash
pnpm prisma migrate deploy
```

Run against Neon prod branch during deploy (Railway pre-deploy hook or manual).

Scaffold: `org-scaffold/tsc-api/railway.json`

---

## Vercel (Frontends)

| Project | Framework | Root directory (post-extract) |
|---------|-----------|-------------------------------|
| tsc-community | Next.js | `apps/community` or repo root |
| tsc-coreknot | Vite/Next TBD | `apps/coreknot/client` |
| tsc-web | Next.js SSG | greenfield |
| tsc-docs | Static / Next | OpenAPI viewer |

Import repos at [vercel.com/new](https://vercel.com/new). Set env vars per environment (Production / Preview / Development).

Scaffolds: `org-scaffold/tsc-*/vercel.json`

---

## Neon (PostgreSQL)

| Branch | Maps to | Railway service |
|--------|---------|-----------------|
| `dev` | Local developers | — |
| `staging` | `develop` deploys | tsc-api-staging |
| `prod` / `main` | `main` deploys | tsc-api-prod |

Connection string format:

```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/db?sslmode=require
```

Use **pooled** connection string for serverless/Railway.

---

## Upstash (Redis)

Purpose: BullMQ job queues for API.

```
REDIS_URL=rediss://default:TOKEN@endpoint.upstash.io:6379
```

Create separate instances: `tsc-staging`, `tsc-prod`.

---

## Cloudflare

### DNS records (summary)

| Type | Name | Target |
|------|------|--------|
| CNAME | `api` | Railway prod CNAME |
| CNAME | `api-staging` | Railway staging CNAME |
| CNAME | `community`, `coreknot`, `docs` | Vercel |
| A/CNAME | `@` | Vercel apex |
| CNAME | `www` | Vercel |

SSL/TLS: Full (strict). Redirect `www` → apex.

### R2 (file storage)

```
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=tsc-assets
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
```

Never store uploads on Railway ephemeral disk.

---

## Supporting Services

| Service | Purpose | Config location |
|---------|---------|-----------------|
| Clerk | Auth (Google, email OTP, phone) | Railway + Vercel |
| Typesense | Full-text search | Railway env |
| Sentry | Error monitoring | All apps |
| PostHog | Product analytics | API + frontends |

---

## GitHub Org

**Org:** [The-Shakti-Collective](https://github.com/The-Shakti-Collective)

Seven target repos — see [ci-cd.md](../operations/ci-cd.md) and `org-scaffold/README.md`.

---

## Monorepo → Multi-repo Status

The live monorepo at `TSC Platform/` is still the development SSOT. Production deploy from monorepo directly is possible but **not** the documented target architecture. Migration blocked until `pnpm build` passes reliably.

---

## Related

- [env-vars.md](env-vars.md)
- [setup-runbook.md](../operations/setup-runbook.md)
- [known-gaps.md](../decisions/known-gaps.md)
