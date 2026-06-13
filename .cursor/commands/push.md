---
name: push
description: Push changes to the correct GitHub remote and branch (TheShaktiCollective/tsc-platform monorepo). Commits if needed, never force-pushes main.
---

# Push

Load and follow [`.cursor/skills/push/SKILL.md`](.cursor/skills/push/SKILL.md).

Push committed work to the **right repo and branch** per [`.github/BRANCH-STRATEGY.md`](.github/BRANCH-STRATEGY.md):

| Branch | Target |
|--------|--------|
| `feature/*` | `origin` → PR to `develop` |
| `develop` | staging deploy |
| `main` | production deploy |
| `hotfix/*` | PR to `main` |

**Canonical remote:** `TheShaktiCollective/tsc-platform`

**Safety:** no force push to `main`/`develop`; no secrets in commits; no git config changes.

**Report:** remote URL, branch, commit SHA, and suggested next step (PR if applicable).
