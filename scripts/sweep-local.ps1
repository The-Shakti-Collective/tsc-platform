#Requires -Version 5.1
<#
.SYNOPSIS
  TSC Platform local environment sweep — probes infra, apps, packages, CI.
.DESCRIPTION
  Writes scaffold report to .agents/reports/local-sweep-report.md
  Runbook: .specify/agents/sweeps/local-environment-sweep.md
#>
param(
    [switch]$SkipBuild
)

$ErrorActionPreference = "Continue"
$Root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$Root/package.json")) {
    Write-Error "Cannot find repo root from $PSScriptRoot"
    exit 1
}
Set-Location $Root

$ReportDir = Join-Path $Root ".agents/reports"
$Template = Join-Path $Root ".specify/agents/reports/templates/local-sweep-report.md"
$Report = Join-Path $ReportDir "local-sweep-report.md"
$Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$working = [System.Collections.Generic.List[string]]::new()
$partial = [System.Collections.Generic.List[string]]::new()
$broken = [System.Collections.Generic.List[string]]::new()
$missing = [System.Collections.Generic.List[string]]::new()

function Test-HttpStatus {
    param([string]$Url, [int]$TimeoutSec = 5)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec $TimeoutSec -ErrorAction Stop
        return @{ Ok = $true; Code = [int]$r.StatusCode }
    } catch {
        $code = 0
        if ($_.Exception.Response) { $code = [int]$_.Exception.Response.StatusCode }
        return @{ Ok = $false; Code = $code; Error = $_.Exception.Message }
    }
}

Write-Host "=== TSC Local Environment Sweep ===" -ForegroundColor Cyan
Write-Host "Root: $Root"

# --- Infrastructure ---
Write-Host "`n[1/6] Infrastructure..." -ForegroundColor Yellow

if (Test-Path "$Root/.env") { $working.Add(".env file present") } else { $broken.Add(".env file missing - run pnpm setup") }

$dbUrl = $env:DATABASE_URL
if (-not $dbUrl -and (Test-Path "$Root/.env")) {
    $dbUrl = (Select-String -Path "$Root/.env" -Pattern "^DATABASE_URL=(.+)$" | ForEach-Object { $_.Matches.Groups[1].Value })
}
if ($dbUrl) { $working.Add("Postgres: Configured (DATABASE_URL)") } else { $missing.Add("Postgres: DATABASE_URL not set") }

$redisUrl = $env:REDIS_URL
if (-not $redisUrl -and (Test-Path "$Root/.env")) {
    $redisUrl = (Select-String -Path "$Root/.env" -Pattern "^REDIS_URL=(.*)$" | ForEach-Object { $_.Matches.Groups[1].Value })
}
if ([string]::IsNullOrWhiteSpace($redisUrl)) {
    $partial.Add("Redis: stub queue mode (empty REDIS_URL)")
} elseif ($redisUrl) {
    $working.Add("Redis: Configured")
}

$dockerOk = $false
try {
    $ps = docker compose ps --format json 2>$null | ConvertFrom-Json
    if ($ps) { $dockerOk = $true; $working.Add("Docker compose: running") }
} catch { }
if (-not $dockerOk) { $partial.Add("Docker: not running or unavailable") }

# Typesense, R2, Clerk from .env
foreach ($pair in @(
    @{ Name = "Typesense"; Pattern = "^TYPESENSE_" },
    @{ Name = "Storage (R2)"; Pattern = "^R2_" },
    @{ Name = "Clerk"; Pattern = "^CLERK_|^NEXT_PUBLIC_CLERK_" }
)) {
    if (Test-Path "$Root/.env") {
        $hit = Select-String -Path "$Root/.env" -Pattern $pair.Pattern -Quiet
        if ($hit) { $working.Add("$($pair.Name): env vars present") } else { $missing.Add("$($pair.Name): not configured in .env") }
    }
}

