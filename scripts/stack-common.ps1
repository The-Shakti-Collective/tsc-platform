# Shared helpers for start-stack.ps1 and dev-stack.ps1

function New-DevLogFile {
    param(
        [string]$Root,
        [string]$Prefix
    )
    $logDir = Join-Path $Root "logs"
    New-Item -ItemType Directory -Force -Path $logDir | Out-Null
    $stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
    return (Join-Path $logDir "$Prefix-$stamp.log")
}

function Write-DevLogHeader {
    param(
        [string]$LogFile,
        [string]$Message
    )
    try {
        $dir = Split-Path -Parent $LogFile
        if ($dir -and -not (Test-Path $dir)) {
            New-Item -ItemType Directory -Force -Path $dir | Out-Null
        }
        $fs = [System.IO.File]::Open(
            $LogFile,
            [System.IO.FileMode]::Append,
            [System.IO.FileAccess]::Write,
            [System.IO.FileShare]::ReadWrite
        )
        $sw = New-Object System.IO.StreamWriter($fs)
        $sw.WriteLine($Message)
        $sw.Close()
        $fs.Close()
    } catch {
        # Non-fatal — dev process still writes via redirect
    }
}

function Import-RootDotEnv {
    param([string]$Root)
    $envPath = Join-Path $Root ".env"
    if (-not (Test-Path $envPath)) { return }
    foreach ($line in Get-Content $envPath) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        if ($trimmed -match '^\s*([^=]+)=(.*)$') {
            $key = $matches[1].Trim()
            if (-not (Get-Item -Path "env:$key" -ErrorAction SilentlyContinue)) {
                Set-Item -Path "env:$key" -Value $matches[2].Trim().Trim('"').Trim("'")
            }
        }
    }
}

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
        Start-Process "http://127.0.0.1:4000/api/health/ready"
    }
}

function Wait-ForApiHealth {
    param(
        [int]$TimeoutSeconds = 60,
        [string]$HealthUrl = "http://127.0.0.1:4000/api/health/ready"
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
        [string]$CorsOrigin,
        [string]$LogFile
    )
    $apiScript = Join-Path $ScriptsDir "run-api-dev.ps1"
    if (-not (Test-Path $apiScript)) {
        Write-Error "Missing $apiScript"
    }
    $Root = Split-Path -Parent $ScriptsDir
    $logName = Split-Path -Leaf $LogFile
    Write-Host "Starting API in new window (log: logs/$logName)..."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $Root -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-File", $apiScript,
        "-CorsOrigin", $CorsOrigin,
        "-LogFile", $LogFile
    ) | Out-Null
}

