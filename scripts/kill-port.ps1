# Kill process listening on a TCP port (Windows)
# Usage: .\scripts\kill-port.ps1 3000

param(
    [Parameter(Mandatory = $true, Position = 0)]
    [int]$Port
)

function Get-ListenerPids {
    param([int]$Port)

    $pids = [System.Collections.Generic.HashSet[int]]::new()
    $connections = Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($c in $connections) {
            if ($c.OwningProcess -gt 0) { [void]$pids.Add([int]$c.OwningProcess) }
        }
    }

    if ($pids.Count -eq 0) {
        $lines = netstat -ano | Select-String ":$Port\s"
        foreach ($line in $lines) {
            if ($line -notmatch 'LISTENING') { continue }
            $parts = ($line -replace '\s+', ' ').Trim().Split(' ')
            if ($parts.Length -ge 5) {
                $pidVal = 0
                if ([int]::TryParse($parts[-1], [ref]$pidVal) -and $pidVal -gt 0) {
                    [void]$pids.Add($pidVal)
                }
            }
        }
    }

    return @($pids)
}

$pids = Get-ListenerPids -Port $Port
if ($pids.Count -eq 0) {
    Write-Host "No listener on port $Port."
    exit 0
}

foreach ($procId in $pids) {
    $proc = Get-Process -Id $procId -ErrorAction SilentlyContinue
    $name = if ($proc) { $proc.ProcessName } else { 'unknown' }
    Write-Host "Stopping PID $procId ($name) on port $Port..."
    & taskkill.exe /F /T /PID $procId 2>&1 | Out-Null
    Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
}

Start-Sleep -Milliseconds 400
$remaining = Get-ListenerPids -Port $Port
if ($remaining.Count -gt 0) {
    Write-Host "Retrying stubborn listener(s) on port $Port..."
    foreach ($procId in $remaining) {
        & taskkill.exe /F /T /PID $procId 2>&1 | Out-Null
    }
    Start-Sleep -Milliseconds 400
}

$still = Get-ListenerPids -Port $Port
if ($still.Count -gt 0) {
    Write-Warning "Port $Port may still be in use (PIDs: $($still -join ', '))."
    exit 1
}

Write-Host "Port $Port is free."
