# Scalability Certificate (Agent 15)

> **Date:** 2026-06-15  
> **Method:** Architecture-level review (no load tests)  
> **Prior audit:** [../readiness/SCALABILITY-REPORT.md](../readiness/SCALABILITY-REPORT.md)

## Verdict

**WARN** — Platform API structurally sound to ~10K users; CoreKnot Mongo path blocks scale past beta; 100K requires infra tier upgrades.

## Scale model

### ~100 users (alpha)

| Layer | Status | Notes |
|-------|--------|-------|
| Neon single branch | ✅ | Free/starter tier OK |
| 1× Platform API (Railway) | ✅ | Stateless NestJS |
| Vercel frontends | ✅ | Serverless |
| Redis | ✅ | Low queue volume |
| CoreKnot Mongo | ⚠️ | Works; ops overhead |

### ~1K users (beta)

| Layer | Status | Action |
|-------|--------|--------|
| Platform API | ✅ | Enable Neon connection pooler |
| Prisma hot paths | ⚠️ | Batch `include` on lists |
| Community → real API | P1 | Index `Person`, `Event` ready |
| CoreKnot | ⚠️ | Complete Postgres P0 domains |

### ~10K users

| Layer | Status | Action |
|-------|--------|--------|
| Platform API horizontal scale | ⚠️ | Railway replicas 2–4 |
| Postgres indexes | ⚠️ | Audit `Lead`, `Task`, `Notification` |
| Typesense search | ❌ | Scaffold only — Postgres ILIKE insufficient |
| R2 media | ⚠️ | Direct upload + CDN |
| BullMQ workers | ⚠️ | Dedicated worker process count |
| CoreKnot Mongo primary | ❌ | **Blocker** — MONGO-SUNSET P0→P2 |

### ~100K users

| Layer | Status | Action |
|-------|--------|--------|
| Neon | P1 | Read replicas; connection limits |
| Platform API | P1 | Autoscale 2–8; cache hot reads in Redis |
| Redis | P1 | Dedicated cluster; queue isolation |
| CoreKnot workers | P1 | Separate Railway worker service (documented) |
| Graph `Relationship` | P2 | Partition / archive |
| Activity feed | P2 | Cursor pagination + materialized views |
| PostHog / replay | P2 | Sampling |

## Redis usage (architecture)

| Consumer | Pattern | Scale note |
|----------|---------|------------|
| Platform API queues | BullMQ via `queues/` | Scale workers horizontally |
| CoreKnot mail campaigns | BullMQ | Requires `REDIS_URL` on API + worker |
| Session/cache | Optional | Not primary session store (Clerk/JWT) |

## Query / worker audit (high level)

| Pattern | Risk at 10K | Remediation |
|---------|-------------|-------------|
| Task list + assignees N+1 | Medium | Prisma `include` batching |
| Notification fan-out | Medium | Queue + batch insert |
| Graph traversal | High | Index + depth limits |
| CoreKnot Mongo aggregations | High | Postgres cutover |
| OpenAPI 415 paths | Low | Stateless — scale replicas |

## Before / after (this program)

| Before | After |
|--------|-------|
| Scalability doc in `docs/readiness/` only | Certified copy in `docs/elimination/` with deploy authority cross-links |
| Render ambiguity | Railway-only — clearer worker topology |

## Risk

Architectural recommendations — not validated by load test. Run k6/Artillery on staging before 10K launch.

## Rollback

N/A — documentation only.
