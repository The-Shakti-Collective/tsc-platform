# Community Application (`@tsc/community`)

[← Master index](../MASTER.md)

## Overview

| Property | Value |
|----------|-------|
| Path | `apps/community/` |
| Framework | Next.js 15 (App Router) |
| React | 19 |
| Port | `3000` (fixed in package.json scripts) |
| Auth | Clerk (`@clerk/nextjs`) + dev stub bypass |

---

## Architecture

```mermaid
flowchart TB
    subgraph next["Next.js App Router"]
        LAYOUT["app/layout.tsx"]
        MW["middleware.ts"]
        PAGES["Route groups"]
    end

    subgraph data["Data layer"]
        SDK["@tsc/community-sdk"]
        RQ["TanStack Query"]
        ZUSTAND["Zustand stores"]
    end

    subgraph external["External"]
        API["NestJS API :4000"]
        CLERK["Clerk (optional)"]
    end

    LAYOUT --> MW
    MW --> PAGES
    PAGES --> SDK
    SDK --> RQ
    RQ --> API
    MW -.-> CLERK
```

---

## Route Map

| Route group | Paths | Purpose |
|-------------|-------|---------|
| `(feed)` | `/feed`, `/discover`, `/messages`, `/notifications`, `/bookmarks` | Main social UX |
| `(profile)` | `/profile` | User profile |
| `(onboarding)` | `/onboarding` | New user flow |
| `(auth)` | `/sign-in`, `/sign-up` | Clerk auth pages |
| `(settings)` | `/settings` | Account settings |
| Public | `/`, `/artists`, `/communities`, `/events`, `/opportunities`, `/collaborations`, `/search` | Discovery |
| Dynamic | `/u/[username]`, `/community/[slug]`, `/event/[slug]` | Entity pages |

Artist passport lives in App Router (`/profile`, `/u/[username]`); build fix: removed legacy `src/pages/` stub.

---

## Environment

Next.js reads **`apps/community/.env.local`**, not root `.env` directly.

Setup syncs root → app:

```powershell
# Done by pnpm setup / setup.ps1
Copy-Item .env apps\community\.env.local
```

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_API_URL` | API base (`http://localhost:4000/api`) |
| `NEXT_PUBLIC_TSC_API_URL` | Alias for API base |
| `NEXT_PUBLIC_APP_URL` | Self URL (`http://localhost:3000`) |
| `NEXT_PUBLIC_CLERK_*` | Clerk URLs and publishable key |
| `CLERK_SECRET_KEY` | Server-side Clerk |
| `NEXT_PUBLIC_AUTH_STUB` | Bypass Clerk in dev |
| `NEXT_PUBLIC_STUB_PERSON_ID` | Stub person for API calls |

See [env-vars.md](../infrastructure/env-vars.md).

---

## Stub Auth Flow

```mermaid
flowchart TD
    START["Request to protected route"]
    CHECK{"NEXT_PUBLIC_AUTH_STUB=true<br/>OR Clerk key has REPLACE_ME?"}
    DEV{"NODE_ENV=development?"}
    SKIP["middleware: skip Clerk"]
    CLERK["Clerk middleware auth"]
    UI["No ClerkProvider; Dev stub badge"]

    START --> CHECK
    CHECK -->|yes| DEV
    DEV -->|yes| SKIP
    DEV -->|no| CLERK
    CHECK -->|no| CLERK
    SKIP --> UI
```

Implementation: `src/middleware.ts`, `src/lib/auth-stub.ts`, `src/components/layout/site-header.tsx`

---

## API Integration

Hook: `src/hooks/use-community-client.ts`  
SDK package: `@tsc/community-sdk` (typed fetch wrappers over `@tsc/contracts`)

```mermaid
sequenceDiagram
    participant Page as Server/Client Component
    participant Hook as use-community-client
    participant SDK as @tsc/community-sdk
    participant API as /api/*

    Page->>Hook: useQuery / mutation
    Hook->>SDK: typed method
    SDK->>API: fetch(NEXT_PUBLIC_API_URL + path)
    API-->>SDK: JSON
    SDK-->>Page: typed result
```

---

## Scripts

| Command | Action |
|---------|--------|
| `pnpm dev:community` | `next dev --port 3000` |
| `pnpm start:community` | Full stack via `start-stack.ps1` |
| `pnpm dev:stack:community` | API + community only (no infra) |
| `pnpm --filter @tsc/community build` | Production build |

---

## UI Stack

- **Styling:** Tailwind CSS 3 + `tailwindcss-animate`
- **Components:** Radix primitives + local `src/components/ui/*` (shadcn-style)
- **Forms:** react-hook-form + zod resolvers
- **Motion:** framer-motion

`@tsc/ui` package exists in monorepo but community primarily uses local components today.

---

## Production (Vercel)

| Setting | Value |
|---------|-------|
| Target repo | `The-Shakti-Collective/tsc-community` |
| Domain | `community.theshakticollective.in` |
| Framework preset | Next.js |
| API URL (prod) | `https://api.theshakticollective.in` |

Scaffold: `org-scaffold/tsc-community/vercel.json`, `.github/workflows/ci.yml`

---

## Known Limitations

- Historical build issues importing incomplete CoreKnot client paths (replaced with local stubs per Stage 1 report)
- Clerk production JWT flow not fully wired to API
- Some pages are placeholders (`placeholder-page.tsx`)

See [known-gaps.md](../decisions/known-gaps.md).

---

## Related

- [community-sdk in packages/overview.md](../packages/overview.md)
- [api.md](api.md)
- [local-dev.md](../infrastructure/local-dev.md)
