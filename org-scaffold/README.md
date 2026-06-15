# org-scaffold — Historical Repository Templates

> **Status:** Partially superseded by [docs/architecture/REPOSITORY-GOVERNANCE.md](../docs/architecture/REPOSITORY-GOVERNANCE.md)  
> **Do not deploy from this folder.**

## Target repos (KEEP)

| Folder | Target GitHub repo | Notes |
|--------|-------------------|-------|
| `tsc-infra/` | TheShaktiCollective/tsc-infra | Extract DNS, Railway, Vercel templates |
| `tsc-shared/` | TheShaktiCollective/tsc-shared | Published `@tsc/*` |
| `tsc-docs/` | TheShaktiCollective/tsc-docs | OpenAPI site |

## Deprecated scaffolds (do not create repos)

| Folder | Superseded by |
|--------|---------------|
| `tsc-api/` | `tsc-platform/apps/api` |
| `tsc-community/` | `tsc-platform/apps/community` |
| `tsc-web/` | `tsc-platform/apps/website` |
| `tsc-coreknot/` | `tsc-platform/apps/coreknot/` (extract later to `tsc-coreknot` repo) |

## Canonical architecture

See [docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md](../docs/architecture/MASTER-PRODUCTION-ARCHITECTURE.md).

## Migration order (when extracting)

1. tsc-infra
2. tsc-shared (publish packages)
3. tsc-coreknot (from monorepo `apps/coreknot/`)
4. tsc-docs

**Do not** extract tsc-api, tsc-community, or tsc-web as separate repos.
