# Production Readiness Audit — Index

> **Final audit:** 2026-06-15 (Agents 15–25)  
> **Verdict:** [NOT READY FOR PRODUCTION](./MASTER-PRODUCTION-READINESS-REPORT.md)

This directory contains the **final pre-production audit wave** — deeper validation beyond [docs/architecture/](../architecture/README.md).

---

## Start here

| Document | Purpose |
|----------|---------|
| **[MASTER-PRODUCTION-READINESS-REPORT.md](./MASTER-PRODUCTION-READINESS-REPORT.md)** | Final verdict, 15-point checklist, prioritized blockers |

---

## Sub-audit reports

| Agent | Report | Verdict |
|-------|--------|---------|
| 15 | [DATABASE-RELATIONSHIP-AUDIT.md](./DATABASE-RELATIONSHIP-AUDIT.md) | FAIL |
| 16 | [DATA-OWNERSHIP-CERTIFICATE.md](./DATA-OWNERSHIP-CERTIFICATE.md) | FAIL |
| 17 | [WORKFLOW-INTEGRITY-REPORT.md](./WORKFLOW-INTEGRITY-REPORT.md) | FAIL |
| 18 | [API-CONTRACT-CERTIFICATE.md](./API-CONTRACT-CERTIFICATE.md) | FAIL |
| 19 | [SECURITY-CERTIFICATE.md](./SECURITY-CERTIFICATE.md) | FAIL |
| 20 | [SCALABILITY-REPORT.md](./SCALABILITY-REPORT.md) | WARN |
| 21 | [COREKNOT-DOMAIN-CERTIFICATE.md](./COREKNOT-DOMAIN-CERTIFICATE.md) | FAIL |
| 22 | [COMMUNITY-DOMAIN-CERTIFICATE.md](./COMMUNITY-DOMAIN-CERTIFICATE.md) | FAIL |
| 23 | [DEPLOYMENT-CERTIFICATE.md](./DEPLOYMENT-CERTIFICATE.md) | FAIL |
| 24 | [DISASTER-RECOVERY-CERTIFICATE.md](./DISASTER-RECOVERY-CERTIFICATE.md) | FAIL |

---

## Related

| Doc | Location |
|-----|----------|
| Master architecture | [../architecture/MASTER-PRODUCTION-ARCHITECTURE.md](../architecture/MASTER-PRODUCTION-ARCHITECTURE.md) |
| Tech debt backlog | [../architecture/TECH-DEBT-ROADMAP.md](../architecture/TECH-DEBT-ROADMAP.md) |
| Founder checklist | [../../.specify/agents/execution/FOUNDER-TASKS.md](../../.specify/agents/execution/FOUNDER-TASKS.md) |
| Mongo sunset | [../architecture/MONGO-SUNSET-REPORT.md](../architecture/MONGO-SUNSET-REPORT.md) |
| Operations runbook | [../RUNBOOK.md](../RUNBOOK.md) |

---

## Re-audit trigger

Re-run Agents 15–25 when:

- CoreKnot `COREKNOT_MONGO_REQUIRED=false` verified in staging
- Founder FOUNDER-TASKS complete
- Clerk webhooks live
- Production deploy smoke tests pass (`pnpm sweep:prod`)
