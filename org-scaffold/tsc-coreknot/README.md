# tsc-coreknot

Internal operations platform for The Shakti Collective.

## Source migration

Extract from monorepo:

- `apps/coreknot/` → repository root (includes `client/` Next.js app)

## Domain

| Environment | URL |
|-------------|-----|
| Production | `https://coreknot.theshakticollective.in` |
| Staging | `https://coreknot-staging.theshakticollective.in` |

## Visibility

**Private** — TSC team, managers, operations only.

## Stack

- Next.js, React, TypeScript, TailwindCSS, Shadcn UI
- Clerk auth (shared identity)
- Deploy: **Vercel**

## Environment variables

```
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_SENTRY_DSN=
```

## Dependencies

```bash
pnpm add @tsc/types @tsc/contracts @tsc/permissions
```

Configure `.npmrc` for GitHub Packages (see `tsc-shared`).

## CI/CD

Copy workflow from `org-scaffold/tsc-infra/.github/workflows/template-frontend-ci.yml`.
