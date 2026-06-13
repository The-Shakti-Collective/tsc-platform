# TSC Platform â€” Startup Guide

Monorepo for The Sound Collective: NestJS API, Next.js community app, shared packages, and CoreKnot legacy UI sources.

## Quick start (Windows)

```powershell
# 1. Prerequisites: Node.js 20+, pnpm 9+, Docker Desktop (recommended)

# 2. One-time setup
pnpm setup

# 3. Start a full dev stack (infra + API + frontend)
pnpm start:community    # or: pnpm start
pnpm start:coreknot
pnpm start:website
pnpm start:all          # all frontends at once
```

| Command | Slash command | What runs |
|---------|---------------|-----------|
| `pnpm start:community` | `/start community` | Infra + API :4000 + Community :3000 |
| `pnpm start:coreknot` | `/start coreknot` | Infra + API :4000 + CoreKnot :3001 (separate windows) |
| `pnpm start:coreknot:single` | â€” | API + CoreKnot in one terminal (`concurrently`) |
| `pnpm start:website` | `/start website` | Infra + API :4000 + Website :3002 |
| `pnpm start:all` | `/start all` | Infra + API + all 3 frontends |
| `pnpm start` | â€” | Same as `start:community` (backward compat) |

| Service | URL |
|---------|-----|
| Community app | http://localhost:3000 |
| CoreKnot client | http://localhost:3001 |
| Website (stub) | http://localhost:3002 |
| NestJS API | http://localhost:4000/api |
| Prisma Studio | `pnpm db:studio` â†’ http://localhost:5555 |

## Quick start (macOS / Linux)

```bash
pnpm setup:unix    # or ./scripts/setup.sh
pnpm start:unix    # or ./scripts/start.sh
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org/) | 20+ | Runtime |
| [pnpm](https://pnpm.io/) | 9.15+ | Monorepo package manager (`corepack enable`) |
| [Docker](https://www.docker.com/) | Optional but recommended | Local Postgres + Redis |
| [Clerk](https://clerk.com/) account | For community auth | Google / email / phone sign-in |

Without Docker, use **Neon** for Postgres and **Upstash** (or empty `REDIS_URL`) for Redis â€” see [No Docker / No Virtualization](#no-docker--no-virtualization).

---

## No Docker / No Virtualization

Use this path when Docker Desktop fails with **"Virtualization support not detected"** or you cannot enable VT-x/AMD-V.

### What works without Docker

| Service | Without Docker | How |
|---------|----------------|-----|
| **Postgres** | Yes | Neon remote DB â€” set `DATABASE_URL` to your Neon connection string (`neon.tech`) |
| **Redis** | Optional | Upstash free tier, **or** leave `REDIS_URL` empty (stub queue mode) |
| **API + frontends** | Yes | `pnpm start:coreknot` auto-skips infra when Docker unavailable |

Your `.env` already has Neon configured. Set `TSC_SKIP_DOCKER=true` to silence Docker checks, or let scripts auto-detect when `docker.exe` fails.

### Run today (no Docker)

```powershell
pnpm start:coreknot          # auto-skips Docker infra
# or explicit:
pnpm start:coreknot:nodocker

# Manual (two terminals):
pnpm dev:api
pnpm dev:coreknot            # or pnpm dev:community
```

First time with Neon:

```powershell
pnpm db:push                 # apply Prisma schema to Neon
```

### Redis options

**(A) Upstash free tier** (recommended if you need BullMQ queues)

1. Create a database at [console.upstash.com](https://console.upstash.com) (free tier).
2. Copy the **Redis URL** (`rediss://default:...@....upstash.io:6379`).
3. Paste into `.env` as `REDIS_URL=rediss://...`

**(B) Skip Redis** (simplest for UI/API dev)

Leave `REDIS_URL` empty in `.env`. The API starts in **stub queue mode** â€” BullMQ jobs are no-ops; HTTP routes and Postgres work normally.

**(C) Local Redis via Docker** (later)

Enable virtualization (see below), install Docker Desktop, set `REDIS_URL=redis://localhost:6379`, remove `TSC_SKIP_DOCKER`.

### Enable virtualization (IT admin)

Brief checklist for Windows â€” requires admin/BIOS access:

