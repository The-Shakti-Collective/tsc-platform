# Troubleshooting

[← Master index](../MASTER.md)

Known failures, root causes, and fixes verified against the codebase.

---

## Decision Tree

```mermaid
flowchart TD
    START["Something broken"]
    PORT{"EADDRINUSE?"}
    API{"API unreachable?"}
    DB{"DB connection refused?"}
    DOCKER{"Docker failed?"}
    BUILD{"pnpm build fails?"}
    CORS{"CORS error?"}
    AUTH{"Auth broken?"}

    START --> PORT
    PORT -->|yes| FIX_PORT["kill:ports + single launcher"]
    PORT -->|no| API
    API -->|yes| FIX_API["check :4000 health URL"]
    API -->|no| DB
    DB -->|yes| FIX_DB["infra:up or Neon URL"]
    DB -->|no| DOCKER
    DOCKER -->|yes| FIX_DOCK["nodocker path"]
    DOCKER -->|no| BUILD
    BUILD -->|yes| FIX_BUILD["see historical package fixes below"]
    BUILD -->|no| CORS
    CORS -->|yes| FIX_CORS["CORS_ORIGIN match frontend"]
    CORS -->|no| AUTH
    AUTH -->|yes| FIX_AUTH["stub flags or Clerk keys"]
```

---

## EADDRINUSE (port in use)

### Symptom

```
Error: listen EADDRINUSE: address already in use :::4000
```

### Root cause

**Most common:** `pnpm start:coreknot` opened API window on :4000, then you also ran `pnpm dev:api` in another terminal.

### Fix

```powershell
# 1. Close all TSC dev PowerShell windows
# 2. From repo root:
pnpm kill:ports
pnpm start:coreknot   # one launcher only
```

Ports freed: **3000, 3001, 3002, 4000** (`scripts/kill-all-dev-ports.ps1`).

Single port:

```powershell
pnpm kill:port 4000
```

Disable auto-kill: `TSC_KILL_PORTS=false` in `.env`.

---

## Duplicate API Processes

```mermaid
sequenceDiagram
    participant User
    participant Start as start-stack.ps1
    participant Win1 as API window :4000
    participant Win2 as manual dev:api

    User->>Start: pnpm start:coreknot
    Start->>Win1: spawn API
    User->>Win2: pnpm dev:api
    Win2--xWin1: EADDRINUSE :4000
```

**Rule:** When `start:*` succeeds, do **not** run separate `pnpm dev:api`.

Exception: `start:coreknot:single` runs API inline — still don't start a second API.

---

## API Not Ready / Frontend Starts Too Early

Start scripts poll `http://127.0.0.1:4000/api/feed/health` for up to **60 seconds**.

If timeout:

1. Check `logs/api-dev.log`
2. Verify `DATABASE_URL` reachable
3. Run `pnpm db:generate` if Prisma client stale
4. Start API manually: `pnpm dev:api` and read console errors

---

## Database Connection Refused

### Local Postgres expected

```powershell
pnpm start:infra
docker compose ps
# expect tsc-postgres healthy on :5432
```

Verify `.env`:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tsc_community
```

### Using Neon

No local Postgres needed. Ensure URL contains `neon.tech` and `sslmode=require`.

```powershell
pnpm db:push
```

---

## Docker Desktop / Virtualization

### Symptom

Docker fails with "Virtualization support not detected".

### Fix

Scripts auto-skip when `docker.exe` fails or `TSC_SKIP_DOCKER=true`:

```powershell
pnpm start:coreknot:nodocker
```

Use Neon for Postgres, leave `REDIS_URL` empty for stub queues.

---

## setup.ps1 vs start-infra.ps1 Mismatch

### Symptom

`pnpm setup` starts Postgres container even when `DATABASE_URL` points to Neon.

### Cause

`setup.ps1` unconditionally runs `docker compose up -d` when docker exists.

### Fix

After setup, use `start-infra.ps1` for daily work. For Neon-only:

```env
TSC_SKIP_DOCKER=true
```

Manually skip postgres: don't run setup's docker step; use `pnpm start:infra` instead.

---

## Prisma Client Out of Date

### Symptom

Import errors from `@prisma/client`, type mismatches after schema change.

### Fix

```powershell
pnpm db:generate
pnpm build
```

---

## Community Can't Reach API

### Symptom

Network errors, `fetch failed`, empty data in browser.

### Checks

1. API running: http://localhost:4000/api/feed/health
2. `NEXT_PUBLIC_API_URL=http://localhost:4000/api` in `.env`
3. `apps/community/.env.local` exists and matches
4. Re-sync: `Copy-Item .env apps\community\.env.local`
5. Restart community dev server

---

## CORS Errors

### Symptom

Browser blocks API response — CORS policy error.

### Fix

Set `CORS_ORIGIN` to match frontend origin:

| Frontend | CORS_ORIGIN |
|----------|-------------|
| Community | `http://localhost:3000` |
| CoreKnot | `http://localhost:3001` |

For multiple frontends: comma-separated list.

Restart API after `.env` change.

---

## Clerk Auth Not Working

### Fix path A — use stub auth (dev)

```env
TSC_AUTH_STUB=true
NEXT_PUBLIC_AUTH_STUB=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_REPLACE_ME
CLERK_SECRET_KEY=sk_test_REPLACE_ME
```

### Fix path B — real Clerk

1. Get keys from [Clerk Dashboard](https://dashboard.clerk.com/)
2. Set `TSC_AUTH_STUB=false`, `NEXT_PUBLIC_AUTH_STUB=false`
3. Sync to `apps/community/.env.local`
4. Restart community + API

---

## pnpm Not Found

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

---

## turbo Native Binary Fails (Windows)

### Symptom

Turbo DLL load failure on Windows.

### Workarounds

```powershell
npx pnpm@9.15.0 build
# or install Visual C++ Redistributable
```

---

## pnpm build

**Current status (June 2026):** `pnpm build` **PASS** — 16/17 packages, all key apps.

If build fails after a schema or dependency change, try:

```powershell
pnpm db:generate
pnpm build
```

### Historical package failures (resolved)

| Package | Was | Fix applied |
|---------|-----|-------------|
| `@tsc/analytics` | Missing `utils.js`, bad `@tsc/database/client` import | Import paths; database exports `./client` |
| `@tsc/api` | Nest TS2742 portability | SWC build with `declaration: false`; explicit return types |
| `@tsc/community` | Bad CoreKnot imports | Local stubs |
| `@tsc/community` | Legacy Pages Router stub (`ArtistPassportPage.jsx`) | Removed stub; passport in App Router |

Re-run after local changes:

```powershell
pnpm build
```

---

## Website Stack Fails

`apps/website/` is not a workspace package. `pnpm dev:website` prints stub message and exits.

`pnpm start:website` may start infra + API but website on :3002 is not fully implemented in monorepo.

---

## Health Endpoint Confusion

| URL | Status |
|-----|--------|
| `/api/feed/health` | ✅ Works — use this |
| `/api/health` | ❌ 404 — not implemented |
| `/health` | ❌ 404 — not implemented |

Railway health check should use `/api/feed/health` until global health ships.

---

## Related

- [local-dev.md](../infrastructure/local-dev.md)
- [known-gaps.md](../decisions/known-gaps.md)
- [.specify/infrastructure/local-dev.md](../infrastructure/local-dev.md)
