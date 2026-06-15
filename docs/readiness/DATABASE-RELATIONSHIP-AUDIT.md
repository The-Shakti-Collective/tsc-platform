# Database Relationship Audit (Agent 15)

> **Date:** 2026-06-15  
> **Schema source:** `packages/database/prisma/schema.prisma` (123 models, 3279 lines)  
> **Migrations:** `packages/database/prisma/migrations/` — 2 applied migrations (`20250613000000_init`, `20250614000000_coreknot_domain_p1_p3`)  
> **Verdict:** **FAIL** — relationships are structurally sound in Prisma, but production schema drift and cross-product orphan risks block certification.

Cross-reference: [DATA-OWNERSHIP-MAP.md](../architecture/DATA-OWNERSHIP-MAP.md) · [TECH-DEBT-ROADMAP.md](../architecture/TECH-DEBT-ROADMAP.md) C2

---

## Executive summary

Prisma schema defines coherent FK chains for the audited relationship groups. Indexes exist on most join and filter columns. Critical gaps are **semantic** (missing cross-domain links), **migration drift** (Neon may not match merged schema), and **optional FKs** that allow orphan rows during Mongo→Postgres cutover.

---

## Audited relationship groups

### Workspace → Members

| Check | Status | Detail |
|-------|--------|--------|
| `WorkspaceMember.workspaceId → Workspace` | ✅ | `onDelete: Cascade` |
| `WorkspaceMember.personId → Person` | ✅ | `@@unique([workspaceId, personId])` |
| `Workspace.ownerPersonId → Person` | ✅ | Cascade delete |
| `WorkspaceTeam → Workspace` | ✅ | Unique slug per workspace |
| Indexes | ✅ | `[personId, status]`, `[workspaceId]` |

**Gap:** `Workspace` has **no `organizationId`**. Ops workspaces are not linked to `Organization` in Prisma — tenant isolation is slug-based only. Cross-reference with CoreKnot Mongo tenant mapping via `CkLegacyTenant` bridge tables.

### Organization → Teams / Members

| Check | Status | Detail |
|-------|--------|--------|
| `OrganizationMember` | ✅ | Unique `[organizationId, personId]`, cascade |
| `OrganizationTeam` | ✅ | Unique `[organizationId, slug]`, optional `leadPersonId` |
| `OrganizationTeamMember` | ✅ | Unique `[teamId, personId]` |
| Indexes | ✅ | Role and status indexes present |

### Person → User → Identity

| Check | Status | Detail |
|-------|--------|--------|
| `User.personId` | ✅ | `@unique`, required, cascade |
| `User.clerkUserId` | ✅ | `@unique` |
| `Identity.personId` | ✅ | `@unique`, 1:1 with Person |
| `TscIdentity` | ✅ | Separate passport model (see schema ~L1879) |
| Person merge | ✅ | `mergedIntoId` self-ref, `SetNull`, indexed |

**Orphan risk:** Clerk users without webhook provisioning → `User`/`Person` rows never created (`TECH-DEBT-ROADMAP` C4).

### Project → Tasks / Members

| Check | Status | Detail |
|-------|--------|--------|
| `Project.workspaceId → Workspace` | ✅ | Cascade |
| `ProjectMember` composite PK | ✅ | `[projectId, personId]` |
| `Task.workspaceId` | ✅ | Required, cascade |
| `Task.projectId` | ⚠️ | Optional; `onDelete: SetNull` — tasks survive project delete (intentional) |
| `TaskAssignee`, `TaskComment`, `TaskChecklist` | ✅ | Cascade from Task |

**N+1 risk:** Task list endpoints in `apps/api/src/modules/task/task.repository.ts` fetch assignees separately unless batched — acceptable at small scale; add `include` at 10K+ tasks/workspace.

### Task → Assignees / Comments

| Check | Status | Detail |
|-------|--------|--------|
| `TaskAssignee` composite PK | ✅ | `[taskId, personId]` |
| `TaskComment.authorPersonId` | ✅ | Cascade |
| Missing assignee FK to ProjectMember | ⚠️ | Assignee need not be project member — business rule in app layer only |

### Lead → Organization

| Check | Status | Detail |
|-------|--------|--------|
| `Lead.organizationId` | ✅ | Required, cascade |
| `Lead.assignedPersonId` | ✅ | Optional, `SetNull` |
| Index | ✅ | `[organizationId, stage]` |

