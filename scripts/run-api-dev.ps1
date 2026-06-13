# Start NestJS API with CORS + tee logs to logs/api-dev.log
param(
    [Parameter(Mandatory = $true)]
    [string]$CorsOrigin
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $Root "logs"
$logFile = Join-Path $logDir "api-dev.log"

function Import-DotEnvFile {
    param([string]$Path)
    if (-not (Test-Path $Path)) { return }
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        if ($trimmed -notmatch '^\s*([^=]+)=(.*)$') { continue }
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        if (-not (Get-Item -Path "env:$key" -ErrorAction SilentlyContinue)) {
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $Root
Import-DotEnvFile (Join-Path $Root "apps\api\.env")
Import-DotEnvFile (Join-Path $Root ".env")
$env:CORS_ORIGIN = $CorsOrigin

Write-Host "TSC API dev - CORS_ORIGIN=$CorsOrigin"
Write-Host "REDIS_URL=$($env:REDIS_URL)"
Write-Host "Log file: $logFile"
Write-Host "Health:   http://localhost:4000/api/health/ready"
Write-Host ""

$header = "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') API dev start CORS_ORIGIN=$CorsOrigin REDIS_URL=$($env:REDIS_URL) ====="
Add-Content -Path $logFile -Value $header

pnpm dev:api 2>&1 | Tee-Object -FilePath $logFile -Append
