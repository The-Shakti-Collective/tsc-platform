# Infrastructure Status Report

**Agent:** Infrastructure Agent  
**Layer:** Platform  
**Generated:** {{DATE}}

---

## Executive summary

---

## Service status matrix

| Service | Local | Production | Config | Running | Notes |
|---------|-------|------------|--------|---------|-------|
| PostgreSQL (Neon/Docker) | :5432 | Neon | Configured / Missing | Running / Down | |
| Redis (Upstash/Docker) | :6379 | Upstash | | | Empty URL = stub queues |
| Typesense | — | Managed | | | |
| Cloudflare R2 | — | Prod | | | |
| Clerk Auth | Stub/Clerk | Prod app | | | |
| Railway (API) | — | api.theshakticollective.in | | | |
| Vercel (Community) | :3000 | community.theshakticollective.in | | | |
| Vercel (CoreKnot) | :3001 | coreknot.theshakticollective.in | | | |
| Vercel (Website) | :3002 stub | theshakticollective.in | | | Separate repo target |

---

## Health probe results

| Endpoint | HTTP | Latency | Response |
|----------|------|---------|----------|
| `GET localhost:4000/api/feed/health` | | | |
| `GET localhost:3000/api/health` | | | |
| `GET localhost:3001/health.json` | | | |
| Prod API (if checked) | | | |

---

## Config drift

| Variable | Documented | Actual `.env` | Drift |
|----------|------------|---------------|-------|
| `DATABASE_URL` | `.env.example` | | |
| `REDIS_URL` | | | |
| `CORS_ORIGIN` | | | |

---

## SSL / DNS

| Domain | TLS | DNS target | Status |
|--------|-----|------------|--------|
| api.theshakticollective.in | | Railway | |
| community.theshakticollective.in | | Vercel | |
| coreknot.theshakticollective.in | | Vercel | |

---

<!-- Include _master-status-section.md content below -->
