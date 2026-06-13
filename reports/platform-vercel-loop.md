# Platform Vercel Loop — Frontend Deploy Readiness

**Date:** 2026-06-14  
**Scope:** `apps/website`, `apps/community`, `apps/coreknot/client`  
**CLI:** Vercel CLI 54.13.0

---

## Summary

| App | Root | Local build | CI pipeline | Vercel deploy | Status |
|-----|------|-------------|-------------|---------------|--------|
| **Website** | `apps/website` | ✅ exit 0 | ✅ lint/typecheck/build | ⬜ blocked (no token) | **PASS** (code) |
| **Community** | `apps/community` | ✅ exit 0 | ✅ lint/typecheck/build | ⬜ blocked (no token) | **PASS** (code) |
| **CoreKnot** | `apps/coreknot/client` | ✅ exit 0 | ✅ lint/typecheck/build | ⬜ blocked (no token) | **PASS** (code) |

**Overall deploy verification:** **BLOCKED** — invalid/missing `VERCEL_TOKEN`; founder must authenticate CLI and set production env vars in Vercel dashboard.

---

## Vercel CLI session

```text
$ vercel whoami
Error: The specified token is not valid. Use `vercel login` to generate a new token.

$ echo $env:VERCEL_TOKEN
(not set)
```

Could not run `vercel link`, `vercel env`, or `vercel --prod` without a valid token.

---

## Changes made (engineering)

### 1. `vercel.json` — monorepo install + templates

| App | Action |
|-----|--------|
| `apps/website/vercel.json` | Updated `installCommand` → `cd ../.. && pnpm install --frozen-lockfile` |
| `apps/community/vercel.json` | **Added** from `org-scaffold/tsc-infra/vercel/tsc-community.json` |
| `apps/coreknot/client/vercel.json` | **Added** from `org-scaffold/tsc-infra/vercel/tsc-coreknot.json` (Vite SPA, `outputDirectory: dist`) |

### 2. CoreKnot health endpoint

- Added `apps/coreknot/client/api/health.js` (Vercel serverless) per infra README
- Static fallback already exists: `public/health.json`

### 3. Lint fixes (CI + Vercel parity)

**`@tsc/database`** (blocked website/community CI via `...` filter):

- `relationship.ts`: `let` → `const` for graph walk vars
- `forecast.ts`: removed unused `growthPercent` helper

**`@tsc/coreknot-client`** (20 ESLint errors):

- Removed unused imports across API modules and pages
- Added `Headers`, `IntersectionObserver` to ESLint browser globals
- `IdentityBadgeBar`: wire `personId` → `data-person-id` attribute

### 4. Env examples — Vercel production sections

Updated:

- `apps/website/.env.example`
- `apps/community/.env.example`
- `apps/coreknot/client/.env.example`

Each documents production URLs and Clerk/PostHog/Sentry vars to set via dashboard or `vercel env`.

---

## Local verification (2026-06-14)

```powershell
pnpm --filter @tsc/website run lint typecheck build      # exit 0
pnpm --filter @tsc/community run lint typecheck build    # exit 0
pnpm --filter @tsc/coreknot-client run lint typecheck build  # exit 0
pnpm --filter @tsc/database run lint                     # exit 0
```

Prior GitHub CI failures (main @ `73dec5a`):

- CI — Website: `@tsc/database#lint` ❌ → fixed
- CI — Community: `@tsc/database#lint` ❌ → fixed
- CI — CoreKnot Client: `@tsc/coreknot-client#lint` ❌ → fixed

---

## Vercel project setup (founder)

### 1. Authenticate CLI

```powershell
vercel logout
vercel login
vercel whoami
```

Or non-interactive (CI / agent):

```powershell
$env:VERCEL_TOKEN = "<token from https://vercel.com/account/tokens>"
vercel whoami --token $env:VERCEL_TOKEN
```

Store in GitHub org secrets: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID_WEB`, `VERCEL_PROJECT_ID_COMMUNITY`, `VERCEL_PROJECT_ID_COREKNOT`.

### 2. Link + deploy per app

| Project | Root directory | Domain |
|---------|----------------|--------|
| `tsc-website` | `apps/website` | `theshakticollective.in` |
| `tsc-community` | `apps/community` | `community.theshakticollective.in` |
| `tsc-coreknot` | `apps/coreknot/client` | `coreknot.in` |

```powershell
cd "c:\Projects\TSC Platform\apps\website"
vercel link
vercel env pull .env.local   # optional local preview
vercel --prod

cd "c:\Projects\TSC Platform\apps\community"
vercel link
vercel --prod

cd "c:\Projects\TSC Platform\apps\coreknot\client"
vercel link
vercel --prod
```

Dashboard: enable **Include source files outside of the Root Directory** for each monorepo project (recommended alongside `installCommand` in `vercel.json`).

### 3. Production env vars (all Next.js apps)

| Variable | Production value |
|----------|------------------|
| `NEXT_PUBLIC_API_URL` | `https://api.theshakticollective.in/api` |
| `NEXT_PUBLIC_TSC_API_URL` | `https://api.theshakticollective.in/api` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk live publishable key |
| `CLERK_SECRET_KEY` | Clerk live secret |
| `TSC_AUTH_STUB` | `false` |
| `NEXT_PUBLIC_AUTH_STUB` | `false` |
| `NEXT_PUBLIC_WEBSITE_URL` | `https://theshakticollective.in` |
| `NEXT_PUBLIC_APP_URL` | Per-app URL |
| `NEXT_PUBLIC_POSTHOG_KEY` | Optional |
| `NEXT_PUBLIC_SENTRY_DSN` | Optional |

**Community only (satellite SSO):**

- `NEXT_PUBLIC_CLERK_IS_SATELLITE=true`
- `NEXT_PUBLIC_CLERK_DOMAIN=community.theshakticollective.in`
- `CLERK_SIGN_IN_URL=https://theshakticollective.in/sign-in`

**CoreKnot (Vite — `VITE_*` prefix):**

| Variable | Production value |
|----------|------------------|
| `VITE_API_URL` | `https://api.theshakticollective.in` |
| `VITE_TSC_API_URL` | `https://api.theshakticollective.in/api` |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk live publishable key |
| `VITE_AUTH_STUB` | `false` |

Set via dashboard **Settings → Environment Variables** or:

```powershell
vercel env add NEXT_PUBLIC_API_URL production
```

---

## Domains status

| Domain | DNS target | Vercel project | Status |
|--------|------------|----------------|--------|
| `theshakticollective.in` | Vercel apex/CNAME | `tsc-website` | ⬜ Not verified (no deploy) |
| `community.theshakticollective.in` | `cname.vercel-dns.com` | `tsc-community` | ⬜ Not verified |
| `coreknot.in` | Vercel CNAME | `tsc-coreknot` | ⬜ Not verified |

Cloudflare records: `org-scaffold/tsc-infra/cloudflare/dns-records.md`

---

## Health checks (post-deploy)

| App | Endpoint |
|-----|----------|
| Website | `GET /api/health` |
| Community | `GET /api/health` (also `/health` → redirect) |
| CoreKnot | `GET /health.json` or `GET /api/health` |

---

## Next steps

1. Founder: valid `VERCEL_TOKEN` + create/link three Vercel projects
2. Founder: set production env vars (Clerk live keys required — stub disabled in prod)
3. Founder: attach custom domains; confirm Cloudflare DNS
4. Re-run `vercel --prod` from each app root; confirm build logs green
5. Run `pnpm sweep:prod` after API Railway cutover
