# Start a frontend dev script from repo root (e.g. dev:coreknot)
param(
    [Parameter(Mandatory = $true)]
    [string]$DevScript,
    [string]$LogFile
)

$ErrorActionPreference = "Continue"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$logDir = Join-Path $Root "logs"
if (-not $LogFile) {
    $LogFile = Join-Path $logDir "frontend-dev-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"
}
$logFile = $LogFile

New-Item -ItemType Directory -Force -Path $logDir | Out-Null
Set-Location $Root

$rootEnv = Join-Path $Root ".env"
if (Test-Path $rootEnv) {
    foreach ($line in Get-Content $rootEnv) {
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

Write-Host "TSC frontend dev - pnpm $DevScript"
Write-Host "Log file: $logFile"
Write-Host ""

try {
    $fs = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
    $sw = New-Object System.IO.StreamWriter($fs)
    $sw.WriteLine("===== $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') frontend dev start pnpm $DevScript =====")
    $sw.Close()
    $fs.Close()
} catch {
    # Non-fatal
}

# Redirect to unique log file — avoids lock contention with other dev windows
try {
    pnpm $DevScript *>> $logFile
    $exitCode = $LASTEXITCODE
} catch {
    try {
        $fs = [System.IO.File]::Open($logFile, [System.IO.FileMode]::Append, [System.IO.FileAccess]::Write, [System.IO.FileShare]::ReadWrite)
        $sw = New-Object System.IO.StreamWriter($fs)
        $sw.WriteLine($_.Exception.Message)
        $sw.Close()
        $fs.Close()
    } catch { }
    $exitCode = 1
}
if ($exitCode -ne 0) {
    Write-Host "Frontend dev exited with code $exitCode. See $logFile" -ForegroundColor Red
}
exit $exitCode
