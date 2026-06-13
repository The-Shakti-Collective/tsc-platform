# tsc-shared

Private monorepo of `@tsc/*` packages published to **GitHub Packages**.

## Packages

| Path | npm name | Description |
|------|----------|-------------|
| `packages/types` | `@tsc/types` | Shared TypeScript types |
| `packages/contracts` | `@tsc/contracts` | API DTOs, Zod schemas, events |
| `packages/permissions` | `@tsc/permissions` | RBAC definitions |
| `packages/community-sdk` | `@tsc/community-sdk` | Community client SDK |
| `packages/constants` | `@tsc/constants` | Shared constants (stub) |
| `packages/ui` | `@tsc/ui` | Shared UI components (optional publish) |

## Monorepo migration sources

```
packages/types/          → packages/types/
packages/contracts/      → packages/contracts/
packages/permissions/    → packages/permissions/
packages/community-sdk/  → packages/community-sdk/
packages/ui/             → packages/ui/
```

## Install (consumers)

`.npmrc`:

```ini
@tsc:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

```bash
pnpm add @tsc/types @tsc/contracts
```

## Development

```bash
pnpm install
pnpm build
pnpm -r run test
```

## Publishing

Merge to `main` triggers `.github/workflows/publish.yml`.

Manual:

```bash
pnpm -r publish --access restricted --no-git-checks
```

Requires `NPM_TOKEN` or `GITHUB_TOKEN` with `write:packages`.

## Versioning

Use semver. Bump versions in each package's `package.json` before merge to `main`, or adopt Changesets later.
