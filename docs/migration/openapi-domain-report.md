# OpenAPI domain report — Agent L6

**Date:** 2026-06-14  
**Spec:** `apps/api/openapi/tsc-api.openapi.json`  
**Reference:** [03-domain-mapping.md](./03-domain-mapping.md) · [04-api-compatibility.md](./04-api-compatibility.md) · [route-validation.md](./route-validation.md)  
**Export:** `pnpm --filter @tsc/api openapi:export` (re-run this session after L5 route fixes)

---

## Executive summary

| Metric | Value |
|--------|-------|
| OpenAPI paths | **415** (+2 vs prior 413 after L5: `GET /api/campaigns`, `GET /api/finance/invoices`, `GET /api/contracts` list) |
| HTTP operations | **492** |
| Legacy Express inventory (audit) | ~448 routes |
| CoreKnot P0 compat routes | Present (`/api/crm/leads`, `/api/projects`, `/api/tasks`) |
| TSC-native domains (no legacy) | Command Center (82), Audience (9), much of Community/Marketplace |

**Verdict:** OpenAPI surface is **broad on TSC platform domains** and **partial on CoreKnot ops parity**. Largest gaps vs [03-domain-mapping.md](./03-domain-mapping.md): calendar/schedule, mail/campaigns CRUD, legacy auth, dashboard, finance doc folders, CRM import/export/EMI execution (stubs exist for several CRM reads).

---

## Path counts by domain

Classification rules: primary URL prefix + workspace-scoped project/task routes attributed to Projects/Tasks (not Workspace). Cross-cutting paths (health, admin, public API, sync, search, messaging, notifications) listed separately — not in the 12-domain rollup total.

| Domain | Paths | % of 415 | Mapping status (vs 03) |
|--------|------:|---------:|------------------------|
| **Command Center** | 82 | 19.8% | TSC-native — not in CoreKnot legacy map |
| **Community** | 59 | 14.2% | Partial — communities/events strong; newsletter/pinboard absent |
| **Artists** | 56 | 13.5% | Partial — CRUD + gigs/releases; connection hub/OS **new** |
| **Cross-cutting** | 51 | 12.3% | Platform infra (see below) |
| **Identity** | 41 | 9.9% | Partial — person/profile strong; data-hub/auth **new** |
| **Finance** | 23 | 5.5% | Partial — expenses/invoices/deals; folders/subscriptions **new** |
| **CRM** | 22 | 5.3% | Partial — leads + booking; import/export/EMI **stub/missing** |
| **Analytics** | 22 | 5.3% | Partial — compare/sparkline/cumulative + AI; dashboard **missing** |
| **Workspace** | 11 | 2.7% | Partial — workspace CRUD; departments/org-accounts **new** |
| **Marketplace** | 18 | 4.3% | Scaffold + opportunities — aligns with map |
| **Projects** | 12 | 2.9% | Partial — P0 compat + native slug routes; KRA/goals **new** |
| **Audience** | 9 | 2.2% | TSC-native — extends artist analytics |
| **Tasks** | 9 | 2.2% | Partial — CRUD + checklist/comments; activity purge **new** |

**12-domain subtotal:** 364 paths (excluding 51 cross-cutting).

---

## Cross-cutting (51 paths)

Not assigned to product domains; required for platform ops and public API.

| Prefix | Count | 03-domain-mapping target |
|--------|------:|--------------------------|
| `/api/health/*` | 6 | `health/` — **Reuse** |
| `/api/admin/*` | 14 | `admin/` — **Reuse (stub)** |
| `/api/public/v1/*` | 12 | `public-api/` — **New** |
| `/api/relationships/*` | 4 | graph layer |
| `/api/integrations/*` | 2 | `integrations/` — partial |
| `/api/messaging/*` | 2 | `messaging/` — partial |
| `/api/notifications` | 2 | `notification/` — partial |
| `/api/search` | 2 | `search/` — **Reuse** |
| `/api/sync/*` | 2 | `sync/` — **Reuse** |
| `/api/exchange/*` | 2 | `data-exchange/` — **Reuse** |
| `/api/graph/*` | 1 | graph module |
| `/api/audit/logs` | 1 | `audit/` — **Reuse** |
| `/api/campaigns` | 1 | `messaging/` — L5 stub only |

---

## Domain detail & gaps vs 03-domain-mapping

### Identity (41 paths)

**OpenAPI prefixes:** `/api/identity/*`, `/api/profile/*`, `/api/passport/*`, `/api/tsc-identity/*`, `/api/creative-identity/*`, `/api/skills/*`, `/api/users/*`

