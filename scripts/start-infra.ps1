# TSC Platform - start Docker infra with smart service selection
# Usage: .\scripts\start-infra.ps1 [-ForcePostgres] [-ForceRedis] [-SkipHealthWait]
# Detects Neon DATABASE_URL (skip local postgres) and remote REDIS_URL (skip local redis).
# When Docker is unavailable, exits 0 with guidance (not a fatal error).

param(
    [switch]$ForcePostgres,
    [switch]$ForceRedis,
    [switch]$SkipHealthWait,
    [switch]$StatusOnly
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Read-EnvValue {
    param([string]$Key)
    $envPath = Join-Path $Root ".env"
    if (-not (Test-Path $envPath)) { return $null }
    foreach ($line in Get-Content $envPath) {
        if ($line -match "^\s*$([regex]::Escape($Key))\s*=\s*(.+)$") {
            return $matches[1].Trim().Trim('"').Trim("'")
        }
    }
    return $null
}

function Test-DockerRunning {
    $skip = Read-EnvValue "TSC_SKIP_DOCKER"
    if ($skip -match '^(true|1|yes)$') { return $false }
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) { return $false }
    try {
        $proc = Start-Process -FilePath "docker" -ArgumentList "info" -NoNewWindow -PassThru `
            -RedirectStandardOutput "$env:TEMP\tsc-docker-out.txt" `
            -RedirectStandardError "$env:TEMP\tsc-docker-err.txt"
        if (-not $proc.WaitForExit(5000)) {
            $proc.Kill()
            return $false
        }
        return $proc.ExitCode -eq 0
    } catch {
        return $false
    }
}

function Test-UsesNeonDatabase {
    $url = Read-EnvValue "DATABASE_URL"
    return ($null -ne $url) -and ($url -match 'neon\.tech')
}

function Test-UsesRemoteRedis {
    $url = Read-EnvValue "REDIS_URL"
    if (-not $url) { return $false }
    if ($url -match 'upstash|redis-cloud|render\.com') { return $true }
    if ($url -match 'rediss://') { return $true }
    return ($url -notmatch 'localhost|127\.0\.0\.1')
}

function Write-InfraStatus {
    $usesNeon = Test-UsesNeonDatabase
    $redisUrl = Read-EnvValue "REDIS_URL"
    $usesRemoteRedis = Test-UsesRemoteRedis
    $redisEmpty = [string]::IsNullOrWhiteSpace($redisUrl)

    Write-Host ""
    if ($usesNeon) {
        Write-Host "  Neon = DB OK  (remote DATABASE_URL)" -ForegroundColor Green
    } else {
        Write-Host "  Postgres = needs Docker or local install" -ForegroundColor Yellow
    }

    if ($usesRemoteRedis) {
        Write-Host "  Redis = remote OK  (Upstash/cloud REDIS_URL)" -ForegroundColor Green
    } elseif ($redisEmpty) {
        Write-Host "  Redis = skipped  (stub queue mode - BullMQ jobs no-op)" -ForegroundColor Yellow
    } else {
        Write-Host "  Redis = skipped  (local redis needs Docker - use Upstash or clear REDIS_URL)" -ForegroundColor Yellow
    }
    Write-Host ""
}

function Wait-ContainerHealthy {
    param(
        [string]$ContainerName,
        [int]$TimeoutSeconds = 60
    )
    $healthFmt = '{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}'
    $runningFmt = '{{.State.Running}}'
    $deadline = (Get-Date).AddSeconds($TimeoutSeconds)
    while ((Get-Date) -lt $deadline) {
        $status = & docker inspect --format $healthFmt $ContainerName 2>$null
        if ($status -eq 'healthy') { return $true }
        if ($status -eq 'none') {
            $running = & docker inspect --format $runningFmt $ContainerName 2>$null
            if ($running -eq 'true') { return $true }
        }
        Start-Sleep -Seconds 2
    }
    return $false
}

if (-not (Test-Path (Join-Path $Root ".env"))) {
    Write-Error ".env missing. Run: .\scripts\setup.ps1"
}

if ($StatusOnly) {
    Write-InfraStatus
    exit 0
}

if (-not (Test-DockerRunning)) {
    Write-Host ""
    Write-Host "Docker unavailable - skipping local infra (not a fatal error)." -ForegroundColor Yellow
    Write-Host "  Set TSC_SKIP_DOCKER=true in .env to silence Docker checks." -ForegroundColor DarkGray
    Write-InfraStatus
    exit 0
}

$skipPostgres = (Test-UsesNeonDatabase) -and (-not $ForcePostgres)
$skipRedis = (Test-UsesRemoteRedis) -and (-not $ForceRedis)

$services = @()
if (-not $skipPostgres) { $services += 'postgres' }
if (-not $skipRedis) { $services += 'redis' }

if ($services.Count -eq 0) {
    Write-Host "Skipping Docker infra - using remote DATABASE_URL and/or REDIS_URL from .env"
    Write-InfraStatus
    exit 0
}

Write-Host "Starting Docker infra: $($services -join ', ')"

if ($skipPostgres -and (Test-UsesNeonDatabase)) {
    Write-Host "  Skipping postgres - DATABASE_URL uses Neon (remote)"
}
if ($skipRedis -and (Test-UsesRemoteRedis)) {
    Write-Host "  Skipping redis - REDIS_URL points to remote host"
}

docker compose up -d $services
if ($LASTEXITCODE -ne 0) {
    Write-Error "docker compose up failed"
}

if ($SkipHealthWait) {
    Write-InfraStatus
    exit 0
}

$containers = @{
    postgres = 'tsc-postgres'
    redis    = 'tsc-redis'
}

foreach ($svc in $services) {
    $name = $containers[$svc]
    Write-Host "Waiting for $name to be healthy..."
    if (-not (Wait-ContainerHealthy -ContainerName $name)) {
        Write-Warning "$name did not report healthy within 60s - continuing anyway"
    } else {
        Write-Host "  $name is ready"
    }
}

Write-Host "Infra ready."
Write-InfraStatus
