# TSC Platform — stop local infrastructure
# Usage: .\scripts\stop.ps1

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $Root

if (Get-Command docker -ErrorAction SilentlyContinue) {
    Write-Host "Stopping Postgres + Redis..."
    docker compose down
    Write-Host "Infrastructure stopped."
} else {
    Write-Warning "Docker not found. Stop Postgres/Redis manually if running."
}

Write-Host "Dev servers (API / Community) run in their own terminals — close those windows to stop them."
