#!/usr/bin/env bash
# Backup the HAPI FHIR Postgres repository (Smile-style storage backup).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STAMP="$(date +%Y%m%d-%H%M%S)"
OUT_DIR="${1:-$ROOT/data/backups}"
mkdir -p "$OUT_DIR"
FILE="$OUT_DIR/hapi-fhir-$STAMP.sql"

if command -v docker >/dev/null 2>&1 && docker compose -f "$ROOT/docker-compose.yml" ps postgres --status running >/dev/null 2>&1; then
  docker compose -f "$ROOT/docker-compose.yml" exec -T postgres pg_dump -U hapi hapi > "$FILE"
else
  PGPASSWORD="${PGPASSWORD:-hapipass}" pg_dump -h "${PGHOST:-localhost}" -p "${PGPORT:-5432}" -U "${PGUSER:-hapi}" "${PGDATABASE:-hapi}" > "$FILE"
fi

echo "Wrote FHIR repository backup to $FILE"
echo "Restore: psql -h localhost -U hapi -d hapi < $FILE"
