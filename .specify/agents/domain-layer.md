# Domain Layer Agents

[← Hierarchy](multi-agent-hierarchy.md)

Product-domain health for Community, CoreKnot, Marketplace, Audience, and Workspace.

Each domain agent maps to API modules in `apps/api/src/app.module.ts` and corresponding frontend surfaces.

---

## 10. Community Agent

| Field | Value |
|-------|-------|
| **Layer** | Domain |
| **Purpose** | Profiles, communities, posts, events, collaborations, search, reputation |
| **Output** | `.agents/reports/community-status.md` |
| **Template** | [reports/templates/community-status.md](reports/templates/community-status.md) |
| **Frequency** | Daily |

### Task checklist

- [ ] Verify Community app builds and serves `:3000`
- [ ] Test key routes: `/feed`, `/profile`, `/communities`, `/events`, `/search`
- [ ] Check API modules: `feed`, `post`, `community`, `profile`, `event`, `search`, `reputation`
- [ ] Verify `@tsc/community-sdk` API client against live API
- [ ] Test permissions on community actions via `packages/permissions/`
- [ ] Check Typesense search if configured
- [ ] Flag `PlaceholderPage` routes still in `apps/community/app/`

### Checks / verifications

| Surface | Path | Probe |
|---------|------|-------|
| Frontend | `apps/community/` | HTTP 200 on key routes |
| API feed | `GET /api/feed/health` | `{ module: 'feed', status: ... }` |
| API community | `apps/api/src/modules/community/` | Module loads |
| Search | `apps/api/src/modules/search/` + `@tsc/search` | Index/query path |
| Reputation | `@tsc/reputation` | Package builds |

### Tools / commands

```powershell
pnpm --filter @tsc/community build
pnpm dev:community
curl.exe -s -o NUL -w "%{http_code}" http://127.0.0.1:3000/feed
pnpm --filter @tsc/community-sdk build
```

---

## 11. CoreKnot Agent

| Field | Value |
|-------|-------|
| **Layer** | Domain |
| **Purpose** | CRM, artist management, finance, projects, contracts, analytics (operator UI) |
| **Output** | `.agents/reports/coreknot-status.md` |
| **Template** | [reports/templates/coreknot-status.md](reports/templates/coreknot-status.md) |
| **Frequency** | Daily |

### Task checklist

- [ ] Build CoreKnot client: `pnpm --filter @tsc/coreknot-client build`
- [ ] Verify Vite proxy to API (`apps/coreknot/client/vite.config.ts`)
- [ ] Audit legacy sources in `apps/coreknot/` (parent folder, not workspace package)
- [ ] Check stub/mock API libs: `apps/coreknot/client/src/lib/*Api.js`
- [ ] Test operator routes: dashboard, artists, finance, projects
- [ ] Verify API modules: `finance`, `contract`, `project`, `analytics`, `creative-identity`
- [ ] Check Clerk/Vite auth: `VITE_CLERK_PUBLISHABLE_KEY`

### Checks / verifications

| Surface | Path | Notes |
|---------|------|-------|
| Client package | `apps/coreknot/client/` | `@tsc/coreknot-client` :3001 |
| Legacy pages | `apps/coreknot/` (non-client) | Not in pnpm workspace |
| Mock APIs | `rg "mock" apps/coreknot/client/src/lib` | List files with fallbacks |
| Health | `GET /health.json` | Static JSON 200 |

### Tools / commands

```powershell
pnpm --filter @tsc/coreknot-client build
pnpm dev:coreknot
pnpm start:coreknot
rg "mock" apps/coreknot/client/src/lib -l
```

---

## 12. Marketplace Agent

| Field | Value |
|-------|-------|
| **Layer** | Domain |
| **Purpose** | Opportunities, applications, deals, contracts, payments |
| **Output** | `.agents/reports/marketplace-status.md` |
| **Template** | [reports/templates/marketplace-status.md](reports/templates/marketplace-status.md) |
| **Frequency** | Weekly |

### Task checklist

