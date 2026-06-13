# Shared helpers for start-stack.ps1 and dev-stack.ps1

function Read-EnvValue {
    param(
        [string]$Root,
        [string]$Key
    )
    $envPath = Join-Path $Root ".env"
    if (-not (Test-Path $envPath)) { return $null }
    foreach ($line in Get-Content $envPath) {
        if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)$") {
            return $matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Test-ShouldOpenBrowser {
    param([string]$Root)
    $flag = Read-EnvValue -Root $Root -Key "TSC_OPEN_BROWSER"
    if ($null -eq $flag -or $flag -eq "") { return $true }
    return -not ($flag -match '^(false|0|no)$')
}

function Open-DevBrowser {
    param(
        [string]$FrontendUrl,
        [string]$Root,
        [switch]$OpenApiHealth
    )
    if (-not (Test-ShouldOpenBrowser -Root $Root)) {
        Write-Host "Browser auto-open disabled (TSC_OPEN_BROWSER=false)." -ForegroundColor DarkGray
        return
    }
    Write-Host "Opening external browser: $FrontendUrl" -ForegroundColor Cyan
    Start-Process $FrontendUrl
    if ($OpenApiHealth) {
        Start-Process "http://127.0.0.1:4000/api/feed/health"
    }
}

function Wait-ForApiHealth {
    param(
        [int]$TimeoutSeconds = 60,
        [string]$HealthUrl = "http://127.0.0.1:4000/api/feed/health"
    )
    Write-Host "Waiting for API health at $HealthUrl (up to ${TimeoutSeconds}s)..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $dots = 0
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $HealthUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) {
                Write-Host ""
                Write-Host "API is healthy." -ForegroundColor Green
                return $true
            }
        } catch {
            # still starting
        }
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
        $dots++
        if ($dots -ge 30) {
            Write-Host ""
            $dots = 0
        }
    }
    Write-Host ""
    Write-Warning "API did not respond within ${TimeoutSeconds}s. Check logs/api-dev.log and the API terminal."
    return $false
}

function Start-ApiDevWindow {
    param(
        [string]$ScriptsDir,
        [string]$CorsOrigin
    )
    $apiScript = Join-Path $ScriptsDir "run-api-dev.ps1"
    if (-not (Test-Path $apiScript)) {
        Write-Error "Missing $apiScript"
    }
    $Root = Split-Path -Parent $ScriptsDir
    Write-Host "Starting API in new window (log: logs/api-dev.log)..."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $Root -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-File", $apiScript,
        "-CorsOrigin", $CorsOrigin
    ) | Out-Null
}

function Wait-ForFrontendHealth {
    param(
        [int]$Port = 3001,
        [int]$TimeoutSeconds = 60,
        [string]$FrontendUrl
    )
    if (-not $FrontendUrl) {
        $FrontendUrl = "http://127.0.0.1:$Port/"
    }
    Write-Host "Waiting for frontend at $FrontendUrl (up to ${TimeoutSeconds}s)..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $dots = 0
    while ((Get-Date) -lt $deadline) {
        try {
            $resp = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) {
                Write-Host ""
                Write-Host "Frontend is healthy on :$Port." -ForegroundColor Green
                return $true
            }
        } catch {
            # still starting
        }
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
        $dots++
        if ($dots -ge 30) {
            Write-Host ""
            $dots = 0
        }
    }
    Write-Host ""
    Write-Warning "Frontend did not respond on :$Port within ${TimeoutSeconds}s. Check logs/frontend-dev.log and the frontend terminal."
    return $false
}

function Start-FrontendDevWindow {
    param(
        [string]$ScriptsDir,
        [string]$DevScript
    )
    $Root = Split-Path -Parent $ScriptsDir
    $feScript = Join-Path $ScriptsDir "run-frontend-dev.ps1"
    if (-not (Test-Path $feScript)) {
        Write-Error "Missing $feScript"
    }
    Write-Host "Starting frontend ($DevScript) in new window (log: logs/frontend-dev.log)..."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $Root -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-File", $feScript,
        "-DevScript", $DevScript
    ) | Out-Null
}

