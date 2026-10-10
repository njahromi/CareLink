-- CareLink FHIR repository operations
-- HAPI JPA stores resources in HFJ_* tables. Run against the `hapi` Postgres database.
-- Interview talking point: Smile CDR / HAPI repository capacity and type breakdown.

-- Resource counts by type (live inventory)
SELECT
  res_type AS resource_type,
  COUNT(*) AS resource_count,
  MAX(res_updated) AS last_updated
FROM hfj_resource
WHERE res_deleted_at IS NULL
GROUP BY res_type
ORDER BY resource_count DESC;

-- Recent writes (ingestion / API troubleshooting)
SELECT
  res_type,
  fhir_id,
  res_updated,
  res_version
FROM hfj_resource
WHERE res_deleted_at IS NULL
ORDER BY res_updated DESC
LIMIT 25;

-- Approximate repository size by version payloads
SELECT
  r.res_type,
  COUNT(v.pid) AS version_count,
  COALESCE(SUM(LENGTH(v.res_text)), 0) AS payload_bytes
FROM hfj_resource r
LEFT JOIN hfj_res_ver v ON v.res_id = r.res_id
WHERE r.res_deleted_at IS NULL
GROUP BY r.res_type
ORDER BY payload_bytes DESC;

-- Partition / tenant tag investigation (CareLink stores partition as a token tag)
-- Token index table name can vary slightly by HAPI version.
SELECT
  hash_identity,
  sp_system,
  sp_value,
  COUNT(*) AS tagged_resources
FROM hfj_spidx_token
WHERE sp_system = 'https://carelink.local/fhir/partition'
GROUP BY hash_identity, sp_system, sp_value
ORDER BY tagged_resources DESC;

-- Deleted resources (failed ingest cleanup)
SELECT res_type, COUNT(*) AS deleted_count
FROM hfj_resource
WHERE res_deleted_at IS NOT NULL
GROUP BY res_type;
