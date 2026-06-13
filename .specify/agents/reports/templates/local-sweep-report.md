# Local Environment Sweep Report

**Generated:** {{DATE}}  
**Sweep type:** Local  
**Runbook:** [local-environment-sweep.md](../sweeps/local-environment-sweep.md)

---

## Summary

| Category | Pass | Fail | Missing |
|----------|------|------|---------|
| Infrastructure | | | |
| Applications | | | |
| Shared packages | | | |
| CI/CD | | | |

---

## Infrastructure

| Service | Configured | Running | Status |
|---------|------------|---------|--------|
| Postgres | | | Configured / Running / Missing / Broken |
| Redis | | | |
| Typesense | | | |
| Storage (R2) | | | |
| Auth (Clerk/stub) | | | |

---

## Applications

| App | Build | Runtime | Deployment |
|-----|-------|---------|------------|
| tsc-api (`@tsc/api`) | Pass/Fail | Pass/Fail | N/A local |
| tsc-web (`apps/website/`) | | | MISSING |
| tsc-community (`@tsc/community`) | | | |
| tsc-coreknot (`@tsc/coreknot-client`) | | | |

---

## Shared Packages

| Package | Build | Notes |
|---------|-------|-------|
| `@tsc/types` | | |
| `@tsc/contracts` | | |
| `@tsc/permissions` | | |
| `@tsc/constants` | | |
| `@tsc/database` | | |
| Other domain packages | | |

---

## CI/CD (local verification)

| Check | Status |
|-------|--------|
| `.github/workflows/ci.yml` exists | |
| Branch protection documented | |
| Secrets documented in env-vars.md | |
| Deploy hooks in org-scaffold | |

---

## Master status

```
WORKING
========


PARTIAL
========


BROKEN
========


MISSING
========


NEXT PRIORITY
========


```
