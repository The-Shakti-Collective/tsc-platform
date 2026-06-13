#Requires -Version 5.1
param(
  [ValidateSet('web', 'community', 'coreknot', 'docs')]
  [string]$Project,
  [ValidateSet('staging', 'production')]
  [string]$Environment = 'staging',
  [switch]$Rollback
)

$ErrorActionPreference = 'Stop'

if (-not $env:VERCEL_TOKEN) {
  Write-Error 'Set VERCEL_TOKEN before deploy.'
}

$projectSecret = switch ($Project) {
  'web'       { 'VERCEL_PROJECT_ID_WEB' }
  'community' { 'VERCEL_PROJECT_ID_COMMUNITY' }
  'coreknot'  { 'VERCEL_PROJECT_ID_COREKNOT' }
  'docs'      { 'VERCEL_PROJECT_ID_DOCS' }
}

$projectId = (Get-Item "env:$projectSecret" -ErrorAction SilentlyContinue).Value
if (-not $projectId) {
  Write-Error "Set $projectSecret."
}

$prodFlag = if ($Environment -eq 'production') { '--prod' } else { '' }

if ($Rollback) {
  Write-Host "Rolling back Vercel project $Project ($Environment)..."
  vercel rollback --token $env:VERCEL_TOKEN --yes
  exit $LASTEXITCODE
}

Write-Host "Deploying tsc-$Project to Vercel ($Environment)..."
if ($prodFlag) {
  vercel deploy $prodFlag --token $env:VERCEL_TOKEN --project $projectId
} else {
  vercel deploy --token $env:VERCEL_TOKEN --project $projectId
}
