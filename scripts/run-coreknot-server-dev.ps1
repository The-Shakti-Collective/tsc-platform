# Start CoreKnot CRM Express API (MongoDB) — logs to logs/coreknot-server-dev.log
param(
    [string]$FrontendOrigin = "http://localhost:3001"
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $Root "logs"
$logFile = Join-Path $logDir "coreknot-server-dev.log"
$serverEnv = Join-Path $Root "apps\coreknot\server\.env"

function Import-DotEnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        if ($trimmed -notmatch '^\s*([^=]+)=(.*)$') { continue }
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        Set-Item -Path "env:$key" -Value $value
    }
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $Root

if (-not (Test-Path $serverEnv)) {
    Write-Host "Missing $serverEnv — copy from apps/coreknot/server/.env.example" -ForegroundColor Red
    exit 1
}

Import-DotEnvFile $serverEnv
Import-DotEnvFile (Join-Path $Root ".env")

if (-not $env:CLIENT_URL) { $env:CLIENT_URL = $FrontendOrigin }
if (-not $env:FRONTEND_URL) { $env:FRONTEND_URL = $FrontendOrigin }
$env:NODE_ENV = if ($env:NODE_ENV) { $env:NODE_ENV } else { "development" }

Write-Host "CoreKnot CRM API dev — PORT=$($env:PORT) CLIENT_URL=$($env:CLIENT_URL)"
Write-Host "Health:   http://localhost:5000/api/health"
Write-Host ""

# Interactive window — keep TTY for nodemon (stdout redirect breaks boot on Windows)
try {
    pnpm dev:coreknot:server
    exit $LASTEXITCODE
} catch {
    exit 1
}
