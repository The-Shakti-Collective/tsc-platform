# Start NestJS API with CORS + log to logs/api-dev-<timestamp>.log
param(
    [Parameter(Mandatory = $true)]
    [string]$CorsOrigin,
    [string]$LogFile
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $Root "logs"
if (-not $LogFile) {
    $LogFile = Join-Path $logDir "api-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
}
$logFile = $LogFile

function Import-DotEnvFile {
    param(
        [string]$Path,
        [string[]]$OverrideKeys = @()
    )
    if (-not (Test-Path $Path)) { return }
    foreach ($line in Get-Content $Path) {
        $trimmed = $line.Trim()
        if (-not $trimmed -or $trimmed.StartsWith('#')) { continue }
        if ($trimmed -notmatch '^\s*([^=]+)=(.*)$') { continue }
        $key = $matches[1].Trim()
        $value = $matches[2].Trim().Trim('"').Trim("'")
        if ($OverrideKeys -contains $key -or -not (Get-Item -Path "env:$key" -ErrorAction SilentlyContinue)) {
            Set-Item -Path "env:$key" -Value $value
        }
    }
}

$sharedInfraKeys = @(
    'DATABASE_URL',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
    'UPSTASH_REDIS_REST_TOKEN'
)

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $Root
Import-DotEnvFile (Join-Path $Root "apps\api\.env")
Import-DotEnvFile (Join-Path $Root ".env") -OverrideKeys $sharedInfraKeys
$env:CORS_ORIGIN = $CorsOrigin

Write-Host "TSC API dev - CORS_ORIGIN=$CorsOrigin"
Write-Host "REDIS_URL=$($env:REDIS_URL)"
Write-Host "Health:   http://localhost:4000/api/health/ready"
Write-Host "Log file: $logFile"
Write-Host ""

try {
    $fs = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
    $sw = New-Object System.IO.StreamWriter($fs)
    $sw.WriteLine("===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') TSC API dev start =====")
    $sw.Close()
    $fs.Close()
} catch {
    # Non-fatal
}

# Redirect output to log; window stays open until closed
pnpm dev:api *>> $logFile
exit $LASTEXITCODE
