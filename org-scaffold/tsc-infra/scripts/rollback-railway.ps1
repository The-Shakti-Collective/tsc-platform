#Requires -Version 5.1
param(
  [ValidateSet('staging', 'production')]
  [string]$Environment = 'staging'
)

$ErrorActionPreference = 'Stop'

if (-not $env:RAILWAY_TOKEN) {
  Write-Error 'Set RAILWAY_TOKEN.'
}

$serviceVar = if ($Environment -eq 'production') { 'RAILWAY_SERVICE_ID_PROD' } else { 'RAILWAY_SERVICE_ID_STAGING' }
$serviceId = (Get-Item "env:$serviceVar" -ErrorAction SilentlyContinue).Value
if (-not $serviceId) {
  Write-Error "Set $serviceVar."
}

Write-Host "Listing recent Railway deployments for $Environment..."
railway deployment list --service $serviceId --json | ConvertFrom-Json | Select-Object -First 5 | Format-Table id, status, createdAt

$target = Read-Host 'Enter deployment ID to redeploy (previous green build)'
if (-not $target) {
  Write-Error 'Deployment ID required.'
}

Write-Host "Redeploying $target..."
railway redeploy $target --service $serviceId

& "$PSScriptRoot\health-check.ps1" -Environment $Environment -Strict
