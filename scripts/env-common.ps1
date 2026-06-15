# Shared env bootstrap helpers for setup / start scripts

function Ensure-EnvFromExample {
    param(
        [Parameter(Mandatory = $true)]
        [string]$ExamplePath,
        [Parameter(Mandatory = $true)]
        [string]$TargetPath,
        [string]$Label = $TargetPath
    )
    if (Test-Path $TargetPath) {
        Write-Host "$Label already exists - skipping."
        return $false
    }
    if (-not (Test-Path $ExamplePath)) {
        Write-Warning "Missing example: $ExamplePath (skipped $Label)"
        return $false
    }
    $parent = Split-Path -Parent $TargetPath
    if ($parent -and -not (Test-Path $parent)) {
        New-Item -ItemType Directory -Force -Path $parent | Out-Null
    }
    Copy-Item $ExamplePath $TargetPath
    Write-Host "Created $Label from example." -ForegroundColor Yellow
    return $true
}

function Test-RequiredEnvFiles {
    param([string]$Root)
    $missing = @()
    $checks = @(
        @{ Path = Join-Path $Root ".env"; Hint = 'Copy-Item .env.example .env' },
        @{ Path = Join-Path $Root "apps\api\.env"; Hint = 'Copy-Item apps/api/.env.example apps/api/.env' },
        @{ Path = Join-Path $Root "apps\coreknot\server\.env"; Hint = 'Copy-Item apps/coreknot/server/.env.example apps/coreknot/server/.env' }
    )
    foreach ($check in $checks) {
        if (-not (Test-Path $check.Path)) {
            $missing += "$($check.Path) - $($check.Hint)"
        }
    }
    if ($missing.Count -gt 0) {
        $missingList = $missing -join ([Environment]::NewLine + '  ')
        Write-Warning "Missing env files:`n  ${missingList}`nRun: ./scripts/setup.ps1"
    }
}

function Sync-SharedInfraToDatabaseEnv {
    param([string]$Root)
    $rootEnv = Join-Path $Root ".env"
    $dbEnv = Join-Path $Root "packages\database\.env"
    if (-not (Test-Path $rootEnv)) { return }
    if (Test-Path $dbEnv) { return }

    $dbUrl = $null
    foreach ($line in Get-Content $rootEnv) {
        if ($line -match '^\s*DATABASE_URL\s*=\s*(.+)$') {
            $dbUrl = $matches[1].Trim().Trim([char]34).Trim([char]39)
            break
        }
    }
    if (-not $dbUrl) { return }

    $example = Join-Path $Root "packages\database\.env.example"
    if (Test-Path $example) {
        Copy-Item $example $dbEnv
    } else {
        Set-Content -Path $dbEnv -Value "DATABASE_URL=$dbUrl" -Encoding utf8
    }
    $dbLine = "DATABASE_URL=$dbUrl"
    (Get-Content $dbEnv) -replace '^DATABASE_URL=.*', $dbLine | Set-Content $dbEnv -Encoding utf8
    Write-Host "Created packages/database/.env from root DATABASE_URL."
}
