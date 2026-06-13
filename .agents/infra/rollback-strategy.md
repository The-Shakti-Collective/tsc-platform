# Rollback Strategy

Production-only procedures. Always roll back **staging first** to validate the process.

---

## Principles

1. **Never force-push** `main` or `develop`
2. **Database migrations** are forward-only — rollback app code, not schema (unless migration is reversible)
3. **Prefer platform rollback** (Railway/Vercel redeploy previous build) over git revert for hotfixes
4. **Document incident** in ops channel before prod rollback

---

## tsc-api (Railway)

### Fast rollback (< 5 min)

1. Railway dashboard → **tsc-api-prod** → **Deployments**
2. Select last green deployment → **Redeploy**
3. Verify: `curl -fsS https://api.theshakticollective.in/health/ready`

### CLI rollback

```powershell
.\org-scaffold\tsc-infra\scripts\rollback-railway.ps1 -Environment production
```

Requires: `RAILWAY_TOKEN`, `RAILWAY_SERVICE_ID_PROD` (or staging ID)

### Git-based rollback (release revert)

```bash
git checkout main
git revert <bad-commit-sha>   # or revert merge commit
git push origin main          # triggers new deploy
```

### Database caution

If bad deploy included **Prisma migrate deploy**:

- Do **not** auto-rollback DB
- Assess migration: if additive-only, keep schema + rollback app
- If destructive: restore Neon branch snapshot before redeploying old app

Neon: **Branches → prod → Restore** from point-in-time backup.

---

## Frontends (Vercel)

### Instant rollback

1. Vercel dashboard → Project → **Deployments**
2. Previous production deployment → **⋯ → Promote to Production**
3. Verify `/api/health` (community) or `/` (web)

### CLI

```powershell
.\org-scaffold\tsc-infra\scripts\deploy-vercel.ps1 -Project community -Rollback
```

Uses `vercel rollback` against linked project.

### Preview / staging

Promote previous **Preview** deployment on `develop` branch or redeploy prior commit via GitHub.

---

## tsc-shared (@tsc/* packages)

Broken package publish:

1. **Do not** yank without coordination — pin consumers to last good semver
2. Publish patch from fixed `main`
3. Trigger redeploy of tsc-api + frontends that depend on package

---

## Cloudflare DNS

DNS rollback = revert record to previous target in Cloudflare audit log.

**TTL:** Lower to 300s before cutover; restore to 3600s after stable 24h.

---

## Typesense / R2 / Clerk

| Service | Rollback |
|---------|----------|
| **Typesense** | Re-run index sync from API after app rollback; collections are forward-compatible |
| **R2** | Objects persist — rollback app only; no bucket revert |
| **Clerk** | Roll back JWT template / webhook URL in dashboard if misconfigured |

---

## Rollback decision matrix

| Symptom | Action |
|---------|--------|
| 5xx spike, health/ready failing | Railway redeploy previous |
| Frontend JS error (Sentry) | Vercel promote previous |
| Bad migration applied | Neon restore + app rollback |
| Clerk auth broken | Fix Clerk dashboard config (keys rarely rolled back) |
| Search stale/wrong | Trigger Typesense reindex worker |

---

## Post-rollback

- [ ] Health checks green (run `health-check.ps1`)
- [ ] Sentry error rate normalized
- [ ] Create hotfix branch from rolled-back commit
- [ ] Post-mortem within 48h
