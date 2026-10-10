# CareLink ↔ Smile CDR concept map

CareLink is an open portfolio interoperability platform. The FHIR engine is **HAPI FHIR JPA** (the open-source stack Smile CDR is built on). The CareLink gateway is the Smile-like control plane: modules, partitions, SMART security, channels, audit, and Bulk Data.

| Smile CDR concept | CareLink implementation | Where to look |
|---|---|---|
| FHIR Storage / R4 repository | HAPI JPA + Postgres (`hfj_resource`) | `docker-compose.yml`, `fhir/application.yaml` |
| FHIR REST endpoint | Gateway routes in front of HAPI | `backend/src/routes/fhir.js` |
| SMART on FHIR / Security module | Authorize, token, PKCE, `.well-known/smart-configuration` | `backend/src/routes/smart.js` |
| Partitioning / multi-tenancy | Gateway `meta.tag` `https://carelink.local/fhir/partition` | `backend/src/config/platform.js` |
| Camel integration channel | JSON Bundle transaction ingest | `POST /api/admin/channels/ingest` |
| Cluster / module admin | Vue Platform Admin | `frontend/src/views/admin/Admin.vue` |
| Audit log | FHIR `AuditEvent` + in-memory ring | `backend/src/services/auditService.js` |
| Bulk Export | Async NDJSON `$export` jobs | `backend/src/services/bulkExportService.js` |
| Dev / Test / Prod | Compose-local Dev; same module model for Test/Prod | `docs/RUNBOOKS.md` |

## Environments

This MVP is the **Development** environment: Docker Postgres + HAPI + the CareLink Node gateway.

If Docker / HAPI is not running, the gateway automatically uses an **embedded FHIR store** loaded from `fhir/seed`. The admin console, SMART login, Patient Access, ingest, and `$export` still work. Set `FHIR_MODE=hapi` to fail instead of falling back.

In a Smile shop you would promote the same module/partition/client config across Test and Production, keep secrets in a vault, and fail over with vendor support plus internal runbooks. The operational questions are the same: is the repository up, which partition is the request in, which client and scopes were used, did the channel accept the transaction, and did `$export` finish?

## Partitions

| Partition | Program | Sample data |
|---|---|---|
| `patient-access` | CMS Patient Access | `alex-rivera`, `jordan-lee` |
| `provider-access` | CMS Provider Access | Riverside Clinic / Dr. Johnson |
| `payer-internal` | Payer-to-Payer / ops | `sam-okonkwo` |

## Phase 2 (not in this MVP)

- Licensed Smile CDR image instead of HAPI
- Apache Camel sidecar for HL7 v2 / X12
- Axway or equivalent API gateway
- Da Vinci Prior Authorization (PAS)
- Full US Core validation and production HIPAA program