1. **BIOS/UEFI**: Enable **Intel VT-x** or **AMD-V** (sometimes labeled "Virtualization Technology").
2. **Windows Features** (`optionalfeatures.exe`): Enable **Virtual Machine Platform** and **Windows Subsystem for Linux**.
3. Reboot, install/update [WSL2](https://learn.microsoft.com/en-us/windows/wsl/install), then install Docker Desktop.

Corporate laptops often lock BIOS â€” ask IT to enable virtualization if Docker is required later.

### Infra status message

When Docker is skipped, scripts print:

```
  Neon = DB OK  (remote DATABASE_URL)
  Redis = skipped  (stub queue mode â€” BullMQ jobs no-op)
```

Or with Upstash: `Redis = remote OK  (Upstash/cloud REDIS_URL)`

---

## Prerequisites

```
TSC Platform/
â”œâ”€â”€ apps/
â”‚   â”œâ”€â”€ api/           @tsc/api â€” NestJS backend (port 4000)
â”‚   â”œâ”€â”€ community/     @tsc/community â€” Next.js 15 frontend (port 3000)
â”‚   â”œâ”€â”€ coreknot/      Legacy CoreKnot UI sources (not in pnpm workspace yet)
â”‚   â””â”€â”€ website/       Placeholder / separate git repo
â”œâ”€â”€ packages/
â”‚   â”œâ”€â”€ database/      Prisma schema + @tsc/database
â”‚   â”œâ”€â”€ types/         Shared TypeScript types
â”‚   â”œâ”€â”€ contracts/     Zod schemas / API contracts
â”‚   â”œâ”€â”€ permissions/   RBAC helpers
â”‚   â”œâ”€â”€ community-sdk/ Frontend SDK for community app
â”‚   â”œâ”€â”€ workspace/     Workspace domain helpers
â”‚   â””â”€â”€ analytics/     Analytics helpers
â”œâ”€â”€ scripts/           setup.ps1, start-stack.ps1, start-infra.ps1, dev-stack.ps1 (+ .sh variants)
â”œâ”€â”€ docker-compose.yml Postgres + Redis for local dev
â””â”€â”€ .env.example       Copy to .env before first run
```

---

## Environment variables

Copy the example file and fill in secrets:

```powershell
copy .env.example .env
```

Setup scripts also sync `.env` â†’ `apps/community/.env.local` (Next.js reads env from the app folder).

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `REDIS_URL` | For queues | BullMQ job queues (optional for basic dev) |
| `PORT` | No | API port (default `4000`) |
| `CORS_ORIGIN` | No | Allowed frontend origin (default `http://localhost:3000`) |
| `NEXT_PUBLIC_CLERK_*` | For auth | Clerk publishable key + sign-in URLs |
| `CLERK_SECRET_KEY` | For auth | Clerk server secret |
| `NEXT_PUBLIC_API_URL` | No | Community â†’ API base (default `http://localhost:4000/api`) |
| `TSC_STUB_USER_ID` | No | Local API stub user id |
| `TSC_AUTH_STUB` | Dev only | Bypass Clerk on API when `true` (requires `NODE_ENV=development`) |
| `NEXT_PUBLIC_AUTH_STUB` | Dev only | Bypass Clerk on community app when `true` |

API uses `StubAuthGuard` locally â€” no JWT required until Clerk JWT verification ships.

---

## Temp auth (Clerk unavailable)

When Clerk dashboard login is broken (CAPTCHA, key issues) or keys are still placeholders, enable **dev stub auth** so you can keep building without real sign-in.

### Enable stub auth

In `.env` (synced to `apps/community/.env.local` via setup scripts):

```env
TSC_AUTH_STUB=true
NEXT_PUBLIC_AUTH_STUB=true
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
TSC_STUB_USER_ID=stub-dev-user
NEXT_PUBLIC_STUB_USER_ID=stub-dev-user
```

Stub mode activates only when **both**:

1. `NODE_ENV=development` (default for `pnpm dev:*`)
2. Stub flags are `true` **or** Clerk keys are unset / contain `REPLACE_ME` / `ci_placeholder`

### What stub auth does

| Layer | Behavior |
|-------|----------|
| Community middleware | Skips Clerk â€” no sign-in required for protected routes |
| Community UI | No `ClerkProvider` when stub; header shows "Dev stub auth" badge |
| API | `StubAuthGuard` assigns `TSC_STUB_USER_ID` as authenticated user |
| Person/profile calls | Uses `NEXT_PUBLIC_STUB_PERSON_ID` until real auth links a person |

### Run dev with stub auth

```powershell
pnpm infra:up          # optional â€” Postgres + Redis
pnpm db:push           # if schema changed
pnpm dev:api           # terminal 1
pnpm dev:community     # terminal 2
```

Open http://localhost:3000 â€” browse `/feed`, `/profile`, `/onboarding` without Clerk.

### Restore real Clerk

1. Add valid keys from [Clerk Dashboard](https://dashboard.clerk.com/) to `.env`
2. Set `TSC_AUTH_STUB=false` and `NEXT_PUBLIC_AUTH_STUB=false` (or remove them)
3. Re-sync: `copy .env apps\community\.env.local`
4. Restart both dev servers

---

## Manual setup (step by step)

### 1. Install dependencies

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
pnpm install
```

### 2. Start infrastructure

```powershell
pnpm start:infra
# or: pnpm infra:up (alias)
```

**Smart service selection** (reads `.env`):

| `.env` setting | Docker service | Notes |
|----------------|----------------|-------|
| `DATABASE_URL` with `neon.tech` | Postgres **skipped** | Neon is remote â€” no local container needed |
| `DATABASE_URL` â†’ `localhost:5432` | Postgres **started** | `tsc-postgres` on :5432 |
| `REDIS_URL` â†’ `localhost:6379` | Redis **started** | `tsc-redis` on :6379 â€” required for BullMQ |
| `REDIS_URL` â†’ Upstash / remote | Redis **skipped** | Uses cloud Redis from `.env` |

Default local credentials (when Postgres container runs): `postgres/postgres/tsc_community` on port 5432.

```powershell
docker compose ps    # verify containers
```

### 3. Database

```powershell
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Apply schema (no migration history in repo yet)
pnpm db:studio     # Optional GUI
```

### 4. Build shared packages

```powershell
pnpm build
```

### 5. Run dev servers

**One command â€” full stack (recommended)**

```powershell
pnpm start:community     # infra + API :4000 + Community :3000
pnpm start:coreknot      # infra + API :4000 + CoreKnot :3001
pnpm start:website       # infra + API :4000 + Website :3002
pnpm start:all           # infra + API + all frontends
```

**Frontend only** (infra already running):

```powershell
pnpm dev:stack:community   # API :4000 + Community :3000
pnpm dev:stack:coreknot    # API :4000 + CoreKnot :3001
pnpm dev:stack:website     # API :4000 + Website :3002
```

See [Dev stacks](#dev-stacks) for port map, slash commands, and killing stuck ports.

**Manual â€” two terminals**

**Terminal 1 â€” API**

```powershell
pnpm dev:api
```

**Terminal 2 â€” Community**

```powershell
pnpm dev:community
```

---

## Dev stacks

Unified launchers start Docker infra (when needed), the shared NestJS API, and one frontend. By default they open **separate PowerShell windows** (API first, then frontend after API health passes). Each frontend uses a **distinct port** so you can switch stacks without `EADDRINUSE` on port 3000.

**Startup order:** API window â†’ poll `http://localhost:4000/api/feed/health` (up to 60s) â†’ frontend window â†’ external browser (if enabled).

**Single terminal:** `pnpm start:coreknot:single` runs API + CoreKnot together via `concurrently` (no extra windows).

**API logs:** `logs/api-dev.log` (when using separate API window).

### External browser vs Cursor Simple Browser

`pnpm start:*` opens your **system default browser** (Chrome, Edge, Opera, etc.) via `Start-Process`, not Cursorâ€™s embedded Simple Browser.

| Control | Value |
|---------|--------|
| Env var | `TSC_OPEN_BROWSER=true` (default) â€” set `false` to skip auto-open |
| Manual | Click **Open in External Browser** in Cursorâ€™s Simple Browser panel, or paste the URL yourself |

Optional Cursor setting: search **Simple Browser** in Settings â€” there is no global â€œalways externalâ€ flag; use `TSC_OPEN_BROWSER` or the panel action above.

| Full stack | Frontend-only | Slash command | Frontend | Port | API | CORS origin |
|------------|---------------|---------------|----------|------|-----|-------------|
| `pnpm start:community` | `pnpm dev:stack:community` | `/start community` | Next.js community | 3000 | :4000 | `http://localhost:3000` |
| `pnpm start:coreknot` | `pnpm dev:stack:coreknot` | `/start coreknot` | Vite dev shell (legacy pages in `src/pages/`) | 3001 | :4000 | `http://localhost:3001` |
| `pnpm start:website` | `pnpm dev:stack:website` | `/start website` | Not in repo yet | 3002 | :4000 | `http://localhost:3002` |
| `pnpm start:all` | â€” | `/start all` | All three frontends | 3000â€“3002 | :4000 | all origins (comma-separated) |

PowerShell equivalents:

```powershell
.\scripts\start-stack.ps1 -Target community
.\scripts\start-stack.ps1 -Target coreknot -KillPorts
.\scripts\start-infra.ps1
.\scripts\dev-stack.ps1 -Target community   # no infra
```

### Architecture note (Neon + local Redis)

Typical hybrid local dev setup:

```
â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”     â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
â”‚  Frontend   â”‚â”€â”€â”€â”€â–¶â”‚  NestJS API  â”‚â”€â”€â”€â”€â–¶â”‚  Neon Postgres  â”‚  (remote, neon.tech)
â”‚  :3000-3002 â”‚     â”‚    :4000     â”‚     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â”‚              â”‚â”€â”€â”€â”€â–¶â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
                    â”‚              â”‚     â”‚  Docker Redis   â”‚  (local :6379, BullMQ)
                    â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜     â””â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”˜
```

When `DATABASE_URL` contains `neon.tech`, `start:infra` skips the Postgres container but still starts Redis unless `REDIS_URL` points to Upstash or another remote host.

### Cursor slash commands

Project commands live in `.cursor/commands/`:

- `/start community` â€” infra + Community stack
- `/start coreknot` â€” infra + CoreKnot stack
- `/start website` â€” infra + Website stack
- `/start all` â€” infra + all frontends
- `/community`, `/coreknot`, `/website` â€” aliases (prefer `/start â€¦` for full stack)

Type `/` in Cursor chat and pick the command; the agent runs the matching `pnpm start:*` script.

### If `EADDRINUSE` (Windows)

**Most common cause:** `pnpm start:coreknot` already opened an API window on **4000**, then you also ran `pnpm dev:api` in another terminal — two Nest processes fight for the same port.

**Fix (do this in order):**

1. Close **all** leftover TSC dev PowerShell windows (titles often mention API / CoreKnot / frontend).
2. From the repo root:

```powershell
pnpm kill:ports
pnpm start:coreknot
```

Use **one** launcher — you do **not** need a separate `pnpm dev:api` when `start:coreknot` succeeds (it starts the API in its own window, or reuses a healthy API on :4000).

`pnpm kill:ports` runs `scripts/kill-all-dev-ports.ps1` and frees **3000, 3001, 3002, 4000** (`taskkill /F /T` on the owning PID). One port only:

```powershell
pnpm kill:port 4000
# or: .\scripts\kill-port.ps1 4000
```

`start-stack.ps1` auto-kills conflicting dev ports by default (`TSC_KILL_PORTS=true` in `.env`, or unset = on). Set `TSC_KILL_PORTS=false` only if you manage ports yourself.

### `pnpm` not found

```powershell
corepack enable
corepack prepare pnpm@9.15.0 --activate
```

### Database connection refused

If using **local Postgres** (`DATABASE_URL` â†’ `localhost`):

```powershell
pnpm start:infra
docker compose ps
```

If using **Neon**, verify `DATABASE_URL` in `.env` points at your Neon branch (no local Postgres container needed).

### Docker Desktop not running / virtualization unavailable

Start scripts **auto-skip** Docker when `docker.exe` fails or `TSC_SKIP_DOCKER=true` in `.env`. No fatal error.

```powershell
pnpm start:coreknot          # works without Docker (Neon + stub Redis)
pnpm start:coreknot:nodocker # explicit skip
```

See [No Docker / No Virtualization](#no-docker--no-virtualization) for Neon + Upstash setup.

### Prisma client out of date

```powershell
pnpm db:generate
pnpm build
```

### Community app can't reach API

Check `NEXT_PUBLIC_API_URL=http://localhost:4000/api` in `.env` and that `apps/community/.env.local` exists (re-run setup or copy manually).

### CORS errors

Set `CORS_ORIGIN=http://localhost:3000` in `.env` and restart the API.

### Clerk auth not working

Add real keys from [Clerk Dashboard](https://dashboard.clerk.com/) to `.env`, re-sync to `apps/community/.env.local`, restart community app.

### Port already in use

Each dev stack uses a dedicated frontend port (3000 / 3001 / 3002) â€” see [Dev stacks](#dev-stacks). If a port is still stuck:

```powershell
pnpm kill:ports
```

Or change `PORT` (API) or run community on another port:

```powershell
pnpm --filter @tsc/community exec next dev --port 3001
```

Restart the API with matching `CORS_ORIGIN`.

---

## Production notes (Render)

- Bind HTTP to `0.0.0.0:$PORT`
- Filesystem is ephemeral â€” use managed Postgres, not local disk
- Set env vars in Render dashboard; do not commit `.env`

See workspace rule `render-platform.mdc` and Render deploy skills in `.cursor/plugins`.
