# System Context

> C4-style context: who interacts with what, and what sits outside our boundary.

## Actors

| Actor | Interacts with | Auth |
|-------|----------------|------|
| **Community member** | TSC Community, Platform API | Clerk |
| **Public visitor** | TSC Website, Platform API (public routes) | Anonymous or Clerk |
| **Artist / creator** | Community, Marketplace, Passport | Clerk |
| **Brand / partner** | Opportunities, deals (Platform) | Clerk + org membership |
| **Staff / operator** | CoreKnot Client, CoreKnot API | JWT (target: Clerk SSO) |
| **Founder / admin** | All dashboards, Railway, Vercel, Neon | Provider IAM |
| **External integrations** | Webhooks → CoreKnot or Platform API | HMAC secrets, API keys |

## System boundary

**Inside TSC boundary:**

- `tsc-platform` monorepo (Website, Community, Platform API, packages)
- `tsc-coreknot` (Client, Server, Workers) — currently nested in monorepo
- Shared packages (`@tsc/database`, `@tsc/contracts`, …)
- CI/CD (GitHub Actions)
- Observability config (Sentry, PostHog, BetterStack scaffolds)

**Outside TSC boundary (managed services):**

| System | Role | Owner |
|--------|------|-------|
| **Neon** | PostgreSQL | Founder |
| **Redis** (Upstash/Railway KV) | Queues, cache | Founder |
| **Clerk** | Identity, sessions | Founder |
| **Cloudflare** | DNS, R2, WAF | Founder |
| **Vercel** | Frontend hosting | Founder |
| **Railway** | API + worker hosting | Founder |
| **PostHog** | Product analytics | Founder |
| **Sentry** | Error tracking | Founder |
| **Resend** | Transactional email | Founder |
| **Typesense** | Search (P2 scaffold) | Founder |
| **MongoDB Atlas** | **Legacy — sunset** | Deprecate after Postgres cutover |

## Context diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Members    │     │   Public     │     │    Staff     │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       ▼                    ▼                    ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Community   │     │   Website    │     │ CoreKnot     │
│  (Next.js)   │     │  (Next.js)   │     │ Client(Vite) │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘
       │                    │                    │
       └──────────┬─────────┘                    │
                  ▼                              ▼
       ┌────────────────────┐         ┌────────────────────┐
       │   TSC Platform API │         │   CoreKnot API     │
       │   NestJS :4000     │         │   Express :5000    │
       └─────────┬──────────┘         └─────────┬──────────┘
                 │                              │
                 └──────────────┬───────────────┘
                                ▼
                 ┌──────────────────────────────┐
                 │ Neon PG │ Redis │ Clerk      │
                 └──────────────────────────────┘
                                │
       ┌────────────────────────┼────────────────────────┐
       ▼                        ▼                        ▼
  PostHog                  Sentry                   Cloudflare R2
```

## Cross-boundary flows (allowed)

| From | To | Mechanism | Example |
|------|-----|-----------|---------|
| Website | CoreKnot API | Webhook + shared secret | Book-call, newsletter, artist-path |
| Platform API | CoreKnot API | Server-to-server (optional) | `COREKNOT_SYNC_URL` — sync events |
| CoreKnot API | Platform API | Server-to-server | Passport/feed proxy via `TSC_API_URL` |
| Clerk | Platform API | Webhook | User lifecycle (target — not yet wired) |
| Resend | CoreKnot API | Webhook | Mail campaign tracking |

## Cross-boundary flows (forbidden)

- Community → CoreKnot API directly from browser (staff data exposure)
- CoreKnot Client → Platform API for CRM/project/task mutations (dual write risk)
- Any new MongoDB dependency in Platform API or new apps
- Separate PostgreSQL instances per app without architecture review

## Trust zones

| Zone | Exposure | Data sensitivity |
|------|----------|------------------|
| **Public** | Internet, no auth | Marketing content, public events |
| **Member** | Clerk-authenticated | Profiles, feed, memberships |
| **Staff** | JWT/Clerk + org scope | CRM, finance, attendance |
| **Admin** | Role-gated | Audit logs, system settings |
| **Internal** | Provider consoles only | Secrets, infra |
