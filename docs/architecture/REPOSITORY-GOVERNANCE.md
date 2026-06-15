# Repository Governance

> GitHub org: **TheShaktiCollective** (canonical)  
> Legacy reference in `org-scaffold/`: The-Shakti-Collective — update on extraction.

## Target repository set

| Repo | Status | Purpose |
|------|--------|---------|
| `tsc-platform` | **KEEP — primary** | Website, Community, Platform API, shared packages, docs |
| `tsc-coreknot` | **KEEP — extract** | CoreKnot client, server, workers (currently `apps/coreknot/`) |
| `tsc-shared` | **KEEP — extract** | Published `@tsc/*` npm packages |
| `tsc-infra` | **KEEP** | DNS templates, Railway/Vercel JSON, deploy scripts |
| `tsc-docs` | **KEEP** | OpenAPI, public API reference site |

## Deprecate / archive

| Repo | Status | Replacement | Action |
|------|--------|-------------|--------|
| `tsc-api` | **DEPRECATE** | `tsc-platform/apps/api` | Archive org repo; delete `org-scaffold/tsc-api/` after monorepo is canonical |
| `tsc-community` | **DEPRECATE** | `tsc-platform/apps/community` | Archive; Vercel project points to monorepo path |
| `tsc-web` | **DEPRECATE** | `tsc-platform/apps/website` | Archive; rename mentally to **TSC Website** |

## Current monorepo vs target

```
tsc-platform (this repo)
├── apps/
│   ├── api/              → stays
│   ├── website/          → stays
│   ├── community/        → stays
│   └── coreknot/         → EXTRACT to tsc-coreknot
├── packages/             → partial EXTRACT to tsc-shared
├── docs/                 → stays (+ architecture/)
├── org-scaffold/         → MIGRATE useful parts to tsc-infra, then archive folder
└── e2e/                  → stays in tsc-platform
```

## Extraction order

1. **tsc-infra** — DNS, Railway, Vercel configs (no runtime code)
2. **tsc-shared** — publish `@tsc/database`, `@tsc/contracts`, `@tsc/permissions` from `packages/`
3. **tsc-coreknot** — extract `apps/coreknot/*` with own pnpm workspace
4. **tsc-docs** — OpenAPI from `apps/api/openapi/tsc-api.openapi.json`
5. Archive deprecated repos with README pointing to `tsc-platform`

## Branch and access

- **Default branch:** `main` (protected)
- **Integration branch:** `develop` (optional — CI runs on both)
- **CODEOWNERS:** `.github/CODEOWNERS` — platform vs coreknot paths
- **Secrets:** GitHub Actions org secrets for `TURBO_TOKEN`, deploy tokens; never in repo

## Vercel project mapping (target)

| Vercel project | Repo | Root directory |
|----------------|------|----------------|
| `tsc-website` | tsc-platform | `apps/website` |
| `tsc-community` | tsc-platform | `apps/community` |
| `tsc-coreknot` | tsc-coreknot | `client/` |

## Railway service mapping (target)

| Railway service | Repo | Start command |
|-----------------|------|---------------|
| `tsc-platform-api` | tsc-platform | `node scripts/railway-start.mjs` |
| `coreknot-api` | tsc-coreknot | `node server.js` |
| `coreknot-workers` | tsc-coreknot | `node workers/startWorkers.js` |

## Governance rules

1. **One repo owns each deployable** — no duplicate Vercel projects for same app.
2. **No new repos** without updating this document and [ARCHITECTURE.md](./ARCHITECTURE.md).
3. **`org-scaffold/` is not production** — templates only; do not deploy from it.
4. **Open source boundary** — private repos; `@tsc/*` packages published to GitHub Packages when extracted.

## Gap: org-scaffold still in monorepo

`org-scaffold/README.md` describes a **6-repo split** that partially contradicts the 5-repo target above. Resolution:

- Keep `tsc-infra`, `tsc-shared`, `tsc-docs` scaffolds → move to respective repos
- Remove `tsc-api`, `tsc-community`, `tsc-web` scaffolds → superseded by monorepo apps
- Update `org-scaffold/README.md` to "historical — see docs/architecture/REPOSITORY-GOVERNANCE.md"
