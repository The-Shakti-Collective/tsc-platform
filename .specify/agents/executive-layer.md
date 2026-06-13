# Executive Layer Agents

[← Hierarchy](multi-agent-hierarchy.md)

System-wide governance, roadmap alignment, and security posture.

---

## 1. CTO Agent

| Field | Value |
|-------|-------|
| **Layer** | Executive |
| **Purpose** | System-wide governance — architecture violations, duplicate systems, repo sprawl, tech debt, package ownership |
| **Output** | `.agents/reports/platform-health-report.md` |
| **Template** | [reports/templates/platform-health-report.md](reports/templates/platform-health-report.md) |
| **Frequency** | Daily |

### Task checklist

- [ ] Run `pnpm build` and record pass/fail per workspace package
- [ ] Compare workspace count vs `.specify/MASTER.md` (expect 16: 3 apps + 13 packages)
- [ ] Audit duplicate domain logic across `apps/api/src/modules/` and `packages/`
- [ ] Check org-scaffold drift vs live monorepo (`org-scaffold/` vs `apps/`, `packages/`)
- [ ] Review open items in `.specify/decisions/known-gaps.md`
- [ ] Scan for parallel infra targets (Render docs vs Railway/Vercel reality)
- [ ] Verify package ownership: each `@tsc/*` has clear consumers in dependency graph
- [ ] Aggregate BROKEN/PARTIAL from all layer reports into master status

### Checks / verifications

| Check | Command / path | Pass criteria |
|-------|----------------|---------------|
| Monorepo build | `pnpm build` | Exit 0; all key apps build |
| Workspace inventory | `pnpm -r list --depth -1` | Matches documented 16 packages |
| Turbo graph | `turbo.json` | No orphaned tasks |
| Doc conflicts | `.specify/decisions/known-gaps.md` | No unresolved High severity |
| Migration gate | `.agents/production-setup-runbook.md` §2 | Build green before multi-repo split |
| Duplicate API risk | Process list on :4000 | Single listener |

### Tools / commands

```powershell
pnpm build
pnpm -r list --depth -1
pnpm --filter @tsc/api typecheck
Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue
```

---

## 2. Product Architect Agent

| Field | Value |
|-------|-------|
| **Layer** | Executive |
| **Purpose** | Feature completeness, roadmap alignment, entity consistency, cross-product dependencies |
| **Output** | `.agents/reports/roadmap-status.md` |
| **Template** | [reports/templates/roadmap-status.md](reports/templates/roadmap-status.md) |
| **Frequency** | Weekly |

### Task checklist

- [ ] Map API modules in `apps/api/src/app.module.ts` to domain agents (Community, CoreKnot, Marketplace, Audience, Workspace)
- [ ] Verify entity consistency across `packages/database/prisma/schema.prisma`, `packages/types/`, `packages/contracts/`
- [ ] Check cross-product flows: Community → API → CoreKnot operator paths
- [ ] Identify stub/placeholder routes in `apps/community/app/` and `apps/coreknot/client/src/`
- [ ] Review intelligence module completeness (`intelligence`, `agents`, `audience-os`, `analytics`)
- [ ] Track website extraction status (`apps/website/` stub vs `org-scaffold/tsc-web/`)
- [ ] Document cross-product dependency blockers for domain agents

### Checks / verifications

| Check | Path | Pass criteria |
|-------|------|---------------|
| Module registration | `apps/api/src/app.module.ts` | All domain clusters present |
| Prisma models | `packages/database/prisma/schema.prisma` | ~95 models documented |
| Contract coverage | `packages/contracts/src/` | Zod schemas for public API surfaces |
| Placeholder pages | `apps/community/` grep `PlaceholderPage` | Count and list routes |
| Multi-repo map | `org-scaffold/README.md` | Each product maps to scaffold |

### Tools / commands

```powershell
pnpm db:validate
rg "PlaceholderPage|stub|mock" apps/community apps/coreknot --glob "*.{ts,tsx,js,jsx}" -l
rg "imports:.*Module" apps/api/src/app.module.ts
```

---

## 3. Security Agent

| Field | Value |
|-------|-------|
| **Layer** | Executive |
| **Purpose** | JWT, Clerk, API security, RBAC, secrets, rate limiting, dependency vulnerabilities |
| **Output** | `.agents/reports/security-report.md` |
| **Template** | [reports/templates/security-report.md](reports/templates/security-report.md) |
| **Frequency** | Daily |

### Task checklist

- [ ] Verify Clerk env vars not `REPLACE_ME` in `.env` and app `.env.local` files
- [ ] Check auth mode: `TSC_AUTH_STUB` / `NEXT_PUBLIC_AUTH_STUB` vs production Clerk
- [ ] Audit `StubAuthGuard` usage in `apps/api/src/` — must not ship to prod
- [ ] Review RBAC in `packages/permissions/` and API guards
- [ ] Scan for secrets in git: `.env`, keys, tokens in source
- [ ] Run dependency audit: `pnpm audit` (and Snyk if configured)
- [ ] Verify CORS config: `CORS_ORIGIN` in API matches frontend origins
- [ ] Check rate limiting middleware (if present) on public API routes
- [ ] Review webhook secrets: `CLERK_WEBHOOK_SECRET`, storage webhooks

### Checks / verifications

| Check | Command / path | Pass criteria |
|-------|----------------|---------------|
| Placeholder keys | `.env`, `apps/community/.env.local` | No `REPLACE_ME` in prod paths |
| npm audit | `pnpm audit --audit-level=high` | No high/critical unmitigated |
| Auth guard | `apps/api/src/` grep `StubAuthGuard` | Documented dev-only |
| Permissions pkg | `packages/permissions/` | Builds; exported roles documented |
| Env template | `.env.example` | No real secrets; all keys listed |
| Git secrets | `rg "sk_live|sk_test_[^c]|password=" apps packages --glob "!node_modules"` | No committed secrets |

### Tools / commands

```powershell
pnpm audit
pnpm audit --audit-level=high
# Optional: snyk test (requires snyk CLI + auth)
snyk test --all-projects
rg "StubAuthGuard|REPLACE_ME|CLERK_" apps packages .env.example
```

---

## Escalation

| From | To | When |
|------|-----|------|
| Security Agent | Backend Agent | API auth implementation gaps |
| Security Agent | Infrastructure Agent | TLS, DNS, secrets in Railway/Vercel |
| Product Architect | Domain agents | Missing feature surfaces per product |
| CTO Agent | All layers | Architecture violations, duplicate systems |
