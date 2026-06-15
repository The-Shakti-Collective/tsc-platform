# CoreKnot Playwright smoke (Agent L9)

Local-only validation that the CoreKnot Vite client at **http://localhost:3001** renders key routes without runtime crashes. **Never run against production.**

## What is checked

| Route | Auth | Assertion |
|-------|------|-----------|
| `/login` | No | Page renders; no error boundary; no uncaught JS errors |
| `/dashboard` (redirect) | No | Unauthenticated users redirect to `/login` without crash |
| `/dashboard` | Yes | Home loads after dev login |
| `/projects` | Yes | Projects list shell loads |
| `/todo` | Yes | Tasks page loads |
| `/artists` | Yes | Artists hub loads (redirects to `/management?tab=artists`) |
| `/finance` | Yes | Finance hub loads (redirects to `/management?tab=finance`) |

## Prerequisites

```powershell
# Terminal 1 — Vite client (:3001)
pnpm dev:coreknot

# Terminal 2 — CRM API (:5000, optional for login)
pnpm dev:coreknot:server

# One-time E2E user seed (optional for authenticated tests)
node apps/coreknot/server/scripts/seedE2eUsers.js
```

Default login credentials (override via env):

| Variable | Default |
|----------|---------|
| `COREKNOT_E2E_EMAIL` | `e2e-pw-gate@test.coreknot.local` |
| `COREKNOT_E2E_PASSWORD` | `E2eGateTemp1!` |
| `PLAYWRIGHT_COREKNOT_URL` | `http://localhost:3001` |

## Run

```powershell
pnpm test:e2e:coreknot
```

From `e2e/` only:

```powershell
pnpm test:coreknot
```

## Skip behavior

- **Client down** — entire suite skipped with console warning.
- **Login unavailable** — public + redirect tests still run; authenticated route tests skipped.
- **Goal** — no false failures when stack is not running locally; document skips instead.
