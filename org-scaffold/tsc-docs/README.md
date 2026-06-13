# tsc-docs

Public API documentation for The Shakti Collective.

## Purpose

- OpenAPI specification (generated from `tsc-api`)
- Developer guides, authentication docs, webhook references
- Hosted at `docs.theshakticollective.in`

## OpenAPI

The canonical spec is **generated in CI from tsc-api**, not hand-edited here long-term.

During migration, copy or symlink:

```
openapi/
  tsc-api.openapi.json    # Generated — see pointer below
  README.md
```

**Source of truth:** `TheShaktiCollective/tsc-api` — export via NestJS Swagger or custom script on `main` merge. This repo pulls the artifact in CI or uses a submodule pointer.

Pointer file: `openapi/SOURCE.md` → links to api repo path and generation command.

## Local development

```bash
pnpm install
pnpm dev
```

## Deploy

Vercel static site or Next.js docs app. Public GitHub repo.

## CI

Lint + build on PR. Deploy to production on `main`.
