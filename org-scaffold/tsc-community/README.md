# tsc-community

Public ecosystem platform — profiles, communities, events, discovery.

## Source migration

Extract from monorepo:

- `apps/community/` → repository root

## Domain

| Environment | URL |
|-------------|-----|
| Production | `https://community.theshakticollective.in` |
| Staging | `https://community-staging.theshakticollective.in` |

## Visibility

Private during development; public GitHub repo optional after launch.

## Stack

- Next.js, React, TypeScript, TanStack Query, Zustand
- Clerk auth
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
pnpm add @tsc/types @tsc/contracts @tsc/community-sdk
```

## CI/CD

Copy workflow from `org-scaffold/tsc-infra/.github/workflows/template-frontend-ci.yml`.

## Note

Monorepo build may still have blockers in `apps/community` — fix in monorepo before extract.
