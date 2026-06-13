# Cloudflare DNS — TSC Platform

**Live probe:** [reports/platform-cloudflare-loop.md](../../../reports/platform-cloudflare-loop.md) (2026-06-14)

Proxy status: API origins **DNS only** (Railway). Frontends **Proxied** (CDN + WAF).

## Zone: `theshakticollective.in`

NS: `harvey.ns.cloudflare.com`, `joan.ns.cloudflare.com`

| Type | Name | Target | Proxy | Service | Probe 2026-06-14 |
|------|------|--------|-------|---------|------------------|
| CNAME | `api` | `tsc-platform-production.up.railway.app` *(confirm Railway Networking)* | DNS only | tsc-api prod | **MISSING — NXDOMAIN** |
| CNAME | `api-staging` | `<railway-staging>.up.railway.app` | DNS only | tsc-api staging | — |
| CNAME | `community` | Vercel tsc-community CNAME | Proxied | tsc-community prod | **MISSING — NXDOMAIN** |
| CNAME | `community-staging` | Vercel staging CNAME | Proxied | tsc-community staging | — |
| CNAME | `coreknot` | `cname.vercel-dns.com` | Proxied | tsc-coreknot (subdomain) | optional |
| CNAME | `coreknot-staging` | Vercel staging CNAME | Proxied | tsc-coreknot staging | — |
| CNAME | `docs` | `cname.vercel-dns.com` | Proxied | tsc-docs | — |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied | tsc-web | resolves (CF) |
| CNAME | `assets` | R2 public bucket custom domain | Proxied | R2 CDN (optional) | — |
| CNAME | `@` | Vercel apex | Proxied | tsc-web | **200 OK** |

## Zone: `coreknot.in` (separate apex domain)

NS: `jillian.ns.cloudflare.com`, `lars.ns.cloudflare.com`

| Type | Name | Target | Proxy | Service | Probe 2026-06-14 |
|------|------|--------|-------|---------|------------------|
| CNAME | `@` | Vercel tsc-coreknot CNAME | Proxied | CoreKnot prod | **522/timeout — origin down** |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied | redirect → apex | — |

## SSL/TLS

- Mode: **Full (strict)**
- Always Use HTTPS: **On**
- Minimum TLS: **1.2**

## Redirect rules

1. `www.theshakticollective.in/*` → `https://theshakticollective.in/$1` (301)
2. `theshakticollective.com/*` → `https://theshakticollective.in/$1` (301)

## Cutover checklist

- [ ] Lower TTL to 300s 24h before cutover
- [ ] Verify Railway + Vercel custom domains show **Valid**
- [ ] Smoke test all subdomains
- [ ] Restore TTL to 3600s after 24h stable

Docs: [Cloudflare DNS](https://developers.cloudflare.com/dns/)
