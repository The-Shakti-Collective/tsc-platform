# Deprecated — use `apps/website`

This directory is **not** a pnpm workspace package. The marketing site lives at [`apps/website`](../website) (`@tsc/website`).

If you see `node_modules` here, it is leftover from an old layout. Safe to delete the whole `apps/web` folder:

```powershell
Remove-Item -Recurse -Force apps/web
```
