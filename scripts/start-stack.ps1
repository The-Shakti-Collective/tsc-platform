# TSC Platform - one command: Docker infra + API + frontend
# Usage: .\scripts\start-stack.ps1 -Target community|coreknot|website|all [-SkipInfra] [-KillPorts] [-SingleTerminal]

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('community', 'coreknot', 'website', 'all')]
    [string]$Target,

    [switch]$SkipInfra,
    [switch]$KillPorts,
    [switch]$SingleTerminal
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$ScriptsDir = Join-Path $Root "scripts"
Set-Location $Root

. (Join-Path $ScriptsDir "stack-common.ps1")

function Require-Pnpm {
    if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
        Write-Error "pnpm not found. Run: .\scripts\setup.ps1"
    }
}

function Test-DockerRunning {
    $skip = Read-EnvValue -Root $Root -Key "TSC_SKIP_DOCKER"
    if ($skip -match '^(true|1|yes)$') { return $false }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { return $false }
    try {
        $proc = Start-Process -FilePath "docker" -ArgumentList "info" -NoNewWindow -PassThru `
            -RedirectStandardOutput "$env:TEMP\tsc-docker-out.txt" `
            -RedirectStandardError "$env:TEMP\tsc-docker-err.txt"
        if (-not $proc.WaitForExit(5000)) {
            $proc.Kill()
            return $false
        }
        return $proc.ExitCode -eq 0
    } catch {
        return $false
    }
}

function Test-SkipDockerInfra {
    $flag = Read-EnvValue -Root $Root -Key "TSC_SKIP_DOCKER"
    if ($flag -match '^(true|1|yes)$') { return $true }
    return -not (Test-DockerRunning)
}

function Test-PortInUse {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
}

function Warn-PortConflicts {
    param(
        [int[]]$Ports,
        [switch]$ReuseApi
    )
    $blocked = @()
    foreach ($p in $Ports) {
        if ($p -eq 4000 -and (Test-ApiHealthQuick)) { continue }
        if (Test-PortInUse -Port $p) { $blocked += $p }
    }
    if ($blocked.Count -eq 0) { return }

    Write-Host ""
    Write-Host "Port(s) already in use: $($blocked -join ', ')" -ForegroundColor Yellow
    if ($KillPorts) {
        foreach ($p in $blocked) {
            & (Join-Path $ScriptsDir "kill-port.ps1") $p
        }
    } else {
        Write-Host "Free them with: pnpm kill:ports  (or: pnpm kill:port <port>)" -ForegroundColor Yellow
        Write-Host "Set TSC_KILL_PORTS=false in .env only if you want to manage ports manually." -ForegroundColor Yellow
    }
    Write-Host ""
}

