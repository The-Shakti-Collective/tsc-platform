# Clerk — Authentication Setup

## Applications

Create separate Clerk applications (or instances) for:

| Environment | Used by |
|-------------|---------|
| Development | Local monorepo |
| Staging | Railway staging API + Vercel staging frontends |
| Production | Railway prod API + Vercel prod frontends |

## Sign-in methods

Enable:

- Google OAuth
- Email (OTP)
- Phone (OTP)

## Keys

| Key | Where |
|-----|-------|
| `CLERK_SECRET_KEY` | Railway (tsc-api), Vercel server (frontends) |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Vercel (build-time, all Next.js apps) |
| `CLERK_WEBHOOK_SECRET` | Railway (tsc-api webhook handler) |

## Allowed origins

Add all deployment URLs:

- `http://localhost:3000`, `3001`, `3002`
- `https://community-staging.theshakticollective.in`
- `https://community.theshakticollective.in`
- `https://coreknot-staging.theshakticollective.in`
- `https://coreknot.theshakticollective.in`
- `https://*.vercel.app` (preview)

## Webhooks

| Environment | Endpoint |
|-------------|----------|
| Staging | `https://api-staging.theshakticollective.in/api/webhooks/clerk` |
| Production | `https://api.theshakticollective.in/api/webhooks/clerk` |

Events: `user.created`, `user.updated`, `session.*` (as required by tsc-api)

## JWT / metadata

Configure roles/metadata aligned with `@tsc/permissions` package.

Docs: [Clerk Next.js](https://clerk.com/docs/quickstarts/nextjs)