function Test-PortListening {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
}

function Start-FrontendDevBackground {
    param(
        [string]$Root,
        [string]$DevScript
    )
    $logDir = Join-Path $Root "logs"
    $logFile = Join-Path $logDir "frontend-dev.log"
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $header = "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') frontend background job pnpm $DevScript ====="
    try {
        Add-Content -Path $logFile -Value $header -ErrorAction Stop
    } catch {
        Write-Host "Could not append to $logFile (likely locked by frontend window) - continuing background job." -ForegroundColor DarkGray
    }

    Get-Job -Name "tsc-frontend-dev" -ErrorAction SilentlyContinue | Remove-Job -Force

    Write-Host "Starting frontend ($DevScript) as background job (log: logs/frontend-dev.log)..." -ForegroundColor Yellow
    Start-Job -Name "tsc-frontend-dev" -ScriptBlock {
        param($Root, $DevScript, $LogFile)
        Set-Location $Root
        try {
            pnpm $DevScript *>> $LogFile
        } catch {
            "background job error: $_" | Out-File -FilePath $LogFile -Append
        }
    } -ArgumentList $Root, $DevScript, $logFile | Out-Null
}

function Start-FrontendDevAndWait {
    param(
        [string]$ScriptsDir,
        [string]$DevScript,
        [int]$Port,
        [string]$FrontendUrl,
        [int]$TimeoutSeconds = 60
    )
    $Root = Split-Path -Parent $ScriptsDir

    # Background job first — external PowerShell windows often lose Vite on Windows/OneDrive
    Start-FrontendDevBackground -Root $Root -DevScript $DevScript
    $ready = Wait-ForFrontendHealth -Port $Port -FrontendUrl $FrontendUrl -TimeoutSeconds $TimeoutSeconds
    if ($ready) { return $true }

    Get-Job -Name "tsc-frontend-dev" -ErrorAction SilentlyContinue | Remove-Job -Force

    Write-Host "Background frontend job did not bind :$Port — trying dedicated window..." -ForegroundColor Yellow
    Start-FrontendDevWindow -ScriptsDir $ScriptsDir -DevScript $DevScript
    return (Wait-ForFrontendHealth -Port $Port -FrontendUrl $FrontendUrl -TimeoutSeconds $TimeoutSeconds)
}

function Start-SingleTerminalStack {
    param(
        [string]$Root,
        [string]$CorsOrigin,
        [string]$DevScript,
        [string]$Label
    )
    Set-Location $Root
    $env:CORS_ORIGIN = $CorsOrigin
    Write-Host ""
    Write-Host "Starting $Label stack in this terminal (API + frontend via concurrently)..."
    Write-Host "  API:      http://localhost:4000/api  (CORS: $CorsOrigin)"
    Write-Host ""
    pnpm exec concurrently -n "api,fe" -c "blue,green" "pnpm dev:api" "pnpm $DevScript"
    exit $LASTEXITCODE
}

function Test-ApiHealthQuick {
    param(
        [string]$HealthUrl = "http://127.0.0.1:4000/api/feed/health"
    )
    foreach ($url in @($HealthUrl, "http://127.0.0.1:4000/api/feed/health")) {
        try {
            $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
            if ($resp.StatusCode -eq 200) { return $true }
        } catch {
            # try next host
        }
    }
    return $false
}

function Start-ApiDevIfNeeded {
    param(
        [string]$ScriptsDir,
        [string]$CorsOrigin,
        [int]$TimeoutSeconds = 60
    )
    if (Test-ApiHealthQuick) {
        Write-Host "API already running on :4000 - reusing (not starting a second API window)." -ForegroundColor Green
        Write-Host "Do not run pnpm dev:api in another terminal while this stack is up." -ForegroundColor DarkGray
        return $true
    }
    Start-ApiDevWindow -ScriptsDir $ScriptsDir -CorsOrigin $CorsOrigin
    return (Wait-ForApiHealth -TimeoutSeconds $TimeoutSeconds)
}
