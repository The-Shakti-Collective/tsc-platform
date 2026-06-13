# Deployment Status Report

**Agent:** DevOps Agent  
**Layer:** Operations  
**Generated:** {{DATE}}

---

## Executive summary

---

## GitHub Actions

| Workflow | Path | Last run | Status |
|----------|------|----------|--------|
| CI (root) | `.github/workflows/ci.yml` | | |
| CI API | `.github/workflows/ci-api.yml` | | |
| CI Community | `.github/workflows/ci-community.yml` | | |
| CI CoreKnot | `.github/workflows/ci-coreknot-client.yml` | | |
| CI Packages | `.github/workflows/ci-packages.yml` | | |
| CI Website | `.github/workflows/ci-website.yml` | | |

---

## Branch protection

| Branch | PR required | Required checks | Status |
|--------|-------------|-----------------|--------|
| main | | lint, build | |
| develop | | | |

---

## Deploy targets

| Service | Platform | URL | Last deploy | Health |
|---------|----------|-----|-------------|--------|
| API | Railway | api.theshakticollective.in | | |
| Community | Vercel | community.theshakticollective.in | | |
| CoreKnot | Vercel | coreknot.theshakticollective.in | | |
| Website | Vercel | theshakticollective.in | | MISSING in monorepo |

---

## Docker local

| Service | Container | Health |
|---------|-----------|--------|
| Postgres | tsc-postgres | |
| Redis | tsc-redis | |

---

## Secrets & hooks

| Secret / hook | Configured | Used by |
|---------------|------------|---------|
| DATABASE_URL | | CI |
| RAILWAY_TOKEN | | Deploy |
| VERCEL_TOKEN | | Deploy |

---

<!-- Include _master-status-section.md content below -->
