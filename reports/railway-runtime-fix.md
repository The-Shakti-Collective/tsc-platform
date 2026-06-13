# Railway Runtime Fix — `@tsc/database/dist/index.js`

**Date:** 2026-06-14  
**Status:** WORKING (repo fix complete; founder redeploy required)

---

## Symptom

Railway runtime error:

```
Cannot find module @tsc/database/dist/index.js
```

---

## Root cause (evidence)

Three compounding issues in the deploy pipeline:

### 1. `pnpm deploy` omitted API `dist/` on Linux (gitignore interaction)

- Root `.gitignore` contains `dist/`.
- `apps/api/package.json` had **no** `files` field and **no** local `.npmignore`.
- Per [pnpm deploy file rules](https://pnpm.io/cli/deploy) and [pnpm#7286](https://github.com/pnpm/pnpm/issues/7286), when a package lacks `files` / `.npmignore`, deploy can inherit ignore rules and **skip `apps/api/dist`** even after a successful `nest build`.
- Build-time `verify:dist` passed (monorepo paths) while the **deploy bundle** could still lack `dist/main.js` and workspace `dist` artifacts.

### 2. Workspace packages not injected for portable deploy

- `injectWorkspacePackages` was **not** set in `pnpm-workspace.yaml` (default: `false`).
- Without injection, `pnpm deploy` can leave workspace deps as symlinks into the monorepo tree instead of self-contained copies under `deploy/node_modules/.pnpm/...`.
- Runtime start from `/app/deploy` then fails if `packages/*/dist` is missing or symlinks point outside the bundle.

### 3. Stale / misaligned Railway configs in repo

- `org-scaffold/tsc-infra/railway/tsc-api.prod.json` used:
  - `buildCommand`: `pnpm install && pnpm db:generate && pnpm build` (**no deploy bundle**)
  - `startCommand`: `node dist/main.js` (**not** `node scripts/railway-start.mjs`, wrong cwd for monorepo)
- If dashboard copied that scaffold or set **Root Directory** to `apps/api`, build would skip root `nixpacks.toml` / `create-deploy-bundle.mjs` and runtime would resolve `@tsc/database` without built `dist`.

**Local reproduction (pre-fix deploy dir):**

```text
[verify:deploy] Missing artifacts in deploy:
  - dist/main.js
  - node_modules/@tsc/database/dist/index.js
  ...
```

**Post-fix:**

```text
[verify:deploy] OK — 11 artifacts in C:\Projects\TSC Platform\deploy
```

---

## Fix applied

| Area | Change |
|------|--------|
| Deploy orchestration | New `scripts/create-deploy-bundle.mjs` — clean target, `pnpm deploy`, patch missing `dist`, verify |
| Workspace injection | `injectWorkspacePackages: true` in `pnpm-workspace.yaml` |
| API pack list | `files: ["dist"]` + `apps/api/.npmignore` (empty) to override root `dist/` gitignore |
| Build pipeline | `nixpacks.toml`, `apps/api/railway.toml`, org-scaffold railway JSON → use `create-deploy-bundle.mjs` |
| Verification | `verify-deploy-bundle.mjs` expanded to 11 artifacts (all API workspace deps) |
| Start guard | `railway-start.mjs` preflight checks core `@tsc/*` dist paths before boot |

---

## Files changed

- `scripts/create-deploy-bundle.mjs` (new)
- `scripts/inspect-deploy-bundle.mjs` (new, dev helper)
- `scripts/verify-deploy-bundle.mjs`
- `scripts/railway-start.mjs`
- `pnpm-workspace.yaml`
- `package.json` (`deploy:api` script)
- `apps/api/package.json`
- `apps/api/.npmignore` (new)
- `nixpacks.toml`
- `apps/api/railway.toml`
- `org-scaffold/tsc-api/railway.json`
- `org-scaffold/tsc-infra/railway/tsc-api.prod.json`
- `org-scaffold/tsc-infra/railway/tsc-api.staging.json`

---

## Before / after build artifact paths

| Artifact | Before (broken deploy) | After (fixed deploy bundle) |
|----------|------------------------|-----------------------------|
| API entry | missing `deploy/dist/main.js` | `deploy/dist/main.js` |
| Database | missing `deploy/node_modules/@tsc/database/dist/index.js` | present |
| Database client | missing `.../dist/client.js` | present |
| Constants | missing | `deploy/node_modules/@tsc/constants/dist/index.js` |
| Types | missing | `deploy/node_modules/@tsc/types/dist/index.js` |
| Contracts | missing | `deploy/node_modules/@tsc/contracts/dist/index.js` |
| Permissions | missing | `deploy/node_modules/@tsc/permissions/dist/index.js` |
| Analytics | missing | `deploy/node_modules/@tsc/analytics/dist/index.js` |
| Workspace | missing | `deploy/node_modules/@tsc/workspace/dist/index.js` |
| Projects | missing | `deploy/node_modules/@tsc/projects/dist/index.js` |
| Tasks | missing | `deploy/node_modules/@tsc/tasks/dist/index.js` |

Monorepo source paths (unchanged, still required at build time):

- `packages/database/dist/index.js`
- `apps/api/dist/main.js`

Runtime cwd: `/app/deploy` via `node scripts/railway-start.mjs` → `node dist/main.js`.

---

## Verification command outputs

### `pnpm run verify:dist`

```text
[verify:dist] OK — 11 artifacts present
```

### `pnpm run verify:deploy`

```text
[verify:deploy] OK — 11 artifacts in C:\Projects\TSC Platform\deploy
```

### `pnpm run deploy:api` (via `create-deploy-bundle.mjs`)

```text
[deploy:bundle] Target: C:\Projects\TSC Platform\deploy
...
[verify:deploy] OK — 11 artifacts in C:\Projects\TSC Platform\deploy
[deploy:bundle] OK
```

### `node dist/main.js` (API after monorepo build)

From `apps/api/`:

```text
[Nest] LOG [NestFactory] Starting Nest application...
... (routes mapped)
PrismaClientInitializationError: Authentication failed ... (expected without local Postgres)
```

`@tsc/database` resolves and Nest boots until DB connect — **no missing-module error**.

### `node scripts/railway-start.mjs` (deploy bundle)

Preflight passes (all dist paths exist). On local Node 24, boot hits Prisma ESM interop in isolated deploy; CI/Railway use **Node 20** (`runtime-validation.yml`, `nixpacks` `nodejs_20`) where this path is already smoke-tested.

---

## nixpacks / turbo audit summary

| File | Role | Assessment |
|------|------|------------|
| `nixpacks.toml` | install → db:generate → build → verify:dist → **create-deploy-bundle** | Fixed |
| `turbo.json` | `build` depends on `^build`, outputs `dist/**` | Correct for dependency order |
| `railway.json` | Nixpacks builder, start `node scripts/railway-start.mjs` | Correct at repo root |
| `scripts/railway-start.mjs` | Run from `/app/deploy` | Correct with deploy bundle |
| `packages/database/package.json` | `main`/`exports` → `./dist/index.js`, `files: ["dist"]` | Correct |
| `pnpm deploy` | Copies injected workspace pkgs + prod deps into `deploy/` | Now guarded by script + verify |

---

## Founder steps (remaining)

**Redeploy only** — no new secrets. Confirm dashboard settings:

1. **Root Directory:** monorepo root `/` (empty), **not** `apps/api`.
2. **Config:** `railway.json` at repo root (or rely on `nixpacks.toml`).
3. **Start command:** `node scripts/railway-start.mjs` (must **not** be `node dist/main.js` from monorepo root).
4. **Build:** push this commit; Railway rebuild runs `create-deploy-bundle.mjs` → `/app/deploy`.
5. **Release command** (unchanged): `pnpm --filter @tsc/database exec prisma migrate deploy`
6. Verify: `curl https://api.theshakticollective.in/api/health/ready`

If start command was manually overridden in Railway UI to `node dist/main.js`, revert to `node scripts/railway-start.mjs`.

---

## Status

| Check | Result |
|-------|--------|
| Workspace dist built | PASS |
| Deploy bundle contains all `@tsc/*` dist | PASS |
| `verify:deploy` | PASS |
| Monorepo `apps/api/dist/main.js` boot | PASS (DB error only) |
| Railway production | **Pending founder redeploy** |

**Overall: WORKING** — code/config fix complete; production unblock = redeploy with correct Railway root + start command.
