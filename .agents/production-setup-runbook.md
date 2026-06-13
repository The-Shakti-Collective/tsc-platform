# The Shakti Collective — Production Setup Runbook

> End-to-end guide: monorepo health → GitHub org → multi-repo migration → production deploy.  
> **Do not commit secrets.** Use GitHub Organization secrets and platform env vars only.

Version: 1.0  
Last Updated: June 2026  
Org: [The-Shakti-Collective](https://github.com/The-Shakti-Collective)  
Master architecture: `.agents/shakti-collective-org-setup.md`

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Monorepo health (current blocker)](#2-monorepo-health-current-blocker)
3. [GitHub organization](#3-github-organization)
4. [Migration order](#4-migration-order)
5. [Infrastructure per service](#5-infrastructure-per-service)
6. [Environment matrix](#6-environment-matrix)
7. [First deploy checklist](#7-first-deploy-checklist)
8. [Appendix: bootstrap repos from scaffold](#appendix-bootstrap-repos-from-scaffold)

---

## 1. Prerequisites

Install and authenticate before starting.

| Tool | Minimum version | Purpose | Install |
|------|-----------------|---------|---------|
| **Node.js** | 20 LTS | Build all apps | [nodejs.org](https://nodejs.org/) |
| **pnpm** | 9.x | Monorepo + shared packages | `corepack enable && corepack prepare pnpm@9.15.0 --activate` |
| **Git** | 2.40+ | Version control | [git-scm.com](https://git-scm.com/) |
| **GitHub CLI** | 2.x | Org/repo bootstrap | [cli.github.com](https://cli.github.com/) |
| **Docker Desktop** | 4.x | Local Postgres + Redis | [docker.com](https://www.docker.com/products/docker-desktop/) |
| **Railway account** | — | tsc-api hosting | [railway.app](https://railway.app/) |
| **Vercel account** | — | Frontends + docs | [vercel.com](https://vercel.com/) |
| **Cloudflare account** | — | DNS, CDN, R2 | [cloudflare.com](https://www.cloudflare.com/) |

### Auth checklist

```powershell
# GitHub CLI — org admin required
gh auth login
gh auth status
gh api user/orgs --jq '.[].login'   # confirm The-Shakti-Collective appears

# Optional: Railway CLI
npm i -g @railway/cli
railway login

# Optional: Vercel CLI
npm i -g vercel
vercel login
```

### Accounts to provision (before first deploy)

| Provider | What to create |
|----------|----------------|
| [Neon](https://neon.tech/) | Postgres: `tsc-dev`, `tsc-staging`, `tsc-prod` |
| [Upstash](https://upstash.com/) | Redis: `tsc-staging`, `tsc-prod` (BullMQ) |
| [Cloudflare R2](https://developers.cloudflare.com/r2/) | Bucket `tsc-assets` |
| [Typesense Cloud](https://cloud.typesense.org/) | Cluster for search |
| [Clerk](https://clerk.com/) | App: Google, email OTP, phone OTP |
| [Sentry](https://sentry.io/) | Projects per app |
| [PostHog](https://posthog.com/) | Project + API keys |

---

## 2. Monorepo health (current blocker)

Fix the local monorepo **before** extracting repos. Migration copies broken builds into seven repos.

**Location:** `c:\Users\ragha\OneDrive\Desktop\TSC Platform`

### Health commands (run in order)

```powershell
cd "c:\Users\ragha\OneDrive\Desktop\TSC Platform"

# Install deps
corepack enable
pnpm install

# Database package
pnpm db:validate
pnpm db:generate

# Full workspace build
pnpm build
```

### Expected result

| Command | Expected exit code | Notes |
|---------|-------------------|-------|
| `pnpm install` | 0 | Lockfile: `pnpm-lock.yaml` |
| `pnpm db:validate` | 0 | Prisma schema in `packages/database` |
| `pnpm db:generate` | 0 | Generates client to `packages/database` |
| `pnpm build` | 0 | All 17 workspace packages (per Stage 1 report) |

### Known issues and minimal fixes

Per `.agents/stage1-step1-monorepo-report.md`, these packages historically failed. Fixes were applied 2026-06-13; re-run build to confirm.

| Package | Symptom | Minimal fix |
|---------|---------|-------------|
| `@tsc/analytics` | Missing `utils.js`, `persist.js`, `@tsc/database/client` | Fix import paths; add snapshot stubs; ensure `packages/database` exports `./client` |
| `@tsc/api` | Nest `TS2742` declaration portability | `declaration: false` + SWC builder with `typeCheck: false` (Stage 1); add explicit return types before prod |
| `@tsc/community` | Imports incomplete CoreKnot client | Replace with local stubs until CoreKnot client is extracted |
| `turbo` (Windows) | Native binary fails (DLL) | Use `npx pnpm@9.15.0 build` or install VC++ runtime |

### Local infra (optional, for API dev)

```powershell
pnpm infra:up          # docker compose: Postgres 16 + Redis 7
# or copy org-scaffold/tsc-infra/local/docker-compose.yml
```

Default local connection strings:

```
DATABASE_URL=postgresql://tsc:tsc@localhost:5432/tsc_dev
REDIS_URL=redis://localhost:6379
```

### Gate: do not migrate until

- [ ] `pnpm db:validate` exits 0
- [ ] `pnpm db:generate` exits 0
- [ ] `pnpm build` exits 0
- [ ] Local API smoke test passes (`pnpm dev:api` + health endpoint)

---

## 3. GitHub organization

**Org URL:** https://github.com/The-Shakti-Collective  
**Slug:** `The-Shakti-Collective`

### Repository inventory

| Repo | Visibility | URL |
|------|------------|-----|
| tsc-shared | Private | https://github.com/The-Shakti-Collective/tsc-shared |
| tsc-api | Private | https://github.com/The-Shakti-Collective/tsc-api |
| tsc-coreknot | Private | https://github.com/The-Shakti-Collective/tsc-coreknot |
| tsc-community | Private | https://github.com/The-Shakti-Collective/tsc-community |
| tsc-infra | Private | https://github.com/The-Shakti-Collective/tsc-infra |
| tsc-web | **Public** | https://github.com/The-Shakti-Collective/tsc-web |
| tsc-docs | **Public** | https://github.com/The-Shakti-Collective/tsc-docs |

> **Status:** Repos must be created via `gh` (see Appendix). Agent run on 2026-06-12 could not create repos — `gh` CLI not installed on host.

### Teams

Create in **Organization → Teams** (or via `gh api`):

| Team | Purpose | Default permission pattern |
|------|---------|---------------------------|
| **Owners** | Founders, CTO | `admin` on all repos |
| **Platform** | DevOps, infra | `maintain` on `tsc-infra`, `tsc-api`; `write` elsewhere |
| **Backend** | API, data, jobs | `write` on `tsc-api`, `tsc-shared`; `read` on `tsc-docs` |
| **Frontend** | Next.js, design | `write` on `tsc-coreknot`, `tsc-community`, `tsc-web`; `read` on `tsc-shared` |
| **Community** | Community product | `write` on `tsc-community`; `read` on `tsc-api`, `tsc-shared`, `tsc-docs` |
| **Operations** | Managers, support | `read` on `tsc-coreknot` only |

```bash
ORG=The-Shakti-Collective

gh api orgs/$ORG/teams -f name=Platform -f privacy=closed
gh api orgs/$ORG/teams -f name=Backend -f privacy=closed
gh api orgs/$ORG/teams -f name=Frontend -f privacy=closed
gh api orgs/$ORG/teams -f name=Community -f privacy=closed
gh api orgs/$ORG/teams -f name=Operations -f privacy=closed

# Example: Platform maintain on tsc-infra
gh api orgs/$ORG/teams/Platform/repos/$ORG/tsc-infra -f permission=maintain
```

### Branch protection

Apply to **every application repo** (`tsc-api`, `tsc-coreknot`, `tsc-community`, `tsc-web`, `tsc-shared`, `tsc-docs`). Template: `org-scaffold/tsc-infra/docs/branch-strategy.md`.

#### `main` (production)

- Require pull request, 1 approval (2 for `tsc-api`)
- Required checks: `lint`, `typecheck`, `test`, `build`
- Require branches up to date
- Restrict pushes to Owners + Platform
- No force pushes

#### `develop` (staging)

- Require pull request
- Required checks: `lint`, `typecheck`, `build`
- No force pushes

Configure via **Settings → Branches → Add rule** or:

```bash
gh api repos/$ORG/tsc-api/branches/main/protection \
  --method PUT \
  -f required_status_checks='{"strict":true,"contexts":["lint","typecheck","test","build"]}' \
  -f enforce_admins=true \
  -f required_pull_request_reviews='{"required_approving_review_count":2}'
```

### Organization secrets (GitHub Actions)

**Organization → Settings → Secrets and variables → Actions**

| Secret | Used by | Description |
|--------|---------|-------------|
| `DATABASE_URL` | CI integration tests | Staging/ephemeral Postgres |
| `REDIS_URL` | CI integration tests | Staging Redis |
| `CLERK_SECRET_KEY` | CI smoke tests | Staging Clerk secret |
| `CLERK_PUBLISHABLE_KEY` | CI (frontends) | Staging publishable key |
| `R2_ACCESS_KEY_ID` | tsc-api CI | Cloudflare R2 access |
| `R2_SECRET_ACCESS_KEY` | tsc-api CI | Cloudflare R2 secret |
| `R2_BUCKET` | tsc-api CI | Bucket name |
| `R2_ENDPOINT` | tsc-api CI | R2 S3-compatible endpoint |
| `TYPESENSE_HOST` | tsc-api CI | Typesense cluster host |
| `TYPESENSE_API_KEY` | tsc-api CI | Typesense admin key |
| `POSTHOG_API_KEY` | API + CI | PostHog project API key |
| `SENTRY_DSN` | All apps CI | Sentry DSN (per-env variants ok) |
| `SENTRY_AUTH_TOKEN` | CI | Source map upload |
| `RAILWAY_TOKEN` | tsc-api deploy | Railway API token |
| `VERCEL_TOKEN` | Frontends deploy | Vercel token |
| `VERCEL_ORG_ID` | Frontends deploy | Vercel team ID |
| `VERCEL_PROJECT_ID_WEB` | tsc-web CI | Vercel project ID |
| `VERCEL_PROJECT_ID_COMMUNITY` | tsc-community CI | Vercel project ID |
| `VERCEL_PROJECT_ID_COREKNOT` | tsc-coreknot CI | Vercel project ID |
| `VERCEL_PROJECT_ID_DOCS` | tsc-docs CI | Vercel project ID |
| `NPM_TOKEN` | tsc-shared publish | PAT with `write:packages` (or use `GITHUB_TOKEN`) |
| `CLOUDFLARE_API_TOKEN` | tsc-infra (optional) | DNS/R2 automation |

Repository-level secrets override org secrets when names collide. Prefer org-level for shared tokens.

---

## 4. Migration order

Execute **in sequence**. Each step depends on the previous.

```
┌─────────────┐
│ Monorepo OK │  pnpm build = 0
└──────┬──────┘
       ▼
┌─────────────┐
│  tsc-infra  │  CI templates, docker-compose, branch docs
└──────┬──────┘
       ▼
┌─────────────┐
│ tsc-shared  │  Extract @tsc/* → GitHub Packages publish
└──────┬──────┘
       ▼
┌─────────────┐
│   tsc-api   │  Railway + Neon + Upstash + Clerk
└──────┬──────┘
       ├──────────────────┐
       ▼                  ▼
┌─────────────┐   ┌──────────────┐
│tsc-coreknot │   │tsc-community │  Vercel, consume @tsc packages
└──────┬──────┘   └──────┬───────┘
       └────────┬────────┘
                ▼
         ┌─────────────┐
         │  tsc-docs   │  OpenAPI publish
         └──────┬──────┘
                ▼
         ┌─────────────┐
         │   tsc-web   │  Marketing site
         └─────────────┘
```

### Step 1 — tsc-infra

1. Create repo (private), push `org-scaffold/tsc-infra/`
2. Copy monorepo `tooling/`, root `scripts/`, `.github/workflows/` templates
3. Land `local/docker-compose.yml` for dev stack
4. Document branch strategy (already in scaffold)
5. Other repos copy CI workflows from `tsc-infra/.github/workflows/`

### Step 2 — tsc-shared

1. Create repo (private), push scaffold
2. Extract from monorepo: `packages/types`, `contracts`, `permissions`, `community-sdk`, `ui`, `constants`
3. Configure `.npmrc` for GitHub Packages (`@tsc:registry=https://npm.pkg.github.com`)
4. Merge to `main` → `publish.yml` publishes `@tsc/*`
5. Verify: `pnpm add @tsc/types` from a test consumer with `GITHUB_TOKEN`

### Step 3 — tsc-api

1. Create repo (private), push scaffold
2. Extract `apps/api/`, `packages/database` (Prisma), internal packages (`graph`, `analytics`, `reputation`, `search`, `workspace`, `projects`, `tasks`)
3. Replace `workspace:*` with published `@tsc/*` semver
4. Wire Railway staging (`develop`) and prod (`main`) services
5. Run Prisma migrations against Neon
6. Smoke test: `GET /health`, Clerk webhook, BullMQ worker

### Step 4 — tsc-coreknot + tsc-community

1. Create repos (private), push scaffolds
2. Extract `apps/coreknot/` and `apps/community/`
3. Add `.npmrc`, depend on `@tsc/types`, `@tsc/contracts`, etc.
4. Link Vercel projects; set env vars per environment matrix (§6)
5. Point `NEXT_PUBLIC_API_URL` at staging API first

### Step 5 — tsc-docs

1. Create repo (public), push scaffold
2. Generate OpenAPI from tsc-api: `org-scaffold/tsc-docs/openapi/tsc-api.openapi.json`
3. Deploy to Vercel at `docs.theshakticollective.in`
4. Set up CI to refresh OpenAPI on api release tags

### Step 6 — tsc-web

1. Create repo (public), push scaffold
2. Greenfield marketing site (Next.js SSG)
3. Deploy apex `theshakticollective.in` + `www` redirect
4. No API dependency required for launch stub

### Post-migration

- Archive monorepo repo after 2-week parallel validation
- Update DNS cutover checklist (§7)
- Rotate any dev secrets used during migration

---

## 5. Infrastructure per service

### Neon — PostgreSQL

**Purpose:** Primary database for tsc-api (95-model Prisma SSOT).

1. Create project at [console.neon.tech](https://console.neon.tech/)
2. Create branches/databases:

| Neon branch | Maps to | Used by |
|-------------|---------|---------|
| `dev` | Local + feature previews | Developers |
| `staging` | `develop` deploys | tsc-api-staging (Railway) |
| `main` / `prod` | `main` deploys | tsc-api-prod (Railway) |

3. Copy connection strings (pooled recommended for serverless):

```
postgresql://user:pass@ep-xxx.region.aws.neon.tech/tsc?sslmode=require
```

4. Set `DATABASE_URL` in Railway per environment
5. Run migrations:

```bash
cd tsc-api
pnpm prisma migrate deploy
```

Docs: [Neon connection strings](https://neon.tech/docs/connect/connect-from-any-app)

---

### Upstash — Redis (BullMQ)

**Purpose:** Job queues, cache, rate limiting for tsc-api.

1. Create database at [console.upstash.com](https://console.upstash.com/)
2. Create `tsc-staging` and `tsc-prod` instances
3. Copy `UPSTASH_REDIS_REST_URL` or classic `rediss://` URL
4. Set `REDIS_URL` in Railway (BullMQ uses ioredis-compatible URL)

```
REDIS_URL=rediss://default:TOKEN@endpoint.upstash.io:6379
```

Docs: [Upstash Redis](https://upstash.com/docs/redis/overall/getstarted)

---

### Cloudflare R2 — asset storage

**Purpose:** User uploads, media, exports. **Never store files in Postgres.**

1. **R2 → Create bucket** `tsc-assets` (or per-env: `tsc-assets-staging`, `tsc-assets-prod`)
2. **Manage R2 API tokens** → create token with Object Read & Write
3. Note endpoint: `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
4. Set in Railway (tsc-api):

```
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET=tsc-assets
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_URL=https://assets.theshakticollective.in   # optional custom domain
```

Docs: [R2 get started](https://developers.cloudflare.com/r2/get-started/)

---

### Typesense Cloud — search

**Purpose:** Artists, events, posts full-text search.

1. Create cluster at [cloud.typesense.org](https://cloud.typesense.org/)
2. Note host: `xxx.a1.typesense.net`
3. Create admin API key
4. Set in Railway:

```
TYPESENSE_HOST=xxx.a1.typesense.net
TYPESENSE_API_KEY=
TYPESENSE_PROTOCOL=https
TYPESENSE_PORT=443
```

5. Run initial index sync from tsc-api worker on deploy

Docs: [Typesense Cloud](https://typesense.org/docs/cloud/)

---

### Clerk — authentication

**Purpose:** Google OAuth, email OTP, phone OTP for all frontends + API JWT validation.

1. Create application at [dashboard.clerk.com](https://dashboard.clerk.com/)
2. Enable sign-in methods: Google, Email (OTP), Phone (OTP)
3. Create **staging** and **production** Clerk apps (or use instances)
4. Configure roles/metadata for TSC permissions (`@tsc/permissions`)
5. Set keys:

| Key | Where |
|-----|-------|
| `CLERK_SECRET_KEY` | tsc-api (Railway), frontends (Vercel server) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel frontends |
| `CLERK_WEBHOOK_SECRET` | tsc-api webhook endpoint |

6. Add allowed origins: all `*.theshakticollective.in` subdomains + Vercel preview URLs
7. Configure JWT template for API if using custom claims

Docs: [Clerk Next.js](https://clerk.com/docs/quickstarts/nextjs)

---

### Railway — tsc-api

**Purpose:** Host NestJS API + background workers.

1. Create project at [railway.app](https://railway.app/)
2. Create two services from `The-Shakti-Collective/tsc-api` repo:

| Service | Branch | Domain |
|---------|--------|--------|
| `tsc-api-staging` | `develop` | `api-staging.theshakticollective.in` |
| `tsc-api-prod` | `main` | `api.theshakticollective.in` |

3. Link GitHub repo; enable auto-deploy
4. Set all env vars (§6) in Railway dashboard
5. Add custom domain → Railway provides CNAME target for Cloudflare
6. Health check path: `/health` or `/api/health`
7. Generate `RAILWAY_TOKEN` for GitHub Actions deploy workflow

Docs: [Railway custom domains](https://docs.railway.app/guides/public-networking#custom-domains)

---

### Vercel — frontends + docs

**Purpose:** tsc-web, tsc-community, tsc-coreknot, tsc-docs.

| Project | Repo | Production domain | Staging |
|---------|------|-------------------|---------|
| tsc-web | tsc-web | `theshakticollective.in` | Preview on `develop` |
| tsc-community | tsc-community | `community.theshakticollective.in` | `community-staging.theshakticollective.in` |
| tsc-coreknot | tsc-coreknot | `coreknot.theshakticollective.in` | `coreknot-staging.theshakticollective.in` |
| tsc-docs | tsc-docs | `docs.theshakticollective.in` | Preview on PRs |

1. Import each GitHub repo in [vercel.com/new](https://vercel.com/new)
2. Framework preset: **Next.js** (docs may be static)
3. Set env vars per environment (Production / Preview / Development)
4. Connect `develop` branch to staging custom domains
5. Copy `VERCEL_ORG_ID` and per-project `VERCEL_PROJECT_ID_*` to GitHub secrets

Docs: [Vercel custom domains](https://vercel.com/docs/projects/domains)

---

### Cloudflare DNS — theshakticollective.in

**Purpose:** Apex + subdomain routing, TLS, CDN.

1. Add site `theshakticollective.in` to Cloudflare
2. Update registrar nameservers to Cloudflare
3. Create DNS records:

| Type | Name | Target | Proxy |
|------|------|--------|-------|
| CNAME | `api` | Railway prod CNAME | DNS only |
| CNAME | `api-staging` | Railway staging CNAME | DNS only |
| CNAME | `community` | `cname.vercel-dns.com` | Proxied |
| CNAME | `community-staging` | Vercel staging CNAME | Proxied |
| CNAME | `coreknot` | `cname.vercel-dns.com` | Proxied |
| CNAME | `coreknot-staging` | Vercel staging CNAME | Proxied |
| CNAME | `docs` | `cname.vercel-dns.com` | Proxied |
| A/CNAME | `@` | Vercel apex (or CNAME flatten) | Proxied |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied |

4. **SSL/TLS** → Full (strict)
5. Redirect `www` → apex (Page Rule or Redirect Rule)
6. Legacy: redirect `theshakticollective.com` → `theshakticollective.in`

Docs: [Cloudflare DNS](https://developers.cloudflare.com/dns/)

---

### Sentry — error monitoring

1. Create organization at [sentry.io](https://sentry.io/)
2. Create projects: `tsc-api`, `tsc-coreknot`, `tsc-community`, `tsc-web`
3. Set `SENTRY_DSN` (server) and `NEXT_PUBLIC_SENTRY_DSN` (client) per app
4. Add `SENTRY_AUTH_TOKEN` to GitHub for source map upload in CI
5. Configure release tracking tied to git SHA

Docs: [Sentry Next.js](https://docs.sentry.io/platforms/javascript/guides/nextjs/)

---

### PostHog — product analytics

1. Create project at [posthog.com](https://posthog.com/)
2. Copy project API key
3. Set `POSTHOG_API_KEY` on tsc-api (server events)
4. Set `NEXT_PUBLIC_POSTHOG_KEY` + `NEXT_PUBLIC_POSTHOG_HOST` on frontends
5. Enable autocapture selectively; respect privacy on community app

Docs: [PostHog Next.js](https://posthog.com/docs/libraries/next-js)

---

## 6. Environment matrix

### URLs by environment

| Service | Dev (local) | Staging | Production |
|---------|-------------|---------|------------|
| **tsc-web** | `http://localhost:3000` | Vercel preview / staging | `https://theshakticollective.in` |
| **tsc-community** | `http://localhost:3001` | `https://community-staging.theshakticollective.in` | `https://community.theshakticollective.in` |
| **tsc-coreknot** | `http://localhost:3002` | `https://coreknot-staging.theshakticollective.in` | `https://coreknot.theshakticollective.in` |
| **tsc-docs** | `http://localhost:3003` | Vercel preview | `https://docs.theshakticollective.in` |
| **tsc-api** | `http://localhost:4000` | `https://api-staging.theshakticollective.in` | `https://api.theshakticollective.in` |

### tsc-api (Railway) env vars

| Variable | Dev | Staging | Prod | Secret? |
|----------|-----|---------|------|---------|
| `NODE_ENV` | `development` | `staging` | `production` | No |
| `PORT` | `4000` | Railway injects | Railway injects | No |
| `DATABASE_URL` | local Neon/dev branch | Neon staging | Neon prod | **Yes** |
| `REDIS_URL` | `redis://localhost:6379` | Upstash staging | Upstash prod | **Yes** |
| `CLERK_SECRET_KEY` | Clerk dev | Clerk staging | Clerk prod | **Yes** |
| `CLERK_WEBHOOK_SECRET` | — | staging secret | prod secret | **Yes** |
| `TYPESENSE_HOST` | local or cloud dev | staging cluster | prod cluster | No |
| `TYPESENSE_API_KEY` | dev key | staging key | prod key | **Yes** |
| `R2_ACCESS_KEY_ID` | dev token | staging token | prod token | **Yes** |
| `R2_SECRET_ACCESS_KEY` | dev token | staging token | prod token | **Yes** |
| `R2_BUCKET` | `tsc-assets-dev` | `tsc-assets-staging` | `tsc-assets-prod` | No |
| `R2_ENDPOINT` | CF account endpoint | same | same | No |
| `SENTRY_DSN` | optional | staging DSN | prod DSN | **Yes** |
| `POSTHOG_API_KEY` | optional | staging key | prod key | **Yes** |
| `CORS_ORIGINS` | `localhost:*` | staging subdomains | prod subdomains | No |

### tsc-coreknot / tsc-community / tsc-web (Vercel) env vars

| Variable | Dev | Staging | Prod | Secret? |
|----------|-----|---------|------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4000` | `https://api-staging.theshakticollective.in` | `https://api.theshakticollective.in` | No |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dev | Clerk staging | Clerk prod | No |
| `CLERK_SECRET_KEY` | Clerk dev | Clerk staging | Clerk prod | **Yes** |
| `NEXT_PUBLIC_POSTHOG_KEY` | optional | staging | prod | No |
| `NEXT_PUBLIC_POSTHOG_HOST` | `https://app.posthog.com` | same | same | No |
| `NEXT_PUBLIC_SENTRY_DSN` | optional | staging | prod | No |
| `SENTRY_AUTH_TOKEN` | — | CI only | CI only | **Yes** |

### tsc-shared (GitHub Packages)

| Variable | Where | Secret? |
|----------|-------|---------|
| `NODE_AUTH_TOKEN` | CI publish (`GITHUB_TOKEN` or `NPM_TOKEN`) | **Yes** |
| `NPM_CONFIG_REGISTRY` | `https://npm.pkg.github.com` | No |

### tsc-docs (Vercel)

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://api.theshakticollective.in` (for try-it console) |
| `OPENAPI_SPEC_URL` | `/openapi/tsc-api.openapi.json` |

---

## 7. First deploy checklist

Tick in order. Do not skip staging.

### Phase A — Local + GitHub

- [ ] Node 20+, pnpm 9, gh CLI, Docker installed
- [ ] `gh auth login` with org admin on `The-Shakti-Collective`
- [ ] All 7 repos created and scaffold pushed (Appendix)
- [ ] Teams created with correct repo permissions
- [ ] Branch protection on `main` + `develop` for all app repos
- [ ] Organization secrets configured (§3)
- [ ] Monorepo: `pnpm install`, `db:validate`, `db:generate`, `build` all pass

### Phase B — Data + platform accounts

- [ ] Neon: dev, staging, prod databases created
- [ ] Upstash: staging + prod Redis created
- [ ] Cloudflare R2 bucket created; API token issued
- [ ] Typesense Cloud cluster provisioned
- [ ] Clerk: staging + prod apps; Google, email OTP, phone OTP enabled
- [ ] Sentry projects created per app
- [ ] PostHog project created
- [ ] Cloudflare DNS zone for `theshakticollective.in` active

### Phase C — tsc-shared + tsc-api (staging first)

- [ ] tsc-shared extracted; `@tsc/types@0.1.0` published to GitHub Packages
- [ ] tsc-api extracted; depends on published `@tsc/*` packages
- [ ] Railway staging service linked to `develop` branch
- [ ] `DATABASE_URL`, `REDIS_URL`, Clerk, R2, Typesense set on Railway staging
- [ ] `pnpm prisma migrate deploy` succeeds on staging DB
- [ ] `https://api-staging.theshakticollective.in/health` returns 200
- [ ] Clerk webhook registered and verified on staging

### Phase D — Frontends (staging)

- [ ] tsc-coreknot Vercel project linked; staging domain configured
- [ ] tsc-community Vercel project linked; staging domain configured
- [ ] `NEXT_PUBLIC_API_URL` points to staging API on both
- [ ] Clerk staging keys set; sign-in flow works end-to-end
- [ ] Sentry receiving test events from staging apps

### Phase E — Docs + web

- [ ] tsc-docs deployed to `docs.theshakticollective.in`; OpenAPI loads
- [ ] tsc-web deployed to `theshakticollective.in`; `www` redirects to apex

### Phase F — Production cutover

- [ ] Release PR: `develop` → `main` on tsc-api
- [ ] Railway prod deploy green; `api.theshakticollective.in` healthy
- [ ] Prisma migrate deploy on prod DB (backup first)
- [ ] Vercel prod domains verified for all frontends
- [ ] PostHog + Sentry prod keys active
- [ ] DNS TTL lowered before cutover; TTL restored after
- [ ] Legacy domain `theshakticollective.com` redirects to `theshakticollective.in`
- [ ] Smoke test: sign up → create profile → API write → search → file upload to R2
- [ ] On-call runbook and incident channel documented

### Phase G — Post-launch

- [ ] Archive monorepo after 2-week validation
- [ ] Rotate all secrets used during setup
- [ ] Enable Dependabot on all repos
- [ ] Schedule Neon backup verification
- [ ] Review Upstash memory limits for BullMQ queue depth

---

## Appendix: bootstrap repos from scaffold

Run after `gh auth login` with org admin access. **Do not force-push.**

### Create all repos

```bash
ORG=The-Shakti-Collective
SCAFFOLD="c:/Users/ragha/OneDrive/Desktop/TSC Platform/org-scaffold"

# Private repos
for repo in tsc-shared tsc-api tsc-coreknot tsc-community tsc-infra; do
  gh repo create "$ORG/$repo" --private \
    --description "The Shakti Collective Platform — $repo"
done

# Public repos
gh repo create "$ORG/tsc-web" --public \
  --description "The Shakti Collective Platform — tsc-web"
gh repo create "$ORG/tsc-docs" --public \
  --description "The Shakti Collective Platform — tsc-docs"
```

### Bootstrap each repo from scaffold (bash)

```bash
ORG=The-Shakti-Collective
SCAFFOLD="c:/Users/ragha/OneDrive/Desktop/TSC Platform/org-scaffold"
MSG="chore: initial scaffold from TSC Platform org-scaffold"

for repo in tsc-shared tsc-api tsc-coreknot tsc-community tsc-infra tsc-web tsc-docs; do
  TMP=$(mktemp -d)
  cp -r "$SCAFFOLD/$repo/." "$TMP/"
  cd "$TMP"
  git init
  git add .
  git commit -m "$MSG"
  git branch -M main
  git remote add origin "git@github.com:$ORG/$repo.git"
  git push -u origin main
  cd -
  rm -rf "$TMP"
  echo "✓ $ORG/$repo bootstrapped"
done
```

### Bootstrap (PowerShell — Windows)

```powershell
$ORG = "The-Shakti-Collective"
$SCAFFOLD = "c:\Users\ragha\OneDrive\Desktop\TSC Platform\org-scaffold"
$MSG = "chore: initial scaffold from TSC Platform org-scaffold"
$repos = @("tsc-shared","tsc-api","tsc-coreknot","tsc-community","tsc-infra","tsc-web","tsc-docs")

foreach ($repo in $repos) {
  $TMP = Join-Path $env:TEMP "tsc-bootstrap-$repo"
  if (Test-Path $TMP) { Remove-Item -Recurse -Force $TMP }
  New-Item -ItemType Directory -Path $TMP | Out-Null
  Copy-Item -Path "$SCAFFOLD\$repo\*" -Destination $TMP -Recurse -Force
  Push-Location $TMP
  git init
  git add .
  git commit -m $MSG
  git branch -M main
  git remote add origin "git@github.com:$ORG/$repo.git"
  git push -u origin main
  Pop-Location
  Remove-Item -Recurse -Force $TMP
  Write-Host "OK $ORG/$repo"
}
```

### Verify

```bash
gh repo list The-Shakti-Collective --limit 20
gh api repos/The-Shakti-Collective/tsc-web --jq '.visibility'
gh api repos/The-Shakti-Collective/tsc-docs --jq '.visibility'
```

Expected: 5 private, 2 public repos, each with initial commit on `main`.

---

## Related files

| Path | Purpose |
|------|---------|
| `.agents/shakti-collective-org-setup.md` | Org architecture, teams, migration map |
| `org-scaffold/` | Per-repo copy-ready scaffolds |
| `.agents/infra/` | Infrastructure docs, env matrix, deployment readiness (Agent 9) |
| `org-scaffold/tsc-infra/` | Copy-ready deploy configs, scripts, platform setup |
| `.agents/stage1-step1-monorepo-report.md` | Monorepo build status history |
| `context.md` | Executive summary |
