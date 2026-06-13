# Branch strategy (monorepo)

> Canonical doc: [`org-scaffold/tsc-infra/docs/branch-strategy.md`](../org-scaffold/tsc-infra/docs/branch-strategy.md)

`main` and `develop` branches are **not present locally** in this workspace (git unavailable on dev host). Create them on first push to GitHub:

```bash
git checkout -b develop
git push -u origin develop
git checkout -b main
git push -u origin main
```

Or use GitHub default branch `main`, then branch `develop` from it.

## Branches

| Branch | Purpose | Deploy |
|--------|---------|--------|
| `main` | Production-ready | Railway prod, Vercel prod |
| `develop` | Integration / staging | Railway staging, Vercel staging |
| `feature/*` | Feature work | Vercel preview (optional) |
| `hotfix/*` | Emergency prod fixes | Merge to `main` + backport to `develop` |

## Flow

```
feature/* → PR → develop → staging
develop → release PR → main → production
hotfix/* → PR → main (+ backport → develop)
```

## Required CI checks (branch protection)

Configure on `main` and `develop` after workflows run once:

- `lint`
- `typecheck`
- `test`
- `build`

`main` also requires PR approval; `develop` requires PR only.
