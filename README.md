# TSC Platform

The Sound Collective monorepo — API, community app, shared packages.

**Master context (everything):** [MASTER-CONTEXT.md](./MASTER-CONTEXT.md)  
**Full startup guide:** [STARTUP.md](./STARTUP.md)

| Platform                                      | Role                                                  |
| --------------------------------------------- | ----------------------------------------------------- |
| **GitHub Organization (TheShaktiCollective)** | Central home for all code repositories                |
| **tsc-api**                                   | Main backend and business logic                       |
| **tsc-coreknot**                              | Internal CRM, artist management, finance, operations  |
| **tsc-community**                             | Public community platform for artists, fans, managers |
| **tsc-web**                                   | Marketing website, landing pages, SEO                 |
| **tsc-shared**                                | Shared types, contracts, permissions, constants       |
| **tsc-infra**                                 | Infrastructure and deployment configurations          |
| **Cloudflare**                                | DNS, SSL, CDN, WAF, caching, storage (R2)             |
| **Cloudflare R2**                             | File storage (images, videos, documents)              |
| **Neon PostgreSQL**                           | Main database (source of truth)                       |
| **Railway**                                   | Backend hosting and Redis hosting                     |
| **Redis**                                     | Cache, queues, sessions, background jobs              |
| **BullMQ**                                    | Job processing system using Redis                     |
| **Vercel**                                    | Frontend hosting (Website, Community, CoreKnot)       |
| **Clerk**                                     | Authentication and user management                    |
| **Typesense**                                 | Search engine                                         |
| **PostHog**                                   | Product analytics and user behavior tracking          |
| **Sentry**                                    | Error monitoring and crash tracking                   |
| **BetterStack**                               | Uptime monitoring, logs, alerts                       |
| **Prisma**                                    | Database ORM and migrations                           |
| **NestJS**                                    | Backend framework                                     |
| **Next.js**                                   | Website and Community frontend framework              |
| **React**                                     | Frontend UI library                                   |
| **TypeScript**                                | Type-safe development                                 |
| **TailwindCSS**                               | Styling system                                        |
| **Sh                                          |                                                       |


## TL;DR

```powershell
pnpm setup    # first time only
pnpm start    # Postgres + Redis + API + Community
```

- Community: http://localhost:3000  
- API: http://localhost:4000/api
