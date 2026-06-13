# Bootstrap TSC Vercel env vars (non-interactive). Idempotent via --force.
param(
  [Parameter(Mandatory = $true)]
  [ValidateSet('website', 'community', 'coreknot')]
  [string]$App
)

$ErrorActionPreference = 'Continue'
$root = Split-Path -Parent $PSScriptRoot

function Add-Env {
  param(
    [string]$Cwd,
    [string]$Name,
    [string]$Value,
    [string[]]$Envs = @('production', 'preview')
  )
  foreach ($env in $Envs) {
    $args = @(
      'env', 'add', $Name, $env,
      '--value', $Value,
      '--yes', '--no-sensitive', '--non-interactive', '--force',
      '--cwd', $Cwd
    )
    $out = & vercel @args 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
      Write-Host "OK $Name ($env)"
    } else {
      Write-Host "SKIP/FAIL $Name ($env): $($out.Trim())"
    }
  }
}

switch ($App) {
  'website' {
    $cwd = Join-Path $root 'apps\website'
    Add-Env $cwd 'NEXT_PUBLIC_TSC_API_URL' 'https://api.theshakticollective.in/api'
    Add-Env $cwd 'NEXT_PUBLIC_APP_URL' 'https://theshakticollective.in'
    Add-Env $cwd 'NEXT_PUBLIC_WEBSITE_URL' 'https://theshakticollective.in'
    Add-Env $cwd 'TSC_AUTH_STUB' 'false'
    Add-Env $cwd 'NEXT_PUBLIC_AUTH_STUB' 'false'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_SIGN_IN_URL' '/sign-in'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_SIGN_UP_URL' '/sign-up'
    Add-Env $cwd 'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE' '0.1'
    Add-Env $cwd 'CLERK_SECRET_KEY' 'REPLACE_WITH_sk_live_FROM_CLERK'
    Add-Env $cwd 'NEXT_PUBLIC_SENTRY_DSN' 'REPLACE_WITH_SENTRY_DSN_OR_LEAVE_EMPTY'
  }
  'community' {
    $cwd = Join-Path $root 'apps\community'
    Add-Env $cwd 'NEXT_PUBLIC_TSC_API_URL' 'https://api.theshakticollective.in/api'
    Add-Env $cwd 'NEXT_PUBLIC_APP_URL' 'https://community.theshakticollective.in'
    Add-Env $cwd 'NEXT_PUBLIC_WEBSITE_URL' 'https://theshakticollective.in'
    Add-Env $cwd 'TSC_AUTH_STUB' 'false'
    Add-Env $cwd 'NEXT_PUBLIC_AUTH_STUB' 'false'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_SIGN_IN_URL' '/sign-in'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_SIGN_UP_URL' '/sign-up'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL' '/onboarding'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL' '/onboarding'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_IS_SATELLITE' 'true'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_DOMAIN' 'community.theshakticollective.in'
    Add-Env $cwd 'CLERK_SIGN_IN_URL' 'https://theshakticollective.in/sign-in'
    Add-Env $cwd 'NEXT_PUBLIC_POSTHOG_HOST' 'https://us.i.posthog.com'
    Add-Env $cwd 'NEXT_PUBLIC_SENTRY_TRACES_SAMPLE_RATE' '0.1'
    Add-Env $cwd 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY' 'REPLACE_WITH_pk_live_FROM_CLERK'
    Add-Env $cwd 'CLERK_SECRET_KEY' 'REPLACE_WITH_sk_live_FROM_CLERK'
    Add-Env $cwd 'NEXT_PUBLIC_POSTHOG_KEY' 'REPLACE_WITH_phc_FROM_POSTHOG'
    Add-Env $cwd 'NEXT_PUBLIC_SENTRY_DSN' 'REPLACE_WITH_SENTRY_DSN_OR_LEAVE_EMPTY'
  }
  'coreknot' {
    $cwd = Join-Path $root 'apps\coreknot\client'
    Add-Env $cwd 'VITE_TSC_API_URL' 'https://api.theshakticollective.in/api'
    Add-Env $cwd 'VITE_POSTHOG_HOST' 'https://us.i.posthog.com'
    Add-Env $cwd 'VITE_SENTRY_TRACES_SAMPLE_RATE' '0.1'
    Add-Env $cwd 'VITE_AUTH_STUB' 'false'
    Add-Env $cwd 'VITE_CLERK_PUBLISHABLE_KEY' 'REPLACE_WITH_pk_live_FROM_CLERK'
    Add-Env $cwd 'VITE_POSTHOG_KEY' 'REPLACE_WITH_phc_FROM_POSTHOG'
    Add-Env $cwd 'VITE_SENTRY_DSN' 'REPLACE_WITH_SENTRY_DSN_OR_LEAVE_EMPTY'
  }
}