- [ ] Audit API modules: `opportunity`, `deal`, `contract`, `payment`, `commerce`
- [ ] Verify contract schemas in `packages/contracts/`
- [ ] Check payment integration env vars (Stripe or equivalent — see `.env.example`)
- [ ] Test opportunity listing and application flows (API-level)
- [ ] Review deal lifecycle state machine in API services
- [ ] Cross-check CoreKnot finance views vs API finance module

### Checks / verifications

| Module | Path | Status |
|--------|------|--------|
| Opportunity | `apps/api/src/modules/opportunity/` | Registered in AppModule |
| Deal | `apps/api/src/modules/deal/` | Registered |
| Payment | `apps/api/src/modules/payment/` | Env vars configured |
| Commerce | `apps/api/src/modules/commerce/` | Registered |

### Tools / commands

```powershell
rg "OpportunityModule|DealModule|PaymentModule|CommerceModule" apps/api/src/app.module.ts
pnpm --filter @tsc/contracts build
```

---

## 13. Audience Agent

| Field | Value |
|-------|-------|
| **Layer** | Domain |
| **Purpose** | Fan profiles, memberships, rewards, superfans, retention |
| **Output** | `.agents/reports/audience-status.md` |
| **Template** | [reports/templates/audience-status.md](reports/templates/audience-status.md) |
| **Frequency** | Weekly |

### Task checklist

- [ ] Audit API modules: `fan`, `audience`, `audience-os`, `passport`
- [ ] Verify fan graph relationships: `FAN_GRAPH_RELATIONSHIP_TYPES` in database package
- [ ] Check membership flows and `packages/permissions/` role mappings
- [ ] Review audience intelligence: `audience-os` module stubs vs implemented
- [ ] Track retention metrics hooks in PostHog (if events defined)
- [ ] Test fan profile API endpoints when API is running

### Checks / verifications

| Component | Path |
|-----------|------|
| Fan module | `apps/api/src/modules/fan/` |
| Audience module | `apps/api/src/modules/audience/` |
| Passport | `apps/api/src/modules/passport/` |
| Graph edges | `packages/database/src/fan.ts` |

### Tools / commands

```powershell
rg "FanModule|AudienceModule|PassportModule" apps/api/src/app.module.ts
pnpm --filter @tsc/database build
```

---

## 14. Workspace Agent

| Field | Value |
|-------|-------|
| **Layer** | Domain |
| **Purpose** | Projects, tasks, calendar, files, goals |
| **Output** | `.agents/reports/workspace-status.md` |
| **Template** | [reports/templates/workspace-status.md](reports/templates/workspace-status.md) |
| **Frequency** | Weekly |

### Task checklist

- [ ] Verify workspace packages build: `@tsc/workspace`, `@tsc/projects`, `@tsc/tasks`
- [ ] Audit API modules: `workspace`, `project`, `task`
- [ ] Check Prisma models for workspace entities in schema
- [ ] Test workspace CRUD API paths when API running
- [ ] Verify contracts in `packages/contracts/` for workspace domain
- [ ] Cross-product: workspace features in Community vs CoreKnot operator views

### Checks / verifications

| Package / module | Path |
|------------------|------|
| `@tsc/workspace` | `packages/workspace/` |
| `@tsc/projects` | `packages/projects/` |
| `@tsc/tasks` | `packages/tasks/` |
| API workspace | `apps/api/src/modules/workspace/` |

### Tools / commands

```powershell
pnpm --filter @tsc/workspace build
pnpm --filter @tsc/projects build
pnpm --filter @tsc/tasks build
rg "WorkspaceModule|ProjectModule|TaskModule" apps/api/src/app.module.ts
```

---

## Domain → API module map

| Domain agent | Primary API modules |
|--------------|---------------------|
| Community | `feed`, `post`, `community`, `profile`, `event`, `notification`, `search`, `discovery`, `directory` |
| CoreKnot | `finance`, `contract`, `creative-identity`, `analytics`, `project` |
| Marketplace | `opportunity`, `deal`, `payment`, `commerce`, `booking` |
| Audience | `fan`, `audience`, `audience-os`, `passport`, `identity` |
| Workspace | `workspace`, `project`, `task`, `sync` |

Domain agents escalate BROKEN API modules to Backend Agent; frontend gaps to Frontend Agent.
