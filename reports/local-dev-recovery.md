# Local Dev Recovery

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Local Dev

## Known Windows blockers

| Issue | Symptom | Cause |
|-------|---------|-------|
| EPERM | `prisma generate` fails, file locked | Antivirus, IDE, OneDrive |
| OneDrive | Slow/corrupt `node_modules` | Project under synced folder |
| Prisma lock | `EBUSY` on `.prisma/client` | Stale Node process |
| fast-check corrupt | `Cannot find module './check/precondition/Pre'` | Broken `node_modules` tree |

## Safe cleanup (PowerShell)

Run from repo root. **Stop dev servers first.**

```powershell
# 1. Kill dev ports
pnpm kill:ports

# 2. Remove caches (not .env)
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force packages\database\node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force apps\api\node_modules -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue  # only if reinstall needed

# 3. Clean prisma artifacts
Remove-Item -Recurse -Force packages\database\dist -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force node_modules\.pnpm\@prisma* -ErrorAction SilentlyContinue

# 4. Reinstall
pnpm install --frozen-lockfile

# 5. Generate + build
pnpm db:generate
pnpm build
pnpm verify:dist
```

## OneDrive mitigation

Move repo outside OneDrive (e.g. `C:\Projects\`) or pause sync during `pnpm install` / `prisma generate`.

## Verify module resolution

```powershell
cd apps\api
node -e "console.log(require.resolve('@tsc/database'))"
node -e "console.log(Object.keys(require('@tsc/database')).slice(0,3))"
```

## When local build blocked

Railway/Linux CI is authoritative for this sprint. Document local failure, proceed with commit — fixes target production build graph.

## Status

Recovery commands documented. Local EPERM does not block Railway deploy after push.
