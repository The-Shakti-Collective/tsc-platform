#Requires -Version 5.1
param(
  [ValidateSet('staging', 'production')]
  [string]$Environment = 'staging',
  [switch]$Migrate
)

$ErrorActionPreference = 'Stop'

if (-not $env:RAILWAY_TOKEN) {
  Write-Error 'Set RAILWAY_TOKEN before deploy.'
}

$serviceVar = if ($Environment -eq 'production') { 'RAILWAY_SERVICE_ID_PROD' } else { 'RAILWAY_SERVICE_ID_STAGING' }
$serviceId = (Get-Item "env:$serviceVar" -ErrorAction SilentlyContinue).Value
if (-not $serviceId) {
  Write-Error "Set $serviceVar to the Railway service ID."
}

Write-Host "Deploying tsc-api to Railway ($Environment)..."
railway up --service $serviceId

if ($Migrate) {
  Write-Host 'Running Prisma migrate deploy...'
  railway run --service $serviceId pnpm prisma migrate deploy
}

Write-Host 'Running post-deploy health check...'
& "$PSScriptRoot\health-check.ps1" -Environment $Environment -Strict
