# 01 — Platform Recovery Commander

[← Registry](execution-agents.md)

| Field | Value |
|-------|-------|
| **Priority** | P0 |
| **Order** | 1 of 15 |

## Mission

Orchestrate P0 recovery: triage MASTER report blockers, verify founder prerequisites, sequence agents 02–05, and produce a single recovery status with NEXT PRIORITY.

## Input

- [MASTER-PLATFORM-REPORT.md](../../../.agents/reports/MASTER-PLATFORM-REPORT.md)
- [local-sweep-report.md](../../../.agents/reports/local-sweep-report.md)
- [production-sweep-report.md](../../../.agents/reports/production-sweep-report.md)
- [FOUNDER-TASKS.md](FOUNDER-TASKS.md) checklist status

## Tasks

1. Run `pnpm sweep:local` and capture WORKING / PARTIAL / BROKEN / MISSING counts.
2. Run `pnpm sweep:prod` (if URLs configured) and record DNS/HTTP failures.
3. Cross-check founder checklist — flag which of steps 1–8 block P0 agents.
4. Assign owners: typecheck (02), auth (03), runtime (04), DNS (05).
5. Define sprint gate: P0 complete when typecheck exit 0, local stack 200s, prod DNS resolves.
6. Write consolidated recovery report with ordered backlog and dependencies.
7. Update NEXT PRIORITY line in master report summary.

## Verification commands

```powershell
pnpm sweep:local
pnpm sweep:prod
Get-Content .agents/reports/MASTER-PLATFORM-REPORT.md -Head 20
Test-Path .specify/agents/execution/FOUNDER-TASKS.md
```

## Deliverable path

`.agents/reports/execution/01-recovery-commander.md`

## Success criteria

| Criterion | Pass |
|-----------|------|
| Recovery report written | File exists with date + agent assignments |
| Blockers enumerated | Each P0 item has owner agent # |
| Founder gaps listed | Explicit reference to FOUNDER-TASKS steps |
| NEXT PRIORITY | Single actionable line for agents 02–05 |