| 03 target module | In OpenAPI | Gap |
|------------------|------------|-----|
| `identity/` resolve, merge, person 360 | Yes | — |
| `users/` list, me, create | Yes (`/api/users`, `/api/users/me`) | Admin user CRUD **new** |
| `common/auth/` Clerk | Guard only — no paths | Legacy `/api/auth/*` login/OAuth **missing** (Clerk cutover) |
| data-hub (reconcile, backup, folders) | No | **New** per §1 |
| Person hub / network | Yes | — |

**Legacy routes absent:** `/api/auth/register`, `/api/auth/login`, `/api/auth/oauth/*`, data-hub `/api/data-hub/*`.

---

### Workspace (11 paths)

**OpenAPI prefixes:** `/api/workspace/*`, `/api/teams`, `/api/white-label/*`

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| `workspace/` CRUD, members, teams | Yes | — |
| `teams/` basic CRUD | Yes (`/api/teams`, workspace teams) | Team assignment flows **new** |
| `organizations/` departments, org-accounts | No dedicated prefix | Department presets, org-account import **new** |
| attendance / leave | No | **New** (§2) |
| white-label tenants | Yes | — |

**Note:** 8 workspace-scoped project/task paths counted under Projects/Tasks.

---

### Projects (12 paths)

**OpenAPI:** legacy flat `/api/projects/*` (9) + native `/api/workspace/{slug}/projects/*` (3)

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| workspace-scoped project CRUD | Yes | — |
| P0 legacy compat (`GET /api/projects`) | Yes | — |
| analytics-summary, workload, hours-summary | Yes (compat stubs) | Real analytics wiring **new** |
| KRA (`projectKraController`) | No | **New** (§5) |
| goals (`projectGoalsController`) | No | **New** (§5) |
| Google calendar link | No | `calendar/` + `integrations/` **new** |

---

### Tasks (9 paths)

**OpenAPI:** legacy `/api/tasks/*` (4) + native checklist/comments (5)

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| task CRUD | Yes | — |
| checklists, comments | Yes (native) | — |
| activity feed | Partial (`GET …/activity` compat) | Full activity + purge job **new** |
| bug report | Yes (`POST /api/tasks/bug`) | — |
| mention receipts | No | **New** (§5) |

---

### Finance (23 paths)

**OpenAPI prefixes:** `/api/finance/*`, `/api/invoices`, `/api/deals/*`, `/api/contracts/*`, `/api/payments/*`, `/api/royalties/*`

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| `finance/` expenses, summary | Yes | — |
| `invoices/` workflow | Yes (`/api/invoices`, alias `/api/finance/invoices`) | Legacy `/api/finance/my-invoices`, `/pending` **missing** |
| `contract/` | Yes | — |
| deals / escrow / payouts | Yes (TSC) | — |
| document folders, bulk upload | No | **New** (§7) |
| `subscription/` CRUD | No | **New** (§7) |

**L5 fixes confirmed in spec:** `GET /api/contracts`, `GET /api/finance/invoices`, `GET /api/campaigns` (stub under cross-cutting).

---

### CRM (22 paths)

**OpenAPI prefixes:** `/api/crm/*`, `/api/booking/*`

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| leads CRUD + notes | Yes | — |
| stats, config, imports, followups, rep-summary | Yes (mostly **stubs**) | Real import/export/EMI **new** |
| unsubscribe | Yes | — |
| export, reset | No | **New** (§4) |
| office contacts | No | **New** (§4) |
| artist CRM import | No | **New** (§4) |
| `inquiries/` webhooks | Partial via booking | Exly/webhook parity **new** |

**Present but stub (per 04-api-compatibility):** `/api/crm/stats`, `/api/crm/config`, `/api/crm/imports`, `/api/crm/followups`, lead audit.

---

### Artists (56 paths)

**OpenAPI prefixes:** `/api/artists/*`, `/api/gigs`, `/api/brands/*`, `/api/agencies/*`, `/api/labels/*`, `/api/fans/*`, `/api/support/*`, `/api/trust/*`, `/api/releases/*`, `/api/content/*`, `/api/distribution/*`, artist-scoped contracts/deals/passport

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| `artist/` CRUD | Yes | — |
| `gigs/` | Yes | — |
| `releases/` + `content/` | Yes | — |
| `distribution/` scaffold | Yes | DistroKid depth **new** |
| connection hub / OAuth | No | **New** (§3) |
| artist-path import | No | **New** (§3) |
| artist OS workspace | Partial (creative-identity) | Full OS **new** |
| Spotify token manager | No | **New** (§3) |
| `calendar/` artist events | No `/api/calendar` | **Missing** — P1 |

---

### Marketplace (18 paths)

**OpenAPI prefixes:** `/api/marketplace/*`, `/api/opportunities/*`, `/api/commerce/*`

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| `marketplace/` scaffold | Yes | Depth vs legacy minimal surface |
| `opportunity/` browse/apply | Yes | — |
| commerce (tickets, merch, experiences) | Yes (TSC) | — |

