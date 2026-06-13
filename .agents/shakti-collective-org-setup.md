# The Shakti Collective ? GitHub Organization Setup

> Master reference for multi-repo architecture. Migration scaffold lives in `org-scaffold/`.
> **Do not commit secrets.** Use GitHub Organization secrets and per-environment variables only.

Version: 1.0  
Last Updated: June 2026

---

## Organization

| Field | Value |
|-------|-------|
| GitHub Org | [The-Shakti-Collective](https://github.com/The-Shakti-Collective) |
| Org slug | `The-Shakti-Collective` |
| Primary domain | `theshakticollective.in` |
| Legacy domain (redirect) | `theshakticollective.com` |
| Current state | Recovering monorepo (`apps/*`, `packages/*`, 95-model Prisma) |
| Target state | 7-repo company-grade layout |

---

## Repository Layout

| Repository | GitHub URL | Visibility | Purpose | Deploy target |
|------------|------------|------------|---------|---------------|
| **tsc-api** | https://github.com/The-Shakti-Collective/tsc-api | Private | NestJS API + Prisma (SSOT for business data) | Railway |
| **tsc-coreknot** | https://github.com/The-Shakti-Collective/tsc-coreknot | Private | Internal ops platform (CRM, finance, analytics) | Vercel |
| **tsc-community** | https://github.com/The-Shakti-Collective/tsc-community | Private | Public ecosystem (profiles, events, feed) | Vercel |
| **tsc-web** | https://github.com/The-Shakti-Collective/tsc-web | **Public** | Marketing, SEO, landing pages | Vercel |
| **tsc-shared** | https://github.com/The-Shakti-Collective/tsc-shared | Private | `@tsc/*` packages (types, contracts, SDK) | GitHub Packages |
| **tsc-infra** | https://github.com/The-Shakti-Collective/tsc-infra | Private | CI templates, deploy configs, scripts, IaC stubs | ? |
| **tsc-docs** | https://github.com/The-Shakti-Collective/tsc-docs | **Public** | Public API docs, OpenAPI, developer guides | Vercel / static |

> **Bootstrap status (2026-06-12):** Blocked ? `gh auth status` reports *not logged into any GitHub hosts* in this environment (CLI installed at `C:\Program Files\GitHub CLI\gh.exe`). Complete `gh auth login` for the same Windows user Cursor uses, or set `GH_TOKEN` with `repo` + org admin scope, then re-run bootstrap per [.specify/operations/setup-runbook.md](../.specify/operations/setup-runbook.md) Phase 5 and this doc's bootstrap section.

> | Repo | Created | Scaffold pushed | URL |
> |------|---------|-----------------|-----|
> | tsc-shared | ? | ? | https://github.com/The-Shakti-Collective/tsc-shared |
> | tsc-api | ? | ? | https://github.com/The-Shakti-Collective/tsc-api |
> | tsc-coreknot | ? | ? | https://github.com/The-Shakti-Collective/tsc-coreknot |
> | tsc-community | ? | ? | https://github.com/The-Shakti-Collective/tsc-community |
> | tsc-infra | ? | ? | https://github.com/The-Shakti-Collective/tsc-infra |
> | tsc-web | ? | ? | https://github.com/The-Shakti-Collective/tsc-web |
> | tsc-docs | ? | ? | https://github.com/The-Shakti-Collective/tsc-docs |

> Local scaffolds ready under `org-scaffold/` (7 repos).

---

## Visibility Matrix

| Repository | GitHub visibility | Rationale |
|------------|-------------------|-----------|
| tsc-api | **Private** | Business logic, schema, auth integration |
| tsc-coreknot | **Private** | Internal ops; never public |
| tsc-community | **Private** ? Public at launch | Ecosystem app; open-source optional post-launch |
| tsc-web | **Public** | Marketing; SEO-friendly |
| tsc-shared | **Private** | Published via GitHub Packages to org members only |
| tsc-infra | **Private** | Deploy secrets references, internal runbooks |
| tsc-docs | **Public** | Developer-facing API documentation |

---

## Team Structure

| Team | Members (role) | Repository access |
|------|----------------|-------------------|
| **Owners** | Founders, CTO | Admin on all repos; org settings |
| **Platform** | DevOps, infra engineers | Admin: `tsc-infra`, `tsc-api`; Maintain: all others |
| **Backend** | API, data, jobs | Maintain: `tsc-api`, `tsc-shared`; Read: `tsc-docs` |
| **Frontend** | Next.js, design systems | Maintain: `tsc-coreknot`, `tsc-community`, `tsc-web`; Read: `tsc-shared` |
| **Community** | Community product squad | Maintain: `tsc-community`; Read: `tsc-api`, `tsc-shared`, `tsc-docs` |
| **Operations** | Managers, support leads | Read: `tsc-coreknot`; no write on code repos |

### GitHub team ? permission defaults

- **Owners**: `admin` org-wide
- **Platform**: `maintain` on infra + api; `write` elsewhere
- **Backend / Frontend / Community**: `write` on owned repos; `read` on dependencies
- **Operations**: `read` on coreknot only

Enable **branch protection** on `main` and `develop` for all application repos (see Branch Strategy).

---

## Domain Map

| Subdomain | Repository | Environment examples |
|-----------|------------|----------------------|
| `theshakticollective.in` | tsc-web | prod |
| `www.theshakticollective.in` | tsc-web | prod (redirect ? apex) |
| `api.theshakticollective.in` | tsc-api | prod |
| `api-staging.theshakticollective.in` | tsc-api | staging |
| `community.theshakticollective.in` | tsc-community | prod |
| `community-staging.theshakticollective.in` | tsc-community | staging |
| `coreknot.theshakticollective.in` | tsc-coreknot | prod |
| `coreknot-staging.theshakticollective.in` | tsc-coreknot | staging |
| `docs.theshakticollective.in` | tsc-docs | prod |

DNS: **Cloudflare** (apex + subdomains, CDN, R2). TLS via Cloudflare / platform defaults.

---

## Environment Strategy (per repo)

Each application repo uses **three logical environments**. Secrets differ; naming is consistent.

| Environment | Branch trigger | Purpose |
|-------------|----------------|---------|
| **dev** | Local + `feature/*` | Developer machines; optional preview DB |
| **staging** | `develop` | Integration testing; mirrors prod topology |
| **prod** | `main` | Live traffic |

### Per-repo env var naming

Prefix by concern, never commit values:

```
# tsc-api (Railway)
DATABASE_URL
REDIS_URL
CLERK_SECRET_KEY
TYPESENSE_API_KEY
SENTRY_DSN
POSTHOG_API_KEY
R2_ACCESS_KEY_ID
R2_SECRET_ACCESS_KEY
R2_BUCKET
NODE_ENV

# Frontends (Vercel) ? tsc-coreknot, tsc-community, tsc-web
NEXT_PUBLIC_API_URL
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
NEXT_PUBLIC_POSTHOG_KEY
NEXT_PUBLIC_SENTRY_DSN
```

Staging uses parallel keys (e.g. `DATABASE_URL` on staging Railway service, `NEXT_PUBLIC_API_URL=https://api-staging.theshakticollective.in`).

---

## Organization Secrets (GitHub)

Configure at **Organization ? Settings ? Secrets and variables ? Actions**.  
Never store these in code, `.env` committed files, or scaffold templates.

| Secret | Used by | Description |
|--------|---------|-------------|
| `RAILWAY_TOKEN` | tsc-api CI | Railway deploy API token |
| `VERCEL_TOKEN` | Frontends, docs | Vercel deploy token |
| `VERCEL_ORG_ID` | Frontends, docs | Vercel team/org ID |
| `VERCEL_PROJECT_ID_*` | Per-app workflows | Project IDs (api N/A on Vercel) |
| `NPM_TOKEN` / `GITHUB_TOKEN` | tsc-shared publish | GitHub Packages write (`packages:write`) |
| `CLERK_SECRET_KEY` | CI smoke tests (optional) | Staging Clerk secret |
| `DATABASE_URL_STAGING` | CI integration tests | Staging Postgres (ephemeral or dedicated) |
| `SENTRY_AUTH_TOKEN` | CI | Source map upload (optional) |
| `TYPESENSE_API_KEY_STAGING` | CI search tests | Staging Typesense admin key |
| `CLOUDFLARE_API_TOKEN` | tsc-infra | DNS / R2 automation (optional) |

Repository-level secrets override org secrets when names collide; prefer org-level for shared tokens.

---

## Production Services Map

| Service | Provider | Deploys | Responsibility |
|---------|----------|---------|----------------|
| **DNS / CDN / R2** | Cloudflare | All domains, static assets | Routing, TLS, object storage |
| **tsc-web** | Vercel | Marketing site | SSR/SSG, edge |
| **tsc-community** | Vercel | Community app | Next.js frontend |
| **tsc-coreknot** | Vercel | Ops platform | Next.js frontend |
| **tsc-api** | Railway | NestJS API | HTTP + workers |
| **PostgreSQL** | Railway (or Neon) | tsc-api | 95-model Prisma SSOT |
| **Redis** | Railway (or Upstash) | tsc-api | Cache, BullMQ |
| **Search** | Typesense Cloud | tsc-api | Artists, events, posts index |
| **Auth** | Clerk | All frontends + API | Google, email OTP, phone OTP |
| **Errors** | Sentry | All apps | Exception monitoring |
| **Analytics** | PostHog | Frontends + API events | Product analytics |
| **Logs / uptime** | BetterStack | All (optional) | Log aggregation, status |

Data flow: **Frontend ? API ? Service ? Repository ? PostgreSQL**. No frontend owns business data.

---

## Branch Strategy

| Branch | Protection | Deploys to | Merge from |
|--------|------------|------------|------------|
| `main` | Required PR, 1+ review, CI green, no direct push | **prod** | `develop` only (release PR) |
| `develop` | Required PR, CI green | **staging** | `feature/*` |
| `feature/*` | None | preview (optional) | ? |

Required CI checks: **lint**, **typecheck**, **test**, **build**. Deploy job runs only on `develop` / `main` with environment gates.

Full template: `org-scaffold/tsc-infra/docs/branch-strategy.md`

---

## Monorepo ? Multi-Repo Migration Map

| Current monorepo path | Target repo | Target path | Notes |
|----------------------|-------------|-------------|-------|
| `apps/api/` | **tsc-api** | `/` | NestJS application root |
| `packages/database/` (Prisma) | **tsc-api** | `prisma/` | 95 models; co-locate with API |
| `apps/coreknot/` | **tsc-coreknot** | `/` | Includes `client/` Next app |
| `apps/community/` | **tsc-community** | `/` | Next.js app |
| *(new)* | **tsc-web** | `/` | Marketing stub; greenfield |
| `packages/types/` | **tsc-shared** | `packages/types/` | `@tsc/types` |
| `packages/contracts/` | **tsc-shared** | `packages/contracts/` | `@tsc/contracts` |
| `packages/permissions/` | **tsc-shared** | `packages/permissions/` | `@tsc/permissions` |
| `packages/community-sdk/` | **tsc-shared** | `packages/community-sdk/` | `@tsc/community-sdk` |
| *(planned)* `packages/constants/` | **tsc-shared** | `packages/constants/` | Not in monorepo yet; add on extract |
| `packages/ui/` | **tsc-shared** | `packages/ui/` | Shared UI primitives |
| `packages/analytics/` | **tsc-api** or **tsc-shared** | TBD | API-adjacent jobs ? api; pure libs ? shared |
| `packages/graph/` | **tsc-api** | `packages/graph/` | Graph engine tied to API |
| `packages/reputation/` | **tsc-api** | `packages/reputation/` | Reputation jobs |
| `packages/search/` | **tsc-api** | `packages/search/` | Typesense integration |
| `packages/workspace/` | **tsc-api** | `packages/workspace/` | Domain modules |
| `packages/projects/` | **tsc-api** | `packages/projects/` | Domain modules |
| `packages/tasks/` | **tsc-api** | `packages/tasks/` | Domain modules |
| `tooling/` | **tsc-infra** | `tooling/` | ESLint, TSConfig bases |
| `scripts/` (root) | **tsc-infra** | `scripts/` | setup, start, stop |
| `.github/workflows/` (templates) | **tsc-infra** | `.github/workflows/` | Reusable CI/CD |
| `docker-compose.yml` | **tsc-infra** | `local/` | Local dev stack |
| OpenAPI / API reference | **tsc-docs** | `openapi/` | Generated from tsc-api |

### Packages staying internal to tsc-api (not published)

`@tsc/database`, `@tsc/graph`, `@tsc/analytics`, `@tsc/reputation`, `@tsc/search`, `@tsc/workspace`, `@tsc/projects`, `@tsc/tasks` ? consumed only by API unless later promoted to shared.

---

## `@tsc/*` Publish Strategy (GitHub Packages)

**Registry:** `https://npm.pkg.github.com`  
**Scope:** `@tsc`  
**Source repo:** `The-Shakti-Collective/tsc-shared`

### Published packages (initial)

| Package | Visibility | Consumers |
|---------|------------|-----------|
| `@tsc/types` | private (org) | api, coreknot, community, web |
| `@tsc/contracts` | private (org) | api, community-sdk, frontends |
| `@tsc/permissions` | private (org) | api, coreknot |
| `@tsc/community-sdk` | private (org) | community, third-party integrations |
| `@tsc/constants` | private (org) | all apps (when created) |

### Versioning

- **Semver** starting at `0.1.0` on first publish from multi-repo cutover
- **Changesets** or manual bump in `tsc-shared` PRs
- Publish on merge to `main` via `.github/workflows/publish.yml`
- Pre-release tags: `@tsc/types@0.2.0-beta.1` for staging consumers

### Consumer `.npmrc` (each app repo)

```ini
@tsc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

In CI, use `secrets.GITHUB_TOKEN` with `packages: read` or a PAT with `read:packages`.

### Dependency migration

Monorepo `workspace:*` ? published semver:

```json
"@tsc/types": "^0.1.0"
```

During transition, use **git subpath** or **local file:** only in dev; never in prod CI.

---

## Recommended Migration Order

1. **Fix monorepo build** ? resolve analytics/api/community blockers (stay in monorepo)
2. **tsc-infra** ? create repo; land CI templates, branch docs, local docker
3. **tsc-shared** ? extract types, contracts, permissions, community-sdk; publish `@tsc/*`
4. **tsc-api** ? extract API + Prisma + internal packages; wire GitHub Packages
5. **tsc-coreknot** ? extract; point to published shared + staging API
6. **tsc-community** ? extract; same pattern
7. **tsc-docs** ? OpenAPI from api; public docs site
8. **tsc-web** ? new marketing stub
9. **Decommission monorepo** ? archive `tsc-platform` repo after cutover validation

---

## Manual GitHub CLI Commands

Run after `gh auth login` with org admin access. **Do not run from CI without review.**

Full bootstrap script (bash + PowerShell): **[`.specify/operations/setup-runbook.md`](../.specify/operations/setup-runbook.md) Phase 5** and **Manual GitHub CLI Commands** below.

```bash
ORG=The-Shakti-Collective

# Private repos
for repo in tsc-shared tsc-api tsc-coreknot tsc-community tsc-infra; do
  gh repo create "$ORG/$repo" --private \
    --description "The Shakti Collective Platform ? $repo"
done

# Public repos (create public directly ? do not create private then edit)
gh repo create "$ORG/tsc-web" --public \
  --description "The Shakti Collective Platform ? tsc-web"
gh repo create "$ORG/tsc-docs" --public \
  --description "The Shakti Collective Platform ? tsc-docs"

# Create teams (requires org admin)
gh api orgs/$ORG/teams -f name=Platform -f privacy=closed
gh api orgs/$ORG/teams -f name=Backend -f privacy=closed
gh api orgs/$ORG/teams -f name=Frontend -f privacy=closed
gh api orgs/$ORG/teams -f name=Community -f privacy=closed
gh api orgs/$ORG/teams -f name=Operations -f privacy=closed

# Example: grant Platform team maintain on tsc-infra
# gh api orgs/$ORG/teams/Platform/repos/$ORG/tsc-infra -f permission=maintain

# Bootstrap all repos from org-scaffold/ (see runbook Appendix for loop)
cd org-scaffold/tsc-shared
git init && git add . && git commit -m "chore: initial scaffold from TSC Platform org-scaffold"
git remote add origin "git@github.com:$ORG/tsc-shared.git"
git branch -M main && git push -u origin main

# Repeat for each repo under org-scaffold/
```

---

## Related Files

| Path | Purpose |
|------|---------|
| `org-scaffold/` | Copy-ready per-repo scaffolds |
| `.specify/MASTER.md` | Project memory index + org architecture summary |
| [.specify/operations/setup-runbook.md](../.specify/operations/setup-runbook.md) | End-to-end production setup + repo bootstrap |
| [.specify/agents/execution/FOUNDER-TASKS.md](../.specify/agents/execution/FOUNDER-TASKS.md) | Founder-only secrets and provider steps |
| `.agents/shakti-collective-org-setup.md` | This document |