function Wait-ForFrontendHealth {
    param(
        [int]$Port = 3001,
        [int]$TimeoutSeconds = 60,
        [string]$FrontendUrl,
        [string]$LogFile
    )
    $probeUrls = @()
    if ($FrontendUrl) { $probeUrls += $FrontendUrl }
    $probeUrls += @(
        "http://127.0.0.1:$Port/",
        "http://localhost:$Port/"
    )
    $probeUrls = $probeUrls | Select-Object -Unique

    Write-Host "Waiting for frontend on :$Port (up to ${TimeoutSeconds}s)..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    $dots = 0
    while ((Get-Date) -lt $deadline) {
        if (Test-PortListening -Port $Port) {
            foreach ($url in $probeUrls) {
                try {
                    $resp = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
                    if ($resp.StatusCode -ge 200 -and $resp.StatusCode -lt 400) {
                        Write-Host ""
                        Write-Host "Frontend is healthy on :$Port." -ForegroundColor Green
                        return $true
                    }
                } catch {
                    # port open but HTTP not ready yet
                }
            }
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
    $logHint = if ($LogFile) { $LogFile } else { "logs/frontend-dev-*.log" }
    Write-Warning "Frontend did not respond on :$Port within ${TimeoutSeconds}s. Dev process still running — check $logHint and the frontend terminal."
    return $false
}

function Start-FrontendDevWindow {
    param(
        [string]$ScriptsDir,
        [string]$DevScript,
        [string]$LogFile
    )
    $Root = Split-Path -Parent $ScriptsDir
    $feScript = Join-Path $ScriptsDir "run-frontend-dev.ps1"
    if (-not (Test-Path $feScript)) {
        Write-Error "Missing $feScript"
    }
    $logName = Split-Path -Leaf $LogFile
    Write-Host "Starting frontend ($DevScript) in new window (log: logs/$logName)..."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $Root -ArgumentList @(
        "-NoExit",
        "-ExecutionPolicy", "Bypass",
        "-File", $feScript,
        "-DevScript", $DevScript,
        "-LogFile", $LogFile
    ) | Out-Null
}

function Test-PortListening {
    param([int]$Port)
    $conn = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    return $null -ne $conn
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
    $logFile = New-DevLogFile -Root $Root -Prefix "frontend-dev"
    Write-DevLogHeader -LogFile $logFile -Message "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') frontend dev pnpm $DevScript ====="

    # Dedicated window — persists until closed; avoids Start-Job PATH/log issues on Windows
    Start-FrontendDevWindow -ScriptsDir $ScriptsDir -DevScript $DevScript -LogFile $logFile
    return (Wait-ForFrontendHealth -Port $Port -FrontendUrl $FrontendUrl -TimeoutSeconds $TimeoutSeconds -LogFile $logFile)
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

function Test-CoreKnotServerHealthQuick {
    try {
        $resp = Invoke-WebRequest -Uri "http://127.0.0.1:5000/api/health" -UseBasicParsing -TimeoutSec 3 -ErrorAction Stop
        return $resp.StatusCode -eq 200
    } catch {
        return $false
    }
}

function Wait-ForCoreKnotServerHealth {
    param([int]$TimeoutSeconds = 120)
    Write-Host "Waiting for CoreKnot API at http://127.0.0.1:5000/api/health (up to ${TimeoutSeconds}s)..."
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        if (Test-CoreKnotServerHealthQuick) {
            Write-Host "CoreKnot API is healthy on :5000." -ForegroundColor Green
            return $true
        }
        Start-Sleep -Seconds 2
        Write-Host "." -NoNewline
    }
    Write-Host ""
    Write-Warning "CoreKnot API did not respond within ${TimeoutSeconds}s. Check logs/coreknot-server-dev.log"
    return $false
}

function Start-CoreKnotServerDevWindow {
    param(
        [string]$ScriptsDir,
        [string]$FrontendOrigin = "http://localhost:3001",
        [string]$LogFile
    )
    $script = Join-Path $ScriptsDir "run-coreknot-server-dev.ps1"
    if (-not (Test-Path $script)) { Write-Error "Missing $script" }
    $Root = Split-Path -Parent $ScriptsDir
    $logName = Split-Path -Leaf $LogFile
    Write-Host "Starting CoreKnot CRM API in new window (log: logs/$logName)..."
    Start-Process -FilePath "powershell.exe" -WorkingDirectory $Root -ArgumentList @(
        "-NoExit", "-ExecutionPolicy", "Bypass", "-File", $script,
        "-FrontendOrigin", $FrontendOrigin,
        "-LogFile", $LogFile
    ) | Out-Null
}

function Start-CoreKnotServerDevIfNeeded {
    param([string]$ScriptsDir, [string]$FrontendOrigin = "http://localhost:3001", [int]$TimeoutSeconds = 180)
    if (Test-CoreKnotServerHealthQuick) {
        Write-Host "CoreKnot CRM API already running on :5000 - reusing." -ForegroundColor Green
        return $true
    }

    $Root = Split-Path -Parent $ScriptsDir
    $logFile = New-DevLogFile -Root $Root -Prefix "coreknot-server-dev"
    Write-DevLogHeader -LogFile $logFile -Message "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') CoreKnot CRM dev ====="
    Start-CoreKnotServerDevWindow -ScriptsDir $ScriptsDir -FrontendOrigin $FrontendOrigin -LogFile $logFile
    return (Wait-ForCoreKnotServerHealth -TimeoutSeconds $TimeoutSeconds)
}

function Test-ApiHealthQuick {
    param(
        [string]$HealthUrl = "http://127.0.0.1:4000/api/health/ready"
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

    $Root = Split-Path -Parent $ScriptsDir
    $logFile = New-DevLogFile -Root $Root -Prefix "api-dev"
    Write-DevLogHeader -LogFile $logFile -Message "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') TSC API dev CORS_ORIGIN=$CorsOrigin ====="
    Start-ApiDevWindow -ScriptsDir $ScriptsDir -CorsOrigin $CorsOrigin -LogFile $logFile
    return (Wait-ForApiHealth -TimeoutSeconds $TimeoutSeconds)
}
