# Cloudflare DNS — theshakticollective.in

Proxy status: API origins **DNS only** (Railway). Frontends **Proxied** (CDN + WAF).

| Type | Name | Target | Proxy | Service |
|------|------|--------|-------|---------|
| CNAME | `api` | `<railway-prod>.up.railway.app` | DNS only | tsc-api prod |
| CNAME | `api-staging` | `<railway-staging>.up.railway.app` | DNS only | tsc-api staging |
| CNAME | `community` | `cname.vercel-dns.com` | Proxied | tsc-community prod |
| CNAME | `community-staging` | Vercel staging CNAME | Proxied | tsc-community staging |
| CNAME | `coreknot` | `cname.vercel-dns.com` | Proxied | tsc-coreknot prod |
| CNAME | `coreknot-staging` | Vercel staging CNAME | Proxied | tsc-coreknot staging |
| CNAME | `docs` | `cname.vercel-dns.com` | Proxied | tsc-docs |
| CNAME | `www` | `cname.vercel-dns.com` | Proxied | tsc-web |
| CNAME | `assets` | R2 public bucket custom domain | Proxied | R2 CDN (optional) |
| A/CNAME | `@` | Vercel apex | Proxied | tsc-web |

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
