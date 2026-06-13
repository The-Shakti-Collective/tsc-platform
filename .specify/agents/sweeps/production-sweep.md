# Production Sweep

[← Hierarchy](../multi-agent-hierarchy.md)

Runbook for aggregating production health across all platform layers. Invoked daily by Monitoring Agent and post-deploy by DevOps Agent.

---

## Prerequisites

Set environment variables (or `.env.prod.local` — never commit):

```powershell
$env:TSC_API_URL = "https://api.theshakticollective.in"
$env:TSC_COMMUNITY_URL = "https://community.theshakticollective.in"
$env:TSC_COREKNOT_URL = "https://coreknot.theshakticollective.in"
$env:TSC_WEBSITE_URL = "https://theshakticollective.in"
```

External dashboard access (optional):

- PostHog: MCP or us.posthog.com
- Sentry: project dashboard
- BetterStack: uptime monitors
- Railway / Vercel: deploy dashboards

---

## Report structure

Production sweep produces `.agents/reports/production-sweep-report.md` with sections:

1. **Executive Summary** — CTO Agent
2. **Infrastructure Health** — Infrastructure Agent
3. **Product Health** — Product Architect Agent
4. **Identity Health** — Security + Backend Agents
5. **Graph Health** — Graph Agent
6. **Participation Health** — Community Agent
7. **Economy Health** — Marketplace Agent
8. **Audience Health** — Audience Agent
9. **Intelligence Health** — Intelligence Agent
10. **Security Health** — Security Agent
11. **Master status** — WORKING / PARTIAL / BROKEN / MISSING / NEXT PRIORITY

Template: [reports/templates/production-sweep-report.md](../reports/templates/production-sweep-report.md)

---

## Step 1 — Infrastructure probes

**Agent:** Infrastructure Agent

```powershell
curl.exe -fsS "$env:TSC_API_URL/api/feed/health"
curl.exe -fsS "$env:TSC_COMMUNITY_URL/api/health"
curl.exe -fsS "$env:TSC_COREKNOT_URL/health.json"
```

| Service | Check | Source |
|---------|-------|--------|
| Railway API | HTTP 200, latency | curl + Railway metrics |
| Vercel Community | HTTP 200 | curl |
| Vercel CoreKnot | HTTP 200 | curl |
| Neon Postgres | API readiness `/api/health/ready` if implemented | Backend Agent |
| Upstash Redis | Readiness check | Backend Agent |
| Typesense | Search query smoke | Community Agent |
| Cloudflare R2 | Upload path smoke | Backend Agent |
| SSL/TLS | Certificate valid | curl -v or external monitor |

---

## Step 2 — Product surfaces

**Agent:** Product Architect Agent

Verify key public routes return non-5xx:

```powershell
curl.exe -s -o NUL -w "%{http_code}" "$env:TSC_COMMUNITY_URL/feed"
curl.exe -s -o NUL -w "%{http_code}" "$env:TSC_COREKNOT_URL/"
```

Cross-reference domain agent reports in `.agents/reports/`.

---

## Step 3 — Identity

**Agents:** Security Agent, Backend Agent

| Check | Method |
|-------|--------|
| Clerk prod app active | Dashboard |
| Stub auth off in prod env | Railway/Vercel env vars |
| JWT on API | Test authenticated request |
| RBAC | Permissions package + API guards |

```powershell
pnpm audit --audit-level=high
```

---

## Step 4 — Graph

**Agent:** Graph Agent

Run integrity queries against production DB (read-only connection via Neon):

- Orphaned relationships
- Count by `MEMBER_OF`, `ATTENDED`, `COLLABORATED_WITH`, `FOLLOWS`
- Growth since last sweep

Relationship types: `packages/database/src/relationship.ts`

---

## Step 5 — Domain sections

| Section | Agent | Key signals |
|---------|-------|-------------|
| Participation | Community | Feed, events, search availability |
| Economy | Marketplace | Opportunities, deals, payments |
| Audience | Audience | Fan profiles, memberships |
| Intelligence | Intelligence | Job success, snapshot freshness |

Each agent updates its domain report; Production sweep aggregates summaries.

---

## Step 6 — Security

**Agent:** Security Agent

- `pnpm audit` on release branch
- Snyk scan if configured
- Review Sentry error spikes
- Verify CORS origins match production subdomains

---

## Step 7 — Monitoring aggregation

**Agent:** Monitoring Agent

- PostHog: error trends, pageviews, custom events
- Sentry: unresolved issues count
- BetterStack: uptime % last 24h

---

## Output & escalation

1. Write `.agents/reports/production-sweep-report.md`
2. CTO Agent reviews NEXT PRIORITY block
3. BROKEN items → create tasks / escalate to Platform layer
4. MISSING items → Product Architect for roadmap

---

## Automation

```powershell
pnpm sweep:prod
# Runs scripts/sweep-prod.ps1 (HTTP probes + report scaffold)
```

For full domain depth, run individual agent sweeps in parallel via Cursor agent prompts referencing layer definition files.

---

## Frequency

| Trigger | Responsible agent |
|---------|-------------------|
| Daily 09:00 UTC | Monitoring Agent |
| Post-deploy | DevOps Agent |
| Weekly executive | CTO Agent (aggregates production sweep) |
