# Kill common TSC dev ports (Windows) — delegates to kill-all-dev-ports.ps1
# Usage: .\scripts\kill-ports.ps1

param(
    [int[]]$Ports = @(3000, 3001, 3002, 4000)
)

$ScriptsDir = Split-Path -Parent $MyInvocation.MyCommand.Path
& (Join-Path $ScriptsDir "kill-all-dev-ports.ps1") -Ports $Ports
exit $LASTEXITCODE
