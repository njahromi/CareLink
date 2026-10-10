# CareLink platform runbooks

## FHIR repository down

Symptoms: `/api/health/detailed` shows `fhir.status = down`; Patient Access and admin repository counts fail.

1. `curl -i http://localhost:8080/fhir/metadata`
2. `docker compose ps fhir postgres`
3. `docker compose logs fhir --tail=200`
4. Confirm Postgres: `docker compose exec postgres pg_isready -U hapi -d hapi`
5. If HAPI is still starting, wait — first boot after a volume create can take 1–2 minutes.
6. Restart only the FHIR node: `docker compose restart fhir`

## Ingest channel failure

Symptoms: Admin → Channels shows FAIL; AuditEvent outcome 8.

1. Confirm the body is a FHIR `Bundle` with `type=transaction`.
2. Confirm the target partition exists.
3. Replay with the sample: `fhir/seed/sample-ingest.json`.
4. Inspect HAPI OperationOutcome in the API error payload.
5. Check `scripts/fhir-ops-queries.sql` recent writes.

## Token or scope 403

Symptoms: `Scope 'patient/*.read' required` or patient-context mismatch.

1. Decode the Bearer JWT (it is an app/SMART JWT signed by CareLink).
2. Confirm `scopes` / `patient` / `role`.
3. Patients may only read their launched `fhirPatientId`.
4. Bulk `$export` needs `system/*.read` or an admin session.
5. Re-auth via password login or SMART authorize (`/oauth/authorize`).

## Partition miss

Symptoms: Search returns an empty Bundle but HAPI has the resource.

1. Gateway adds `_tag=https://carelink.local/fhir/partition|{id}`.
2. Seeded Patient Access data is tagged `patient-access`.
3. Admin can pass `?partition=` or ingest into another partition.
4. `sam-okonkwo` lives in `payer-internal` and will not appear on Patient Access.

## Slow or stuck `$export`

1. Admin → APIs / Export → job status (`accepted` → `in-progress` → `completed`).
2. Files land in `data/exports/{jobId}/*.ndjson`.
3. Disable the Bulk Export module to shed load.
4. If HAPI search is slow, run the resource-count SQL in `scripts/fhir-ops-queries.sql`.

## Restore from backup

1. `scripts/fhir-backup.sh` writes `data/backups/hapi-fhir-*.sql`.
2. Restore: `psql -h localhost -U hapi -d hapi < data/backups/hapi-fhir-YYYYMMDD.sql`
3. Restart HAPI: `docker compose restart fhir`
4. Re-seed if the dump predates current demo patients: `node scripts/fhir-seed.js`

## Health probes

```bash
./scripts/health-check.sh
curl http://localhost:3000/api/health/detailed
```
