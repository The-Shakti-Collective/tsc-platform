# TSC Platform — start local dev stack (Windows PowerShell)
# Usage: .\scripts\start.ps1 [-SkipInfra] [-ApiOnly] [-CommunityOnly]
# Default: same as pnpm start:community (infra + API + Community)

param(
    [switch]$SkipInfra,
    [switch]$ApiOnly,
    [switch]$CommunityOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if ($ApiOnly -or $CommunityOnly) {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Error "pnpm not found. Run scripts/setup.ps1 first."
    }
    if (-not (Test-Path (Join-Path $Root ".env"))) {
        Write-Error ".env missing. Run: .\scripts\setup.ps1"
    }

    if (-not $SkipInfra) {
        & (Join-Path $Root "scripts\start-infra.ps1")
        if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
    }

    if ($ApiOnly) {
        pnpm dev:api
    } else {
        pnpm dev:community
    }
    exit 0
}

$stackArgs = @("-Target", "community")
if ($SkipInfra) { $stackArgs += "-SkipInfra" }
& (Join-Path $Root "scripts\start-stack.ps1") @stackArgs
