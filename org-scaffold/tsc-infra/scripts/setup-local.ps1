#Requires -Version 5.1
<#
.SYNOPSIS
  Start local Postgres + Redis for TSC development.
.DESCRIPTION
  Uses docker compose from org-scaffold/tsc-infra/local/docker-compose.yml
  Falls back to monorepo root docker-compose.yml if scaffold file missing.
#>
param(
  [switch]$Down
)

$ErrorActionPreference = 'Stop'
$InfraRoot = Split-Path -Parent $PSScriptRoot
$MonorepoRoot = Split-Path -Parent (Split-Path -Parent $InfraRoot)
$ComposeScaffold = Join-Path $InfraRoot 'local\docker-compose.yml'
$ComposeMonorepo = Join-Path $MonorepoRoot 'docker-compose.yml'

$ComposeFile = if (Test-Path $ComposeScaffold) { $ComposeScaffold } elseif (Test-Path $ComposeMonorepo) { $ComposeMonorepo } else {
  Write-Error "No docker-compose.yml found. Expected: $ComposeScaffold"
}

if ($Down) {
  docker compose -f $ComposeFile down
  Write-Host 'Local infra stopped.'
  exit 0
}

docker compose -f $ComposeFile up -d
Write-Host 'Local infra up.'
Write-Host '  Postgres: localhost:5432'
Write-Host '  Redis:    localhost:6379'
Write-Host ''
Write-Host 'Connection strings (see .env.example):'
Write-Host '  DATABASE_URL=postgresql://postgres:postgres@localhost:5432/tsc_community'
Write-Host '  REDIS_URL=redis://localhost:6379'
