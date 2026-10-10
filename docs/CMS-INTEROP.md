# CMS and ONC interoperability mapping

CareLink demonstrates the **data plane and operational model** behind CMS Interoperability rules. It is not a certified production payer stack.

## Patient Access API (implemented)

A member signs in with SMART standalone launch (or the demo password that issues a SMART access token). The gateway enforces patient context and `patient/*.read`. The dashboard reads:

| Resource | Profile story |
|---|---|
| Patient, Observation, Condition, MedicationRequest, CarePlan, AllergyIntolerance | US Core clinicals |
| Coverage, ExplanationOfBenefit | CARIN Blue Button claims |

Demo: `demo / demo123` → `Patient/alex-rivera` on partition `patient-access`.

## Provider Access (demo path)

Same Bulk Data job, run with a provider/admin token and the `provider-access` partition. Narrative: attributed providers pull member clinicals as NDJSON.

## Payer-to-Payer (demo path)

`sam-okonkwo` is seeded on `payer-internal`. `$export` with that partition is the P2P payload. A receiving payer would ingest the NDJSON through the JSON Bundle channel.

## Bulk Data `$export` (implemented)

1. `POST /api/fhir/export?_type=Patient,Observation,Coverage,ExplanationOfBenefit&partition=patient-access`
2. Poll `GET /api/fhir/export/jobs/{id}` until `completed`
3. Download `{Type}.ndjson`

This is the same job pattern CMS expects for Patient Access bulk, Provider Access, and Payer-to-Payer.

## Prior Authorization (not in this MVP)

Da Vinci PAS (Claim / ClaimResponse / Questionnaire) is Phase 2. In Smile you would typically enable a PAS implementation guide on a dedicated endpoint and channel X12 278 traffic through Camel.

## ONC / SMART App Launch

- `GET /.well-known/smart-configuration`
- Authorization code + PKCE
- `launch/patient`, `openid`, `fhirUser`, resource scopes
- CapabilityStatement security extensions on `GET /api/fhir/capabilities`
