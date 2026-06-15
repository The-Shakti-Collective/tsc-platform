# Scalability Report (Agent 20)

> **Date:** 2026-06-15  
> **Method:** Architectural review (no load tests run)  
> **Verdict:** **WARN** — Platform API structurally OK to ~10K users; CoreKnot Mongo path blocks scale; several P1 optimizations needed before 100K.

Cross-reference: [DEPLOYMENT-ARCHITECTURE.md](../architecture/DEPLOYMENT-ARCHITECTURE.md)

---

## Scale tiers

### ~100 users (alpha)

| Component | Assessment |
|-----------|------------|
| Neon Postgres single branch | ✅ Sufficient |
| Railway single Platform API instance | ✅ |
| Vercel serverless frontends | ✅ |
| Redis (queues) | ✅ Low volume |
| CoreKnot Mongo Atlas | ⚠️ Works but ops overhead |

**Blockers:** Founder infra not deployed — not a scale issue.

### ~1K users (beta)

| Component | Assessment | Recommendation |
|-----------|------------|----------------|
| Platform API | ✅ | Enable connection pooling (`?pgbouncer=true` or Neon pooler) |
| Clerk | ✅ | Standard plan |
| PostHog | ✅ | |
| Prisma queries | ⚠️ | Add `include` batching on task/project lists |
| Community mock → API | P1 | Real API calls increase DB load — index ready |
| CoreKnot | ⚠️ | Mongo primary — single replica set OK |

### ~10K users

| Component | Assessment | Recommendation |
|-----------|------------|----------------|
| Platform API | ⚠️ | Horizontal scale on Railway; stateless ✅ |
| Database | ⚠️ | Review hot indexes: `Person.email`, `Event.startsAt`, `Lead[organizationId,stage]` |
| N+1 queries | P1 | Task assignees, notification lists — use Prisma `include` |
| Search | ❌ | Typesense scaffold only — Postgres `ILIKE` won't scale |
| Media R2 | ⚠️ | Scaffold — direct uploads need CDN |
| Background jobs | ⚠️ | BullMQ via `queues/` — verify worker count |
| CoreKnot Mongo | ❌ | **Primary blocker** — must complete Postgres cutover |

### ~100K users

| Component | Assessment | Recommendation |
|-----------|------------|----------------|
| Neon | P1 | Read replicas for analytics; branch per env |
| Platform API | P1 | Autoscale 2–8 instances; separate read-heavy routes |
| Redis | P1 | Dedicated cluster; queue isolation |
| CoreKnot workers | P1 | Separate worker service (Railway pattern documented) |
| Graph `Relationship` table | P2 | Partition or archive old edges |
| Activity feed | P2 | Cursor pagination + materialized feeds |
| Session replay / PostHog | P2 | Sampling |

---

## Index review (sampled hot paths)

| Table | Indexes | Adequate to 10K? |
|-------|---------|------------------|
| `Person` | email, mergedIntoId | ✅ |
| `User` | clerkUserId unique | ✅ |
| `OrganizationMember` | personId+status, orgId+role | ✅ |
| `Task` | workspaceId, projectId, status | ✅ |
| `Lead` | orgId+stage | ✅ |
| `EventParticipation` | eventId+role+status | ✅ |
| `Notification` | recipientPersonId, createdAt | ✅ |
| `Relationship` | source/target composite | ⚠️ Graph queries may need covering indexes |

---

## Query patterns

| Pattern | Location | Risk |
|---------|----------|------|
| List + map (no join) | CRM, inquiries services | Low at 1K rows/org |
| Aggregate revenue via deal join | `finance.service.ts` | Medium — add org-scoped materialized view at scale |
| Intelligence snapshots | Multiple agents repos | Heavy JSON — cache in Redis |
| CoreKnot Mongo pagination | `paginatedQuery.js` | Unknown index coverage on legacy collections |

---

## Caching & Redis

| Use | Status |
|-----|--------|
| BullMQ job queues | ✅ `apps/api/src/queues/` |
| API key rate limit | In-memory stub — **not Redis-backed** |
| HTTP cache headers | Vercel CDN for static only |
| CoreKnot background queue | Mongo + Redis refs in `backgroundQueue.js` |

**P1:** Move rate limits and session cache to Redis for multi-instance Platform API.

---

## Background workers

| Worker | Host | Scale note |
|--------|------|------------|
| Platform queues | Railway (same service?) | Split worker process at 10K |
| CoreKnot workers | Railway separate service | Documented in `railway.toml` |
| CoreKnot cron/imports | `statsWorker.js`, `importWorker.js` | Mongo-bound |

---

## Recommendations (prioritized)

| Priority | Item |
|----------|------|
| P0 | Complete CoreKnot Mongo sunset — single DB simplifies scaling |
| P1 | Neon connection pooling + Prisma `connection_limit` |
| P1 | Redis-backed rate limiting |
| P1 | Typesense for community search |
| P1 | Batch Prisma reads on task/project list endpoints |
| P2 | Read replica for analytics/intelligence modules |
| P2 | CDN for R2 media via Cloudflare |
| P3 | Relationship table archival policy |

---

## Certification

| Tier | Ready? |
|------|--------|
| 100 users | ⚠️ WARN (infra not live) |
| 1K users | ⚠️ WARN |
| 10K users | ❌ (Mongo + search gaps) |
| 100K users | ❌ |

**Agent 20 verdict: WARN**
