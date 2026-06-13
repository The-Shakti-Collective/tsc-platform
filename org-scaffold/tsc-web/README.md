# tsc-web

Marketing and discovery website for The Shakti Collective.

## Purpose

- Landing pages, programs, blog, SEO
- Public face of TSC at `theshakticollective.in`

## Status

**Greenfield stub** — not extracted from monorepo. Create fresh Next.js app during migration phase 8.

## Domain

| Environment | URL |
|-------------|-----|
| Production | `https://theshakticollective.in` |
| Staging | Vercel preview on `develop` |

## Visibility

**Public** GitHub repository.

## Stack

- Next.js (App Router), TypeScript, TailwindCSS
- Deploy: **Vercel**

## Environment variables

```
NEXT_PUBLIC_API_URL=          # Optional — for waitlist / lead forms
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=  # Optional — if auth on marketing
NEXT_PUBLIC_POSTHOG_KEY=
```

## Scaffold command (when creating repo)

```bash
pnpm create next-app@latest . --typescript --tailwind --app --src-dir
```

## CI/CD

Copy workflow from `org-scaffold/tsc-infra/.github/workflows/template-frontend-ci.yml`.
