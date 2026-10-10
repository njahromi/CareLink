#!/usr/bin/env bash
# Load FHIR R4 seed bundles into the local HAPI repository.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
export FHIR_SERVER_URL="${FHIR_SERVER_URL:-http://localhost:8080/fhir}"

if ! command -v node >/dev/null 2>&1; then
  echo "node is required to generate and post seed bundles"
  exit 1
fi

cd "$ROOT/backend"
if [ ! -d node_modules/axios ]; then
  echo "Installing backend dependencies so the seed client can run..."
  npm install
fi

cd "$ROOT"
node scripts/fhir-seed.js
