---
name: push
description: >-
  Push committed changes to the correct GitHub remote and branch for TSC Platform.
  Use when the user invokes /push, asks to push code, sync to GitHub, or deploy
  via git push. Resolves monorepo remote, branch strategy, and safety checks.
disable-model-invocation: true
---

# Push — TSC Platform

Push changes to the **correct repo and branch**. Facts first; never assume remote or branch.

## Canonical target

| Item | Value |
|------|--------|
| Repo | Monorepo at workspace root (`c:\Projects\TSC Platform`) |
| GitHub org | `TheShaktiCollective` |
| Expected remote | `origin` → `git@github.com:TheShaktiCollective/tsc-platform.git` or `https://github.com/TheShaktiCollective/tsc-platform.git` |
| Branch rules | [`.github/BRANCH-STRATEGY.md`](../../.github/BRANCH-STRATEGY.md) |

If `origin` points elsewhere, **stop** and tell the user. Do not push to wrong repo.

## Branch routing

| Current / intended branch | Purpose | Push target |
|---------------------------|---------|-------------|
| `feature/*` | Feature work | `origin feature/...` → open PR to `develop` |
| `develop` | Staging / integration | `origin develop` → Railway staging, Vercel preview |
| `main` | Production-ready | `origin main` → Railway prod, Vercel prod |
| `hotfix/*` | Emergency fix | `origin hotfix/...` → PR to `main` (+ backport `develop`) |

**Default when branch unclear:** use current branch if it matches strategy; otherwise ask user: `develop` (staging) or `feature/<name>` (new work). Never push unreviewed work directly to `main` unless user explicitly requests hotfix flow.

## Workflow

Run these in parallel first:

```powershell
git status
git diff
git diff --staged
git branch -vv
git remote -v
git log -3 --oneline
```

Then:

### 1. Verify remote

- `origin` must be `TheShaktiCollective/tsc-platform` (or user-confirmed canonical monorepo URL).
- If missing: `git remote add origin <URL>` — **ask user** before adding.

### 2. Verify branch

- Record current branch: `git rev-parse --abbrev-ref HEAD`
- If detached HEAD or wrong branch for the work, **ask user** before checkout.
- Creating a branch is OK when user intent is new feature: `git checkout -b feature/<short-name>`

### 3. Handle uncommitted changes

User invoked `/push` — committing is in scope **only for this invocation**.

- **Never commit:** `.env`, `.env.local`, credentials, secrets (warn if staged).
- If uncommitted changes exist:
  1. Review diff (staged + unstaged)
  2. Stage relevant files only
  3. Commit with message from diff (1–2 sentences, why not what)
  4. Use HEREDOC commit message on PowerShell/bash as in user git rules
- If nothing to commit and branch not ahead of remote: report clean; nothing to push.

### 4. Safety (mandatory)

- **NEVER** `git push --force` to `main` or `develop` — warn if user asks
- **NEVER** update git config
- **NEVER** skip hooks (`--no-verify`) unless user explicitly asks
- **NEVER** push secrets — scan staged files for `.env`, keys, tokens
- Verify branch is ahead: `git status` shows "ahead of"

### 5. Push

```powershell
git push -u origin HEAD
```

If upstream already set: `git push`

If push rejected (non-fast-forward): report; suggest `git pull --rebase` — do **not** force without explicit user approval.

### 6. Post-push report

Return to user:

```markdown
## Push complete

| Field | Value |
|-------|-------|
| Remote | origin → <url> |
| Branch | <branch> |
| Commit | <sha> <subject> |
| Upstream | origin/<branch> |

**Next:** PR to `develop` (feature) or `main` (release/hotfix) if applicable.
```

## Failure handling

| Error | Action |
|-------|--------|
| Auth failed | Tell user: `gh auth login` or fix SSH key |
| Remote missing | Ask for canonical repo URL |
| Wrong remote org/repo | Stop; list `git remote -v` |
| Branch protection reject | Push succeeded to branch; PR required for merge |
| Large/binary accidental stage | Unstage; warn user |

## Not in scope

- Force push, amend (unless user rules allow), tag release, create PR — offer separately
- Push to legacy split repos (`tsc-api`, `tsc-community`, etc.) — monorepo only unless user overrides

## Reference

- Branch strategy: [`.github/BRANCH-STRATEGY.md`](../../.github/BRANCH-STRATEGY.md)
- Founder push step: [`SETUP-FOUNDER-RUNBOOK.md`](../../SETUP-FOUNDER-RUNBOOK.md) Step 1
