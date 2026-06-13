# TSC Platform — first-time setup (Windows PowerShell)
# Usage: .\scripts\setup.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

function Require-Command($Name, $InstallHint) {
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        Write-Error "$Name not found. $InstallHint"
    }
}

Write-Host "TSC Platform setup" -ForegroundColor Cyan
Write-Host "Root: $Root`n"

Require-Command "node" "Install Node.js 20+ from https://nodejs.org/"
Require-Command "corepack" "Comes with Node 16.13+. Enable pnpm: corepack enable"

$nodeVersion = [Version](node -v).TrimStart("v")
if ($nodeVersion.Major -lt 20) {
    Write-Warning "Node $($nodeVersion) detected. Node 20+ recommended."
}

if (-not (Get-Command pnpm -ErrorAction SilentlyContinue)) {
    Write-Host "Enabling pnpm via corepack..."
    corepack enable
    corepack prepare pnpm@9.15.0 --activate
}

Require-Command "pnpm" "Run: corepack enable && corepack prepare pnpm@9.15.0 --activate"

# --- env files ---
$envExample = Join-Path $Root ".env.example"
$envRoot = Join-Path $Root ".env"
$envCommunity = Join-Path $Root "apps\community\.env.local"
$envWebsite = Join-Path $Root "apps\website\.env.local"

if (-not (Test-Path $envRoot)) {
    if (-not (Test-Path $envExample)) {
        Write-Error ".env.example missing at repo root."
    }
    Copy-Item $envExample $envRoot
    Write-Host "Created .env from .env.example — edit Clerk keys before using auth." -ForegroundColor Yellow
} else {
    Write-Host ".env already exists — skipping."
}

# Next.js reads apps/community/.env.local and apps/website/.env.local
$envApi = Join-Path $Root "apps\api\.env"
Copy-Item $envRoot $envCommunity -Force
Copy-Item $envRoot $envWebsite -Force
Copy-Item $envRoot $envApi -Force
$envCoreknot = Join-Path $Root "apps\coreknot\client\.env.local"
Copy-Item $envRoot $envCoreknot -Force
Write-Host "Synced .env -> apps/api/.env"
Write-Host "Synced .env -> apps/community/.env.local"
Write-Host "Synced .env -> apps/website/.env.local"
Write-Host "Synced .env -> apps/coreknot/client/.env.local"

# --- dependencies ---
Write-Host "`nInstalling dependencies (pnpm install)..."
pnpm install

# --- infrastructure ---
$dockerAvailable = $null -ne (Get-Command docker -ErrorAction SilentlyContinue)
if ($dockerAvailable) {
    Write-Host "`nStarting Postgres + Redis (docker compose)..."
    docker compose up -d
    Write-Host "Waiting for Postgres..."
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        docker compose exec -T postgres pg_isready -U postgres -d tsc_community 2>$null | Out-Null
        if ($LASTEXITCODE -eq 0) { $ready = $true; break }
        Start-Sleep -Seconds 2
    }
    if (-not $ready) {
        Write-Warning "Postgres may not be ready yet. Retry: docker compose up -d"
    }
} else {
    Write-Warning "Docker not found. Start Postgres + Redis manually (see STARTUP.md)."
}

# --- database ---
Write-Host "`nGenerating Prisma client..."
pnpm db:generate

Write-Host "`nPushing schema to database (prisma db push)..."
pnpm db:push

Write-Host "`nBuilding shared packages..."
pnpm build

Write-Host "`nSetup complete." -ForegroundColor Green
Write-Host "Next: pnpm start   (or pnpm dev:api + pnpm dev:community in separate terminals)"
Write-Host "Community: http://localhost:3000"
Write-Host "API:       http://localhost:4000/api"
