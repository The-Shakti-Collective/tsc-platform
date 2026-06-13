# Local Environment Sweep

[← Hierarchy](../multi-agent-hierarchy.md)

Runbook for verifying local dev stack health. Invoked by `pnpm sweep:local` or manually by agents during daily checks.

---

## Prerequisites

- Node 20+, pnpm 9.15+
- `.env` present (from `.env.example`)
- Optional: Docker Desktop for local Postgres/Redis

---

## Agents invoked

| Order | Agent | Focus |
|-------|-------|-------|
| 1 | Infrastructure | Postgres, Redis, Typesense, Storage, Auth |
| 2 | Backend | `@tsc/api` build + runtime |
| 3 | Frontend | Community, CoreKnot, Website |
| 4 | Database | Schema validate, migrations |
| 5 | DevOps | CI workflow files |
| 6 | QA | Smoke HTTP checks |

---

## Step 1 — Infrastructure

**Agent:** Infrastructure Agent

```powershell
# Smart infra (skips Docker if Neon/Upstash configured)
pnpm start:infra

# Or check Docker directly
docker compose ps
docker compose exec postgres pg_isready -U postgres -d tsc_community
docker compose exec redis redis-cli ping
```

| Service | Configured | Running | Status values |
|---------|------------|---------|---------------|
| Postgres | `DATABASE_URL` set | pg_isready / Prisma connect | Configured, Running, Missing, Broken |
| Redis | `REDIS_URL` set or empty | PING or stub mode | |
| Typesense | `TYPESENSE_*` in `.env` | HTTP ping if configured | Missing if unset |
| Storage (R2) | `R2_*` in `.env` | — | Missing if unset |
| Auth | Clerk keys or stub flags | — | Configured / Broken (REPLACE_ME) |

**Remote check (no Docker):**

```powershell
pnpm db:validate
node -e "const Redis=require('ioredis'); const u=process.env.REDIS_URL; if(!u){console.log('Redis: stub mode'); process.exit(0);} new Redis(u).ping().then(r=>console.log('Redis:',r)).catch(e=>{console.error(e); process.exit(1);})"
```

---

## Step 2 — Applications

**Agents:** Backend Agent, Frontend Agent

### tsc-api

```powershell
pnpm --filter @tsc/api build
# Runtime (separate terminal or background):
pnpm dev:api
curl.exe -s -w "\nHTTP:%{http_code}" http://127.0.0.1:4000/api/feed/health
```

| Check | Pass | Fail |
|-------|------|------|
| Build | SWC compile exit 0 | Compile error |
| Runtime | HTTP 200 on health | ProfileModule crash, EADDRINUSE |
| Deployment | N/A locally | — |

### tsc-community

```powershell
pnpm --filter @tsc/community build
curl.exe -s -o NUL -w "HTTP:%{http_code}" http://127.0.0.1:3000/feed
```

### tsc-coreknot

```powershell
pnpm --filter @tsc/coreknot-client build
curl.exe -s -o NUL -w "HTTP:%{http_code}" http://127.0.0.1:3001/health.json
```

### tsc-web (website)

```powershell
pnpm --filter @tsc/website build 2>$null
# Expected: stub or partial — mark MISSING until extracted to org-scaffold/tsc-web
```

---

## Step 3 — Shared packages

**Agent:** CTO Agent (build subset)

```powershell
pnpm --filter @tsc/types build
pnpm --filter @tsc/contracts build
pnpm --filter @tsc/permissions build
pnpm --filter @tsc/constants build
pnpm --filter @tsc/database build
pnpm --filter @tsc/community-sdk build
```

Or full: `pnpm build`

---

## Step 4 — Database

**Agent:** Database Agent

```powershell
pnpm db:validate
pnpm db:generate
pnpm --filter @tsc/database exec prisma migrate status
```

Expected current state: migrations **MISSING** (db:push only).

---

## Step 5 — CI/CD (local file check)

**Agent:** DevOps Agent

```powershell
Test-Path .github/workflows/ci.yml
Test-Path .github/workflows/ci-api.yml
Test-Path .github/workflows/ci-community.yml
Get-ChildItem .github/workflows/*.yml | Select-Object Name
```

| Check | Path |
|-------|------|
| GitHub Actions | `.github/workflows/` |
| Branch protection | GitHub UI (document Missing if not configured) |
| Secrets | `.specify/infrastructure/env-vars.md` |
| Deploy hooks | `org-scaffold/tsc-api/railway.json`, Vercel configs |

---

## Step 6 — QA smoke

**Agent:** QA Agent

Minimum smoke when API + frontends running:

```powershell
curl.exe -fsS http://127.0.0.1:4000/api/feed/health
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3001/
```

---

## Output

1. Copy template: `.specify/agents/reports/templates/local-sweep-report.md`
2. Write to: `.agents/reports/local-sweep-report.md`
3. Append master status block from `_master-status-section.md`
4. Individual agent reports to `.agents/reports/<agent-output>.md` as needed

---

## Automation

```powershell
pnpm sweep:local
# Runs scripts/sweep-local.ps1
```

---

## Known local quirks

| Issue | Mitigation |
|-------|------------|
| Duplicate API on :4000 | `pnpm kill:ports` before start |
| Clerk REPLACE_ME → HTTP 500 | Set stub auth or real keys |
| ProfileModule circular dep | Backend Agent flags BROKEN |
| Website stub | Mark MISSING, not BROKEN |

See [troubleshooting.md](../../operations/troubleshooting.md).
