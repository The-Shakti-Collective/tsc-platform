# org-scaffold

Copy-ready repository scaffolds for The Shakti Collective multi-repo migration.

**Do not push from this folder directly.** Copy each subdirectory into its own GitHub repo under [The-Shakti-Collective](https://github.com/The-Shakti-Collective).

## Repositories

| Folder | Target GitHub repo |
|--------|-------------------|
| `tsc-shared/` | The-Shakti-Collective/tsc-shared |
| `tsc-api/` | The-Shakti-Collective/tsc-api |
| `tsc-coreknot/` | The-Shakti-Collective/tsc-coreknot |
| `tsc-community/` | The-Shakti-Collective/tsc-community |
| `tsc-web/` | The-Shakti-Collective/tsc-web |
| `tsc-infra/` | The-Shakti-Collective/tsc-infra |
| `tsc-docs/` | The-Shakti-Collective/tsc-docs |

## Master documentation

See `.agents/shakti-collective-org-setup.md` for org architecture and `.agents/production-setup-runbook.md` for full production setup + `gh` bootstrap commands.

## Migration order

1. tsc-infra
2. **tsc-shared** (publish `@tsc/*` first)
3. tsc-api
4. tsc-coreknot → tsc-community
5. tsc-docs → tsc-web

Fix monorepo build blockers **before** extracting app repos.
