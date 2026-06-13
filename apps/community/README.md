# TSC Community Platform — Sprint 1

Foundation for identity, auth, and profiles in the TSC monorepo.

## Quick start

```bash
# Prerequisites: Node 20+, pnpm 9+, PostgreSQL, Redis (optional for queues)

cp .env.example .env
# Fill Clerk keys and DATABASE_URL

pnpm install
pnpm db:generate
pnpm db:migrate

# Terminal 1 — API
pnpm dev:api

# Terminal 2 — Community app
pnpm dev:community
```

- Community app: http://localhost:3000
- API: http://localhost:4000/api

## Sprint 1 scope

**Implemented:** Person/PersonProfile/Verification/PersonFollow schema, Identity + Profile API, permissions matrix, community-sdk, Next.js 15 app (auth, onboarding, passport, profile, settings), BullMQ queue stubs, graph edge stubs.

**Stubbed:** Feed, posts, notifications, DMs, payments, chat, full graph workers.

## Auth

**Clerk** on `apps/community` (Google, email OTP, phone OTP). API uses `StubAuthGuard` until Clerk JWT verification is wired in Sprint 2.
