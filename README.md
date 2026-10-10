# CareLink

**Free, open-source care coordination and healthcare interoperability.**

CareLink helps patients and care teams share health information safely. Members can see their records, vitals, coverage, and claims through a SMART on FHIR Patient Access app. Operators can run a local FHIR R4 platform — repository, security, partitions, ingest, audit, and Bulk Data export — without a commercial license.

The goal is simple: put people in control of their health data, and give clinics and health plans a transparent way to exchange it.

## What CareLink does

- **Patient Access.** Members sign in and view US Core clinicals plus CARIN-style coverage and claims from a FHIR R4 repository.
- **SMART on FHIR.** Standalone launch with OAuth 2.0 and PKCE. CareLink publishes `.well-known/smart-configuration` and issues scoped access tokens.
- **Local FHIR repository.** Run [HAPI FHIR](https://github.com/hapifhir/hapi-fhir) and Postgres in Docker, or start without Docker and use the built-in seed store.
- **Platform console.** Turn modules on and off, manage partitions (Patient Access, Provider Access, payer-internal), register SMART clients, and watch repository health.
- **Ingest channel.** POST a FHIR transaction Bundle into a partition — the same operational idea as an integration channel in front of a repository.
- **Bulk Data `$export`.** Async NDJSON jobs for population or payer-to-payer style exchange.
- **Audit.** Every FHIR read, write, ingest, and export can write a FHIR `AuditEvent`.
- **Operations.** Health probes, seed and backup scripts, and SQL against HAPI’s `HFJ_*` tables.

## Architecture

```
Vue Patient Access + Platform Admin
        │
        ▼
CareLink gateway (Express)
  SMART OAuth  ·  FHIR gateway  ·  Admin API  ·  Bulk export
        │
        ▼
HAPI FHIR R4  +  Postgres
  (or the embedded seed store if HAPI is not running)
```

CareLink is the control plane. HAPI (the open-source engine behind many FHIR servers, including Smile CDR) is the repository.

## Quick start

You need Node.js 18+. Docker Desktop is optional but recommended for a full repository.

```bash
# Optional: local HAPI + Postgres
docker compose up -d postgres fhir
node scripts/fhir-seed.js

# API
cd backend
cp env.example .env
npm install
npm run dev

# UI (second terminal)
cd frontend
cp env.example .env
npm install
npm run dev
```

If HAPI is not running, the gateway loads the same sample members into an embedded FHIR store so you can still explore the product.

- App: http://localhost:5173
- SMART configuration: http://localhost:3000/.well-known/smart-configuration
- HAPI: http://localhost:8080/fhir
- API docs: http://localhost:3000/api-docs

### Sample accounts

These are for local development only.

| User | Password | Role | Member |
|---|---|---|---|
| demo | demo123 | patient | Alex Rivera (`alex-rivera`) |
| jordan | jordan123 | patient | Jordan Lee (`jordan-lee`) |
| admin | admin123 | admin | — |
| provider | provider123 | provider | — |

You can also click **Sign in with SMART on FHIR** and consent as `demo`.

## What’s new in this release

CareLink started as a SMART-enabled patient dashboard. This release turns it into a small interoperability platform you can run on a laptop:

1. **Local FHIR R4 instead of the public HAPI sandbox.** Seed bundles cover patients, vitals, conditions, medications, care plans, coverage, and explanation of benefits.
2. **A working SMART authorization server.** Authorize, token, PKCE, patient context, and wildcard scopes.
3. **A FHIR gateway** that checks tokens, scopes, and partition tags before talking to the repository.
4. **Platform Admin** for modules, repositories, partitions, channels, security, audit, and export jobs.
5. **CMS-style Patient Access and Bulk Data `$export`** so members and downstream systems can retrieve the same records.
6. **Runbooks and ops scripts** for seeding, backup, and health checks.

## Scripts

```bash
node scripts/fhir-seed.js          # load sample FHIR bundles
./scripts/fhir-backup.sh           # pg_dump the HAPI database
./scripts/health-check.sh          # probe gateway + repository
```

Operational SQL lives in `scripts/fhir-ops-queries.sql` (resource counts and recent writes against `postgres://hapi:hapipass@localhost:5432/hapi`).

## Documentation

- [Platform concepts](docs/PLATFORM.md) — modules, partitions, channels, and how they map to common FHIR server administration
- [CMS interoperability](docs/CMS-INTEROP.md) — Patient Access, Bulk Data, Provider Access, and payer-to-payer
- [Runbooks](docs/RUNBOOKS.md) — repository down, ingest failures, scope errors, export, restore
- [API](docs/API.md)
- [Deployment](docs/DEPLOYMENT.md)

## Tech stack

Vue 3, Express, HAPI FHIR R4, Postgres, SMART on FHIR / OAuth 2.0, Docker Compose.

## License

MIT. Use it, fork it, and help more people get access to their own health information.
