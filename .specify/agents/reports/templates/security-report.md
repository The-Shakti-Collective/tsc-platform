# Security Report

**Agent:** Security Agent  
**Layer:** Executive  
**Generated:** {{DATE}}

---

## Executive summary

---

## Authentication (Clerk / JWT)

| Check | Status | Detail |
|-------|--------|--------|
| Clerk keys configured | | `CLERK_SECRET_KEY`, publishable keys |
| Stub auth disabled (prod) | | `TSC_AUTH_STUB`, `NEXT_PUBLIC_AUTH_STUB` |
| JWT verification on API | | Planned vs `StubAuthGuard` |
| Webhook secret | | `CLERK_WEBHOOK_SECRET` |

---

## RBAC & permissions

| Role / permission | Package | API guard | Status |
|-------------------|---------|-----------|--------|
| | `packages/permissions/` | | |

---

## API security

| Control | Status | Notes |
|---------|--------|-------|
| CORS | | `CORS_ORIGIN` |
| Rate limiting | | |
| Input validation | | Zod via `@tsc/contracts` |
| Public API surface | | `public-api` module |

---

## Secrets management

| Secret | Location | Committed? | Rotated? |
|--------|----------|------------|----------|
| `.env` | gitignored | No | |
| GitHub Actions secrets | org/repo | | |
| Railway / Vercel env | dashboards | | |

---

## Dependency vulnerabilities

### npm audit

```
<!-- Paste pnpm audit summary -->
```

### Snyk (optional)

```
<!-- Paste snyk test summary if run -->
```

| Severity | Count | Top packages |
|----------|-------|--------------|
| Critical | | |
| High | | |
| Moderate | | |

---

## Security findings

| ID | Severity | Finding | Remediation |
|----|----------|---------|-------------|
| | | | |

---

<!-- Include _master-status-section.md content below -->
