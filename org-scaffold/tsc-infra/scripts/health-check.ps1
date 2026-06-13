#Requires -Version 5.1
param(
  [ValidateSet('local', 'staging', 'production')]
  [string]$Environment = 'local',
  [switch]$Strict
)

$ErrorActionPreference = 'Stop'

$Urls = switch ($Environment) {
  'local' {
    @{
      Api       = 'http://localhost:4000'
      Community = 'http://localhost:3000'
      CoreKnot  = 'http://localhost:3001'
      Web       = 'http://localhost:3000'
    }
  }
  'staging' {
    @{
      Api       = 'https://api-staging.theshakticollective.in'
      Community = 'https://community-staging.theshakticollective.in'
      CoreKnot  = 'https://coreknot-staging.theshakticollective.in'
      Web       = 'https://theshakticollective.in'
    }
  }
  'production' {
    @{
      Api       = 'https://api.theshakticollective.in'
      Community = 'https://community.theshakticollective.in'
      CoreKnot  = 'https://coreknot.theshakticollective.in'
      Web       = 'https://theshakticollective.in'
    }
  }
}

function Test-Endpoint {
  param([string]$Name, [string]$Url, [switch]$Required)
  try {
    $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15
    if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 300) {
      Write-Host "[OK]   $Name — $Url ($($response.StatusCode))"
      return $true
    }
    Write-Host "[FAIL] $Name — $Url (HTTP $($response.StatusCode))"
    return $false
  }
  catch {
    if ($Required) {
      Write-Host "[FAIL] $Name — $Url ($($_.Exception.Message))"
    } else {
      Write-Host "[SKIP] $Name — $Url ($($_.Exception.Message))"
    }
    return $false
  }
}

Write-Host "TSC health check — environment: $Environment"
Write-Host ''

$results = @(
  (Test-Endpoint -Name 'API liveness' -Url "$($Urls.Api)/health" -Required)
  (Test-Endpoint -Name 'API readiness' -Url "$($Urls.Api)/health/ready" -Required)
  (Test-Endpoint -Name 'Community' -Url "$($Urls.Community)/api/health")
  (Test-Endpoint -Name 'CoreKnot' -Url "$($Urls.CoreKnot)/health.json")
  (Test-Endpoint -Name 'Web root' -Url $Urls.Web)
)

$failed = $results | Where-Object { $_ -eq $false }
if ($failed.Count -gt 0 -and $Strict) {
  Write-Host ''
  Write-Error "Health check failed ($($failed.Count) endpoint(s))"
}
elseif ($failed.Count -gt 0) {
  Write-Host ''
  Write-Warning "Some optional checks failed. Use -Strict to fail on any miss."
}
else {
  Write-Host ''
  Write-Host 'All checks passed.'
}