Aligns with §9 — reuse scaffolds present; UploadThing→R2 migration tracked elsewhere.

---

### Community (59 paths)

**OpenAPI prefixes:** `/api/communities/*`, `/api/events/*`, `/api/activity/*`, `/api/collaborations/*`, `/api/memberships/*`, `/api/reputation/*`, `/api/discovery/*`, `/api/rewards/*`, `/api/credits/*`, `/api/feed|posts` health

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| communities, events, memberships | Yes | — |
| feed/posts | Health only | Full feed CRUD may be off-spec or unexported |
| newsletter | No | **New** (§8) |
| pinboard / notes | No | **New** (§14 misc) |
| gamification | Partial (`/api/rewards`) | XP/missions/leaderboard **partial** |

---

### Audience (9 paths)

**OpenAPI prefixes:** `/api/audience/*`, `/api/audience-os/*`

TSC-native domain — not in CoreKnot legacy map. Overlaps 03 §3 `ArtistAudienceSnapshot` → `analytics/` + **audience/** module.

| Capability | In OpenAPI |
|------------|------------|
| Artist/community health | Yes |
| Insights (growth, churn) | Yes |
| Audience OS dashboards | Yes |
| Refresh jobs | Yes |

No CoreKnot gap — greenfield surface.

---

### Analytics (22 paths)

**OpenAPI prefixes:** `/api/analytics/*`, `/api/intelligence/*` (non–command-center), `/api/ai/*`

| 03 target | In OpenAPI | Gap |
|-----------|------------|-----|
| compare, sparkline, cumulative | Yes | — |
| `ai/` email, pitch, proposal | Yes | Wire to mail/CRM **new** |
| dashboard summary, dept-stats | No `/api/dashboard` | **Missing** — P1 |
| attendance overview | No | **New** (§10) |
| mail/geo analytics | No | **New** (§8) |
| unified search scope | Partial (`/api/search`) | Cross-entity index **new** |

---

### Command Center (82 paths)

**OpenAPI prefixes:** `/api/intelligence/command-center/*`, `/api/intelligence/executive/*`, `/api/intelligence/actions/*`, `/api/intelligence/automation/*`, `/api/intelligence/goals/*`, `/api/agents/*`

TSC platform intelligence layer — **no CoreKnot legacy equivalent** in [03-domain-mapping.md](./03-domain-mapping.md). Largest single domain in the spec.

Includes: executive dashboards, automation rules, copilot, workflows, talent discovery, brand match, opportunity generation, forecast agents.

---

## Legacy prefix quick-check (validation probes)

| Legacy prefix | In OpenAPI? | Notes |
|---------------|-------------|-------|
| `/api/crm/leads` | Yes | P0 compat |
| `/api/projects` | Yes | P0 compat |
| `/api/tasks` | Yes | P0 compat |
| `/api/contracts` | Yes | L5 list added |
| `/api/campaigns` | Yes | L5 stub (`[]`) |
| `/api/finance/invoices` | Yes | L5 alias |
| `/api/calendar` | **No** | P1 gap |
| `/api/dashboard` | **No** | P1 gap |
| `/api/mail` | **No** | P1 gap |
| `/api/auth` | **No** | Clerk replaces |
| `/api/schedule` | **No** | P1 gap |
| `/api/gamification` | **No** | Partial via `/api/rewards` |
| `/api/notes`, `/api/pinboard` | **No** | P4 content |

---

## Queue & module parity (from 03 §Queue mapping)

| Legacy queue | Target queue | OpenAPI exposure |
|--------------|--------------|------------------|
| `tsc.feed`, `tsc.reputation`, `tsc.graph`, `tsc.recommendation` | Registered | Indirect (async) |
| `tsc.email`, `tsc.import`, `tsc.analytics`, `tsc.notification`, `tsc.maintenance` | P1 gaps | No dedicated admin paths beyond `/api/admin/queues/status` |

---

## Recommended follow-ups (L6 → parent)

| Priority | Item | Owner |
|----------|------|-------|
| P1 | Export/mount calendar, dashboard, mail campaign CRUD | Agent 06–07 |
| P1 | Finance legacy aliases: `my-invoices`, `pending` | Agent 5 |
| P1 | CRM import/export/EMI — replace stubs with real handlers | Agent 06 |
| P2 | Artist connection hub + path routes | Agent 07 |
| P0 | Auth probe harness (401 vs 500) — see [09-validation-report.md](./09-validation-report.md) V-002/V-003 | Agent 5/9 |
| — | Re-export after each route wave | `pnpm --filter @tsc/api openapi:export` |

---

## Changelog

| Date | Event |
|------|-------|
| 2026-06-14 | Agent L6 — initial domain audit; re-export → **415** paths (+2 post-L5) |
