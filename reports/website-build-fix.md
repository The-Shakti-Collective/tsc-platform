# Website Build Fix

**Sprint:** R1-RUNTIME-UNBLOCK  
**Date:** 2026-06-14  
**Agent:** Website

## Issue checked

Missing `@clerk/nextjs` blocking `pnpm --filter @tsc/website build`.

## Finding

`@clerk/nextjs` **already present** in `apps/website/package.json`:

```json
"@clerk/nextjs": "^6.39.5"
```

No install required for this sprint item.

## Website build scope

Website is **not** in Railway API deploy path. Root build uses:

```
turbo run build --filter=@tsc/api...
```

Website excluded intentionally — API runtime fix only.

## Verify locally

```powershell
pnpm --filter @tsc/website build
```

Requires env placeholders (see `.github/workflows/build.yml`):

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `NEXT_PUBLIC_AUTH_STUB=true` (optional dev)

## CI

Existing `.github/workflows/ci-website.yml` handles website pipeline separately.

## Status

No website dependency fix needed for Railway API unblock. Clerk dep present.
