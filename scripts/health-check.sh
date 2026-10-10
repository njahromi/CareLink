#!/usr/bin/env bash
# Probe CareLink platform and FHIR repository health.
set -euo pipefail
API="${CARELINK_API:-http://localhost:3000}"
FHIR="${FHIR_SERVER_URL:-http://localhost:8080/fhir}"

fail=0

check() {
  local name="$1"
  local url="$2"
  if curl -fsS "$url" >/dev/null; then
    echo "OK   $name  $url"
  else
    echo "FAIL $name  $url"
    fail=1
  fi
}

check "platform" "$API/health"
check "platform-detailed" "$API/api/health/detailed"
check "smart-config" "$API/.well-known/smart-configuration"
check "fhir-metadata" "$FHIR/metadata"

exit "$fail"
