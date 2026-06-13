# Rollback Strategy

Canonical copy: `.agents/infra/rollback-strategy.md`

## Quick reference

| Platform | Command |
|----------|---------|
| Railway | `.\scripts\rollback-railway.ps1 -Environment production` |
| Vercel | `.\scripts\deploy-vercel.ps1 -Project community -Rollback` |

Always verify with `health-check.ps1 -Strict` after rollback.
