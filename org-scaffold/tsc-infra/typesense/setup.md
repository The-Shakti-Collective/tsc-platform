# Typesense Cloud — Search Setup

## Provision

1. [cloud.typesense.org](https://cloud.typesense.org/) → Create cluster
2. Create **staging** and **production** clusters (or namespaces)
3. Generate **admin API key** (store in Railway secrets only)

## Railway env vars (tsc-api)

| Variable | Staging example | Prod |
|----------|-----------------|------|
| `TYPESENSE_HOST` | `xxx.a1.typesense.net` | prod host |
| `TYPESENSE_API_KEY` | admin key | admin key |
| `TYPESENSE_PROTOCOL` | `https` | `https` |
| `TYPESENSE_PORT` | `443` | `443` |

## Post-deploy

Run initial index sync from tsc-api worker on first deploy and after schema changes.

Collections: artists, events, posts (per `@tsc/search` package)

## Local dev

Option A: Typesense Docker on `:8108`  
Option B: Shared dev cluster with read-only search key

```
TYPESENSE_HOST=localhost
TYPESENSE_PORT=8108
TYPESENSE_PROTOCOL=http
TYPESENSE_API_KEY=xyz
```

## CI

Org secrets: `TYPESENSE_HOST`, `TYPESENSE_API_KEY`

Docs: [Typesense Cloud](https://typesense.org/docs/cloud/)
