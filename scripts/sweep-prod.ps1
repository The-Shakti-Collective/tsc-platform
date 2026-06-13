#Requires -Version 5.1
<#
.SYNOPSIS
  TSC Platform production sweep — HTTP probes + report scaffold.
.DESCRIPTION
  Writes .agents/reports/production-sweep-report.md
  Runbook: .specify/agents/sweeps/production-sweep.md
#>
param(
    [string]$ApiUrl = $env:TSC_API_URL,
    [string]$CommunityUrl = $env:TSC_COMMUNITY_URL,
    [string]$CoreknotUrl = $env:TSC_COREKNOT_URL,
    [string]$WebsiteUrl = $env:TSC_WEBSITE_URL
)

$ErrorActionPreference = "Continue"
$Root = Split-Path $PSScriptRoot -Parent
if (-not (Test-Path "$Root/package.json")) {
    Write-Error "Cannot find repo root from $PSScriptRoot"
    exit 1
}
Set-Location $Root

if (-not $ApiUrl) { $ApiUrl = "https://api.theshakticollective.in" }
if (-not $CommunityUrl) { $CommunityUrl = "https://community.theshakticollective.in" }
if (-not $CoreknotUrl) { $CoreknotUrl = "https://coreknot.theshakticollective.in" }
if (-not $WebsiteUrl) { $WebsiteUrl = "https://theshakticollective.in" }

$ReportDir = Join-Path $Root ".agents/reports"
$Report = Join-Path $ReportDir "production-sweep-report.md"
$Date = Get-Date -Format "yyyy-MM-dd HH:mm:ss UTC"

New-Item -ItemType Directory -Force -Path $ReportDir | Out-Null

$working = [System.Collections.Generic.List[string]]::new()
$partial = [System.Collections.Generic.List[string]]::new()
$broken = [System.Collections.Generic.List[string]]::new()
$missing = [System.Collections.Generic.List[string]]::new()

function Test-ProdUrl {
    param([string]$Label, [string]$Url)
    try {
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15 -ErrorAction Stop
        $sw.Stop()
        $ms = $sw.ElapsedMilliseconds
        if ($r.StatusCode -ge 200 -and $r.StatusCode -lt 400) {
            $working.Add("$Label`: HTTP $($r.StatusCode) (${ms}ms) - $Url")
        } else {
            $partial.Add("$Label`: HTTP $($r.StatusCode) - $Url")
        }
    } catch {
        $broken.Add("$Label`: unreachable - $Url - $($_.Exception.Message)")
    }
}

Write-Host "=== TSC Production Sweep ===" -ForegroundColor Cyan
Write-Host "API: $ApiUrl"
Write-Host "Community: $CommunityUrl"

Test-ProdUrl -Label "Railway API health" -Url "$ApiUrl/api/feed/health"
Test-ProdUrl -Label "Vercel Community health" -Url "$CommunityUrl/api/health"
Test-ProdUrl -Label "Vercel CoreKnot health" -Url "$CoreknotUrl/health.json"
Test-ProdUrl -Label "Website root" -Url $WebsiteUrl
Test-ProdUrl -Label "Community feed" -Url "$CommunityUrl/feed"

# Items requiring manual / agent follow-up
$missing.Add("Graph integrity queries - run Graph Agent against Neon (read-only)")
$missing.Add("PostHog/Sentry/BetterStack metrics - run Monitoring Agent dashboards")
$partial.Add("Full domain sections require individual agent reports in .agents/reports/")

$body = @"
# Production Sweep Report

**Generated:** $Date  
**Sweep type:** Production (automated probes)  
**Runbook:** [.specify/agents/sweeps/production-sweep.md](.specify/agents/sweeps/production-sweep.md)

---

## Executive Summary

Automated HTTP probes completed. Domain depth (graph, economy, audience, intelligence) requires agent follow-up per layer definitions in `.specify/agents/`.

| URL | Role |
|-----|------|
| $ApiUrl | Railway API |
| $CommunityUrl | Vercel Community |
| $CoreknotUrl | Vercel CoreKnot |
| $WebsiteUrl | Marketing site |

---

## Infrastructure Health

<!-- Populated by automated probes below -->

---

## Master status

``````
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
1. Remediate BROKEN production endpoints
2. Run Security Agent: pnpm audit
3. Run Graph/Intelligence agents against prod DB and job queues
4. Merge domain agent reports into sections: Product, Identity, Graph, Participation, Economy, Audience, Intelligence, Security
``````

"@

Set-Content -Path $Report -Value $body -Encoding UTF8
Write-Host "`nReport written: $Report" -ForegroundColor Green
