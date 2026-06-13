# Start a frontend dev script from repo root (e.g. dev:coreknot)
param(
    [Parameter(Mandatory = $true)]
    [string]$DevScript
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $Root "logs"
$logFile = Join-Path $logDir "frontend-dev.log"

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $Root

Write-Host "TSC frontend dev - pnpm $DevScript"
Write-Host "Log file: $logFile"
Write-Host ""

$header = "===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') frontend dev start pnpm $DevScript ====="
Add-Content -Path $logFile -Value $header

# Do not pipe Vite/Next through Tee-Object — breaks TTY and can exit immediately after "ready"
try {
    pnpm $DevScript *>> $logFile
    $exitCode = $LASTEXITCODE
} catch {
    Add-Content -Path $logFile -Value $_.Exception.Message
    $exitCode = 1
}
if ($exitCode -ne 0) {
    Write-Host "Frontend dev exited with code $exitCode. See $logFile" -ForegroundColor Red
}
exit $exitCode