function Start-StackDevServers {
    param(
        [hashtable]$Stack,
        [string]$CorsOrigin,
        [switch]$OpenApiHealthTab
    )

    if ($SingleTerminal) {
        if (Test-ApiHealthQuick) {
            Write-Host "API already running on :4000 - starting frontend only in this terminal." -ForegroundColor Green
            Set-Location $Root
            pnpm $Stack.DevScript
            exit $LASTEXITCODE
        }
        Start-SingleTerminalStack -Root $Root -CorsOrigin $CorsOrigin -DevScript $Stack.DevScript -Label $Stack.Label
    }

    $apiReady = Start-ApiDevIfNeeded -ScriptsDir $ScriptsDir -CorsOrigin $CorsOrigin -TimeoutSeconds 60
    if (-not $apiReady) {
        Write-Host "Starting frontend anyway - API may still be booting." -ForegroundColor Yellow
    }

    $feReady = Start-FrontendDevAndWait -ScriptsDir $ScriptsDir -DevScript $Stack.DevScript -Port $Stack.Port -FrontendUrl $Stack.FrontendUrl -TimeoutSeconds 60
    if (-not $feReady) {
        Write-Host "Frontend may still be booting - check logs/frontend-dev.log" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host 'Opened dev terminals (API unless reused + frontend). Close them to stop dev servers.'
    Write-Host ""
    Write-Host "--- Ready ---" -ForegroundColor Green
    Write-Host "  $($Stack.Label): $($Stack.FrontendUrl)"
    Write-Host "  API:            http://localhost:4000/api"
    if (-not $apiReady) {
        Write-Host "  API log:        logs/api-dev.log" -ForegroundColor Yellow
    }
    if (-not $feReady) {
        Write-Host "  Frontend log:   logs/frontend-dev.log" -ForegroundColor Yellow
    }

    if ($feReady) {
        Open-DevBrowser -FrontendUrl $Stack.FrontendUrl -Root $Root -OpenApiHealth:$OpenApiHealthTab
    } else {
        Write-Host "Skipping browser open until frontend responds on :$($Stack.Port)." -ForegroundColor Yellow
    }
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

Require-Pnpm

if (-not (Test-Path (Join-Path $Root ".env"))) {
    Write-Error ".env missing. Run: .\scripts\setup.ps1"
}

Copy-Item (Join-Path $Root ".env") (Join-Path $Root "apps\community\.env.local") -Force
Copy-Item (Join-Path $Root ".env") (Join-Path $Root "apps\api\.env") -Force

if (-not $PSBoundParameters.ContainsKey('KillPorts')) {
    $killPortsEnv = Read-EnvValue -Root $Root -Key "TSC_KILL_PORTS"
    if ($killPortsEnv -match '^(false|0|no)$') {
        $KillPorts = $false
    } else {
        $KillPorts = $true
    }
}

$autoSkipInfra = Test-SkipDockerInfra
if ($autoSkipInfra -and -not $SkipInfra) {
    Write-Host ""
    Write-Host "Docker unavailable or TSC_SKIP_DOCKER=true - auto-skipping infra." -ForegroundColor Yellow
    $SkipInfra = $true
}

if (-not $SkipInfra) {
    & (Join-Path $ScriptsDir "start-infra.ps1")
    if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
} else {
    & (Join-Path $ScriptsDir "start-infra.ps1") -StatusOnly
}

if ($Target -eq 'all') {
    if ($SingleTerminal) {
        Write-Warning "-SingleTerminal is not supported with -Target all. Use start:coreknot:single instead."
        exit 1
    }

    $cors = @(
        $stacks.community.CorsOrigin
        $stacks.coreknot.CorsOrigin
        $stacks.website.CorsOrigin
    ) -join ','

    Warn-PortConflicts -Ports @(4000, 3000, 3001, 3002) 

    Write-Host ""
    Write-Host "Starting ALL stacks (shared API + 3 frontends)..."
    Write-Host "  API:       http://localhost:4000/api"
    Write-Host "  Community: http://localhost:3000"
    Write-Host "  CoreKnot:  http://localhost:3001"
    Write-Host "  Website:   http://localhost:3002"
    Write-Host ""

    $apiReady = Start-ApiDevIfNeeded -ScriptsDir $ScriptsDir -CorsOrigin $cors -TimeoutSeconds 60

    $allFeReady = $true
    foreach ($key in @('community', 'coreknot', 'website')) {
        $stack = $stacks[$key]
        $stackReady = Start-FrontendDevAndWait -ScriptsDir $ScriptsDir -DevScript $stack.DevScript -Port $stack.Port -FrontendUrl $stack.FrontendUrl -TimeoutSeconds 60
        if (-not $stackReady) {
            $allFeReady = $false
            Write-Host "$($stack.Label) frontend may still be booting - check logs/frontend-dev.log" -ForegroundColor Yellow
        }
    }

    Write-Host 'Opened frontend terminals (API unless reused + 3 frontends). Close them to stop.'
    if (-not $apiReady) {
        Write-Host "API may still be booting - check logs/api-dev.log" -ForegroundColor Yellow
    }

    if ($allFeReady) {
        Open-DevBrowser -FrontendUrl $stacks.community.FrontendUrl -Root $Root
    } else {
        Write-Host "Skipping browser open until all frontends respond." -ForegroundColor Yellow
    }
    exit 0
}

$stack = $stacks[$Target]

Warn-PortConflicts -Ports @(4000, $stack.Port) 

Write-Host ""
Write-Host "Starting $($stack.Label) stack..."
Write-Host "  API:      http://localhost:4000/api  (CORS: $($stack.CorsOrigin))"
Write-Host "  Frontend: $($stack.FrontendUrl)"
Write-Host ""

$openApiTab = ($Target -eq 'coreknot')
Start-StackDevServers -Stack $stack -CorsOrigin $stack.CorsOrigin -OpenApiHealthTab:$openApiTab
