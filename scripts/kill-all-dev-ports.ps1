# Aggressively free TSC dev ports (Windows)
# Usage: .\scripts\kill-all-dev-ports.ps1
#        .\scripts\kill-all-dev-ports.ps1 -Ports 3000,4000

param(
    [int[]]$Ports = @(3000, 3001, 3002, 4000)
)

$ErrorActionPreference = "Continue"
$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$killPort = Join-Path $ScriptsDir "kill-port.ps1"

Write-Host "Killing listeners on: $($Ports -join ', ')" -ForegroundColor Cyan
$failed = @()
foreach ($p in $Ports) {
    & $killPort $p
    if ($LASTEXITCODE -ne 0) { $failed += $p }
}

if ($failed.Count -gt 0) {
    Write-Warning "Could not fully free port(s): $($failed -join ', '). Close leftover PowerShell dev windows and retry."
    exit 1
}

Write-Host "All dev ports are free." -ForegroundColor Green