**Dual-write risk:** Platform API `CrmModule` and CoreKnot CRM both target `Lead` when `COREKNOT_CRM_STORE=postgres`.

### Invoice → Project

| Check | Status | Detail |
|-------|--------|--------|
| Direct FK | ❌ | **`Invoice` has no `projectId`** |
| Indirect paths | ⚠️ | `Invoice → Contract/Deal/BookingRequest → Artist` only |
| `Expense.organizationId` | ✅ | Org-scoped finance exists separately |

**Finding:** Cannot query project P&L from invoices without traversing deal graph. Add `projectId` optional FK or document intentional omission.

### Contract → Organization

| Check | Status | Detail |
|-------|--------|--------|
| Direct FK | ❌ | **`Contract` has no `organizationId`** |
| Links | ⚠️ | `templateId`, `dealId`, `artistId`, `brandId` only |

Staff org context must be inferred from deal/opportunity `organizationId`.

### Membership → FanProfile / Reward

| Check | Status | Detail |
|-------|--------|--------|
| `Membership → Community` | ✅ | Cascade |
| `MembershipSubscription → Person` | ✅ | Unique per membership+person |
| `FanProfile.personId` | ✅ | 1:1 unique |
| `Reward → Membership` | ❌ | **No FK** — rewards are credit-based globally (`Reward.creditCost`) |
| `RewardRedemption → Person` | ✅ | Links person to reward |

Access gating is application-layer: subscribe creates `MembershipSubscription` + graph `SUBSCRIBED` edges, not a direct Reward link.

### Event → Participation / Gig → Artist

| Check | Status | Detail |
|-------|--------|--------|
| `EventParticipation` | ✅ | Unique `[eventId, personId]`, indexed by role/status |
| `Event.artistId`, `Event.venueId` | ✅ | Optional, `SetNull` |
| `Gig.organizationId`, `Gig.artistId` | ✅ | Indexed by org date and artist |
| `Artist.personId` | ⚠️ | **Optional** — artist records can exist without Person |

---

## Cross-cutting findings

### Orphan risks

| Risk | Severity | Mitigation |
|------|----------|------------|
| `Artist.personId` nullable | P1 | Enforce on create in Platform API; backfill ETL |
| Clerk user without `User` row | P0 | Clerk webhook → provisioning |
| Mongo→Postgres ID mismatch | P0 | `CkLegacy*` mapping tables + parity scripts |
| `Task.projectId` null after project delete | P2 | Accept or archive tasks |

### Cascade delete risks

| Chain | Risk |
|-------|------|
| Delete `Person` | Cascades to User, Identity, FanProfile, memberships, task assignees — **high blast radius** (correct for GDPR, dangerous for accidental delete) |
| Delete `Organization` | Cascades Leads, Inquiries, Gigs, Expenses — **irreversible** |
| Delete `Workspace` | Cascades all projects and tasks |

No soft-delete pattern at DB level for core entities.

### Missing indexes (minor)

| Model | Suggestion |
|-------|------------|
| `Invoice` | Consider `[organizationId]` if org FK added |
| `Contract` | Consider `[organizationId]` if org FK added |
| `Notification` | `[recipientPersonId, readAt]` exists ✅ |

### Migration drift (P0)

- Merged schema has 123 models; only **2 migration folders** exist.
- `TECH-DEBT-ROADMAP` C2 documents P3018 drift on Neon.
- **Action:** Run `prisma migrate diff` against Neon prod branch before deploy; never `db push` on prod.

### Circular references

- `Person.mergedIntoId` self-reference — acyclic by convention; no DB constraint preventing cycles.
- `Deal ↔ Opportunity ↔ Organization` — no circular FKs.

---

## Build health

```text
pnpm --filter @tsc/api typecheck → PASS (2026-06-15)
```

---

## Certification

| Criterion | Result |
|-----------|--------|
| FK chains defined for core groups | ✅ |
| Indexes on hot paths | ✅ |
| No broken Prisma relations | ✅ |
| No orphan risk | ❌ |
| No migration drift | ❌ |
| Invoice→Project / Contract→Org modeled | ❌ |

**Agent 15 verdict: FAIL**