# --- Database validate ---
Write-Host "`n[2/6] Database..." -ForegroundColor Yellow
try {
    pnpm db:validate 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { $working.Add("Prisma schema: valid") } else { $broken.Add("Prisma schema: validation failed") }
} catch { $broken.Add("Prisma schema: validate command failed") }

# --- Build ---
if (-not $SkipBuild) {
    Write-Host "`n[3/6] Builds..." -ForegroundColor Yellow
    foreach ($filter in @("@tsc/api", "@tsc/community", "@tsc/coreknot-client", "@tsc/database", "@tsc/contracts")) {
        pnpm --filter $filter build 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) { $working.Add("Build ${filter}: PASS") } else { $broken.Add("Build ${filter}: FAIL") }
    }
} else {
    $partial.Add("Builds: skipped (-SkipBuild)")
}

# --- Runtime HTTP ---
Write-Host "`n[4/6] Runtime probes..." -ForegroundColor Yellow
$probes = @(
    @{ Name = "API /api/feed/health"; Url = "http://127.0.0.1:4000/api/feed/health" },
    @{ Name = "Community"; Url = "http://127.0.0.1:3000/" },
    @{ Name = "CoreKnot /health.json"; Url = "http://127.0.0.1:3001/health.json" }
)
foreach ($p in $probes) {
    $res = Test-HttpStatus -Url $p.Url
    if ($res.Ok -and $res.Code -ge 200 -and $res.Code -lt 400) {
        $working.Add("$($p.Name): HTTP $($res.Code)")
    } elseif ($res.Code -eq 0) {
        $partial.Add("$($p.Name): not listening (start pnpm start:community or start:coreknot)")
    } else {
        $broken.Add("$($p.Name): HTTP $($res.Code)")
    }
}

# --- Shared packages CI file check ---
Write-Host "`n[5/6] CI/CD files..." -ForegroundColor Yellow
$ciFiles = @("ci.yml", "ci-api.yml", "ci-community.yml", "ci-coreknot-client.yml", "ci-packages.yml")
foreach ($f in $ciFiles) {
    if (Test-Path "$Root/.github/workflows/$f") { $working.Add("CI workflow: $f") }
    else { $missing.Add("CI workflow: $f") }
}

# --- Website stub ---
Write-Host "`n[6/6] Website..." -ForegroundColor Yellow
$missing.Add("tsc-web: not in monorepo (apps/website stub, target org-scaffold/tsc-web)")

# --- Write report ---
$body = @"
# Local Environment Sweep Report

**Generated:** $Date  
**Sweep type:** Local (automated)  
**Runbook:** [.specify/agents/sweeps/local-environment-sweep.md](.specify/agents/sweeps/local-environment-sweep.md)

---

## Summary

| Category | Working | Broken | Missing |
|----------|---------|--------|---------|
| Infrastructure | $(($working | Where-Object { $_ -match 'Postgres|Redis|Docker|Typesense|R2|Clerk|\.env' }).Count) | - | - |
| Applications | - | - | - |
| CI/CD | $(($working | Where-Object { $_ -match 'CI workflow' }).Count) | - | - |

---

## Master status

WORKING
========
$($working -join "`n")

PARTIAL
========
$($partial -join "`n")

BROKEN
========
$($broken -join "`n")

MISSING
========
$($missing -join "`n")

NEXT PRIORITY
========
1. Fix BROKEN items above (API boot, failed builds)
2. Start dev stack if runtime probes failed: pnpm start:community
3. Configure MISSING infra (Clerk keys, Typesense) per .specify/infrastructure/env-vars.md

"@

# UTF8 without BOM (PS 5.1 lacks utf8NoBOM enum)
$utf8NoBom = New-Object System.Text.UTF8Encoding $false
[System.IO.File]::WriteAllText($Report, $body, $utf8NoBom)
Write-Host "`nReport written: $Report" -ForegroundColor Green
Write-Host "WORKING: $($working.Count) | PARTIAL: $($partial.Count) | BROKEN: $($broken.Count) | MISSING: $($missing.Count)"
