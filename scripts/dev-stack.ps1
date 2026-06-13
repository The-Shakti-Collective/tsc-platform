# TSC Platform — unified dev stack launcher (API + frontend)
# Usage: .\scripts\dev-stack.ps1 -Target community|coreknot|website

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('community', 'coreknot', 'website')]
    [string]$Target
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ScriptsDir = Join-Path $Root "scripts"
Set-Location $Root

. (Join-Path $ScriptsDir "stack-common.ps1")

if (-not (Test-Path (Join-Path $Root ".env"))) {
    Write-Error ".env missing. Run: .\scripts\setup.ps1"
}

$stacks = @{
    community = @{
        Label       = 'Community'
        FrontendUrl = 'http://localhost:3000'
        CorsOrigin  = 'http://localhost:3000'
        DevScript   = 'dev:community'
        Port        = 3000
    }
    coreknot = @{
        Label       = 'CoreKnot'
        FrontendUrl = 'http://localhost:3001'
        CorsOrigin  = 'http://localhost:3001'
        DevScript   = 'dev:coreknot'
        Port        = 3001
    }
    website = @{
        Label       = 'Website'
        FrontendUrl = 'http://localhost:3002'
        CorsOrigin  = 'http://localhost:3002'
        DevScript   = 'dev:website'
        Port        = 3002
    }
}

$stack = $stacks[$Target]

Copy-Item (Join-Path $Root ".env") (Join-Path $Root "apps\community\.env.local") -Force

Write-Host "Starting $($stack.Label) stack..."
Write-Host "  API:      http://localhost:4000/api  (CORS: $($stack.CorsOrigin))"
Write-Host "  Frontend: $($stack.FrontendUrl)"
Write-Host ""

Start-ApiDevWindow -ScriptsDir $ScriptsDir -CorsOrigin $stack.CorsOrigin
$apiReady = Wait-ForApiHealth -TimeoutSeconds 60
if (-not $apiReady) {
    Write-Host "Starting frontend anyway — API may still be booting." -ForegroundColor Yellow
}

$feReady = Start-FrontendDevAndWait -ScriptsDir $ScriptsDir -DevScript $stack.DevScript -Port $stack.Port -FrontendUrl $stack.FrontendUrl -TimeoutSeconds 60
if (-not $feReady) {
    Write-Host "Frontend may still be booting - check logs/frontend-dev.log" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Opened two terminals. Close them to stop dev servers."
Write-Host ""
Write-Host "--- Ready ---" -ForegroundColor Green
Write-Host "  $($stack.Label): $($stack.FrontendUrl)"
Write-Host "  API:            http://localhost:4000/api"
if (-not $feReady) {
    Write-Host "  Frontend log:   logs/frontend-dev.log" -ForegroundColor Yellow
}

$openApiTab = ($Target -eq 'coreknot')
if ($feReady) {
    Open-DevBrowser -FrontendUrl $stack.FrontendUrl -Root $Root -OpenApiHealth:$openApiTab
} else {
    Write-Host "Skipping browser open until frontend responds on :$($stack.Port)." -ForegroundColor Yellow
}
