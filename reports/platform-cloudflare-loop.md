# Platform Cloudflare DNS/SSL — Fix-Debug-Probe Loop

**Date:** 2026-06-14  
**Workspace:** `c:\Projects\TSC Platform`  
**Agent:** DNS/SSL probe + doc sync (no Cloudflare API token)

---

## Loop summary

| Iteration | Action | Result |
|-----------|--------|--------|
| 1 | Live probe (`curl -I`, `nslookup` @ 1.1.1.1) | 1/4 domains HTTP OK; 2 NXDOMAIN; 1 origin timeout |
| 2 | Railway CLI `railway status` | Service **Failed**; default URL 404; no custom domain bound |
| 3 | Railway CLI `railway domain api...` | **Unauthorized** — founder must `railway login` for exact CNAME |
| 4 | Vercel CLI | **Invalid token** — founder must `vercel login` for project CNAMEs |
| 5 | Repo docs | Updated `SETUP-FOUNDER-RUNBOOK.md`, `org-scaffold/.../dns-records.md` |
| 6 | Wrangler / Workers config | **None in repo** — nothing to fix |

---

## Per-domain status (2026-06-14 ~21:42 UTC)

| Domain | DNS (1.1.1.1) | `curl -I` HTTPS | Classification | Blocker |
|--------|---------------|-----------------|----------------|---------|
| `theshakticollective.in` | ✅ A → Cloudflare (`104.21.71.39`, `172.67.143.21`) | **200 OK** — `Server: cloudflare`, `X-Vercel-Cache: HIT` | **Healthy** | None |
| `api.theshakticollective.in` | ❌ **NXDOMAIN** | `HTTP:000` — Could not resolve host | **Missing DNS** | Cloudflare: add CNAME `api` → Railway; Railway: add custom domain + fix deploy |
| `community.theshakticollective.in` | ❌ **NXDOMAIN** | `HTTP:000` — Could not resolve host | **Missing DNS** | Cloudflare: add CNAME `community` → Vercel; Vercel: attach domain |
| `coreknot.in` | ✅ A → Cloudflare (`104.21.89.206`, `172.67.164.227`) | **Timeout** (TLS OK, 0 bytes in 25s) | **522 / origin down** | Vercel: attach `coreknot.in` + deploy; Cloudflare origin must respond |

**Not observed this run:** HTTP **525** (SSL handshake to origin failed). `coreknot.in` connects through Cloudflare edge then stalls waiting for origin.

---

## Probe commands (repro)

```powershell
foreach ($d in @(
  "theshakticollective.in",
  "api.theshakticollective.in",
  "community.theshakticollective.in",
  "coreknot.in"
)) {
  Write-Host "=== NSLOOKUP $d ==="
  nslookup $d 1.1.1.1
  Write-Host "=== CURL -I https://$d ==="
  curl.exe -sI -m 20 -w "`nHTTP:%{http_code} ERR:%{errormsg}`n" "https://$d"
  Write-Host ""
}
```

### Raw highlights

**theshakticollective.in**

```
HTTP/1.1 200 OK
Server: cloudflare
X-Vercel-Cache: HIT
X-Vercel-Id: fra1::phdjh-...
```

**api / community**

```
*** can't find api.theshakticollective.in: Non-existent domain
HTTP:000 ERR:Could not resolve host
```

**coreknot.in**

```
# HTTP (port 80): 301 → https://coreknot.in/
# HTTPS: TCP+TLS OK, then Operation timed out after 20004 ms
```

**Railway default hostname (no custom domain yet)**

```powershell
curl.exe -sI https://tsc-platform-production.up.railway.app/api/health/live
# HTTP/1.1 404 — {"message":"Application not found"} — service Failed
```

---

## Exact DNS records (founder — Cloudflare dashboard)

### Zone: `theshakticollective.in`

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `api` | `tsc-platform-production.up.railway.app` *(confirm in Railway Networking)* | DNS only |
| CNAME | `community` | Vercel-provided (tsc-community project) | Proxied |
| CNAME | `@` | Vercel apex target (already working for website) | Proxied |
| CNAME | `www` | `cname.vercel-dns.com` or Vercel-provided | Proxied |

**Missing today:** `api`, `community` (confirmed NXDOMAIN on public resolvers).

### Zone: `coreknot.in`

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `@` | Vercel CoreKnot project CNAME | Proxied |
| CNAME | `www` | `cname.vercel-dns.com` or Vercel-provided | Proxied |

**Note:** Zone exists and is proxied, but origin does not respond — likely Vercel domain not validated or no deployment.

### SSL/TLS (both zones)

| Setting | Value |
|---------|-------|
| Encryption mode | **Full (strict)** |
| Always Use HTTPS | On |
| Minimum TLS | 1.2 |
| API subdomain | Grey cloud only — Railway handles cert |

Ref: [Cloudflare SSL modes](https://developers.cloudflare.com/ssl/origin-configuration/ssl-modes/)

---

## Railway CNAME target

From linked CLI (2026-06-14):

| Field | Value |
|-------|-------|
| Project | TSC Platform |
| Service | `tsc-platform` |
| Default URL | `https://tsc-platform-production.up.railway.app` |
| Deploy status | **Failed** |
| Custom domain on service | **Not listed** (only `*.up.railway.app`) |

Founder steps:

1. `railway login` (refresh token)
2. Railway Dashboard → **tsc-platform** → **Settings → Networking** → **Add Custom Domain** → `api.theshakticollective.in`
3. Copy CNAME target into Cloudflare (`api` record, grey cloud)
4. CLI verify: `railway domain api.theshakticollective.in --service tsc-platform --json`
5. Fix failed deploy before health checks pass (see `reports/railway-runtime-fix.md`)

---

## Founder Cloudflare dashboard clicks (no API token)

1. **Websites → theshakticollective.in → DNS → Records → Add record**
   - CNAME `api` → Railway target, **Proxy status: DNS only**
   - CNAME `community` → Vercel target, **Proxied**
2. **Websites → coreknot.in → DNS** — confirm `@` CNAME matches Vercel CoreKnot
3. **SSL/TLS → Overview** — set **Full (strict)** on both zones
4. **SSL/TLS → Edge Certificates** — **Always Use HTTPS** = On
5. **Rules → Redirect Rules** (optional) — `www` → apex on both zones
6. Wait 5–30 min → re-run probe commands above

---

## Repo config audit

| Path | Status |
|------|--------|
| `wrangler.toml` / Workers | **Not present** |
| `org-scaffold/tsc-infra/cloudflare/dns-records.md` | Updated with live probe + `coreknot.in` zone |
| `SETUP-FOUNDER-RUNBOOK.md` Step 6 | Expanded with exact records + symptom table |
| `apps/website/vercel.json` | OK — headers only, no DNS |

---

## Success criteria (next loop)

| Check | Pass when |
|-------|-----------|
| DNS | All four hostnames resolve on 1.1.1.1 |
| `theshakticollective.in` | HTTP 200 (already pass) |
| `community.theshakticollective.in` | HTTP 200, Vercel headers |
| `coreknot.in` | HTTP 200, no timeout |
| `api.theshakticollective.in` | HTTP 200 on `/api/health/live` and `/api/health/ready` |
| SSL | No 525 on proxied frontends |

---

*Canonical founder steps: [SETUP-FOUNDER-RUNBOOK.md](../SETUP-FOUNDER-RUNBOOK.md) Step 6 & 9.*
