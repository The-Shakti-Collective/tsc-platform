#!/usr/bin/env bash
# TSC platform health smoke test
set -euo pipefail

ENV="${1:-local}"
STRICT="${STRICT:-false}"

case "$ENV" in
  local)
    API=http://localhost:4000
    COMMUNITY=http://localhost:3000
    COREKNOT=http://localhost:3001
    ;;
  staging)
    API=https://api-staging.theshakticollective.in
    COMMUNITY=https://community-staging.theshakticollective.in
    COREKNOT=https://coreknot-staging.theshakticollective.in
    ;;
  production)
    API=https://api.theshakticollective.in
    COMMUNITY=https://community.theshakticollective.in
    COREKNOT=https://coreknot.theshakticollective.in
    ;;
  *)
    echo "Usage: $0 [local|staging|production]"
    exit 1
    ;;
esac

check() {
  local name="$1" url="$2" required="${3:-false}"
  if curl -fsS --max-time 15 "$url" >/dev/null; then
    echo "[OK]   $name — $url"
    return 0
  fi
  if [[ "$required" == "true" ]]; then
    echo "[FAIL] $name — $url"
    return 1
  fi
  echo "[SKIP] $name — $url"
  return 0
}

fail=0
check "API liveness" "$API/health" true || fail=1
check "API readiness" "$API/health/ready" true || fail=1
check "Community" "$COMMUNITY/api/health" false || true
check "CoreKnot" "$COREKNOT/health.json" false || true

if [[ "$fail" -ne 0 ]]; then
  echo "Required health checks failed"
  exit 1
fi
echo "All required checks passed"
