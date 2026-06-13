# Branch Strategy

Applies to all TSC application repositories: `tsc-api`, `tsc-coreknot`, `tsc-community`, `tsc-web`, `tsc-shared`, `tsc-docs`.

## Branches

| Branch | Purpose | Deploy target | Protection |
|--------|---------|---------------|------------|
| `main` | Production-ready code | Production | Required |
| `develop` | Integration branch | Staging | Required |
| `feature/*` | Feature work | Preview (optional) | None |
| `hotfix/*` | Emergency prod fixes | — | None (merge to main + develop) |

## Rules

1. **No direct commits** to `main` or `develop`
2. All changes via **Pull Request**
3. Required checks before merge: **lint**, **typecheck**, **test**, **build**
4. `main` accepts merges from `develop` (release PR) or `hotfix/*` only
5. `develop` accepts merges from `feature/*`
6. Delete feature branches after merge

## GitHub branch protection (recommended)

### `main`

- Require pull request before merging
- Require 1 approval (2 for tsc-api)
- Require status checks: `lint`, `typecheck`, `test`, `build`
- Require branches to be up to date
- Restrict pushes to Owners + Platform team
- Enable signed commits (optional)

### `develop`

- Require pull request before merging
- Require status checks: `lint`, `typecheck`, `build`
- Restrict force pushes

## Release flow

```
feature/xyz → PR → develop → staging deploy
develop → release PR → main → production deploy
hotfix/abc → PR → main (+ backport PR → develop)
```

## Environment mapping

| Branch push | GitHub Environment | URL pattern |
|-------------|-------------------|-------------|
| `develop` | `staging` | `*-staging.theshakticollective.in` |
| `main` | `production` | production subdomains |

Configure environment protection rules and required reviewers on `production` in GitHub repo settings.
