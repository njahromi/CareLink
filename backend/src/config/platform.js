const PARTITION_SYSTEM = 'https://carelink.local/fhir/partition';

const modules = [
  { id: 'fhir-rest', name: 'FHIR REST Endpoint', smileAnalog: 'FHIR REST / Endpoint', description: 'R4 repository access via the CareLink gateway.', enabled: true },
  { id: 'smart-auth', name: 'SMART Auth', smileAnalog: 'SMART on FHIR / Security', description: 'OAuth 2.0 authorize, token, PKCE, and SMART configuration.', enabled: true },
  { id: 'fhir-gateway', name: 'FHIR Gateway', smileAnalog: 'FHIR Gateway', description: 'Scope, patient-context, and partition enforcement in front of HAPI.', enabled: true },
  { id: 'bulk-export', name: 'Bulk Export', smileAnalog: 'Bulk Export / NDJSON', description: 'CMS Patient Access / Provider Access / Payer-to-Payer $export jobs.', enabled: true },
  { id: 'ingestion-channel', name: 'Ingestion Channel', smileAnalog: 'Camel Channel', description: 'JSON Bundle ingest into the R4 repository.', enabled: true },
  { id: 'audit', name: 'Audit Event Writer', smileAnalog: 'Audit Log', description: 'Writes FHIR AuditEvent for reads, writes, ingest, and export.', enabled: true }
];

const partitions = [
  { id: 'patient-access', name: 'Patient Access', program: 'CMS Patient Access API', description: 'Member-facing US Core and CARIN claims data.' },
  { id: 'provider-access', name: 'Provider Access', program: 'CMS Provider Access API', description: 'Attributed provider directory and clinical exchange.' },
  { id: 'payer-internal', name: 'Payer Internal', program: 'Payer-to-Payer / operations', description: 'Internal payer operations and P2P sample members.' }
];

const clients = [
  {
    client_id: 'carelink-patient-access',
    client_secret: process.env.SMART_CLIENT_SECRET || 'carelink-smart-secret',
    name: 'CareLink Patient Access',
    type: 'public',
    grant_types: ['authorization_code'],
    pkce_required: true,
    redirect_uris: [
      process.env.SMART_REDIRECT_URI || 'http://localhost:5173/smart/callback'
    ],
    scopes: [
      'openid',
      'fhirUser',
      'launch/patient',
      'patient/*.read',
      'patient/Patient.read',
      'patient/Observation.read',
      'patient/Condition.read',
      'patient/MedicationRequest.read',
      'patient/CarePlan.read',
      'patient/Appointment.read',
      'patient/Coverage.read',
      'patient/ExplanationOfBenefit.read',
      'patient/AllergyIntolerance.read'
    ]
  },
  {
    client_id: 'carelink-admin',
    client_secret: 'carelink-admin-secret',
    name: 'CareLink Platform Admin',
    type: 'confidential',
    grant_types: ['authorization_code', 'password'],
    pkce_required: false,
    redirect_uris: [process.env.SMART_REDIRECT_URI || 'http://localhost:5173/smart/callback'],
    scopes: ['openid', 'fhirUser', 'user/*.read', 'system/*.read']
  },
  {
    client_id: 'carelink-bulk-backend',
    client_secret: 'carelink-bulk-secret',
    name: 'CareLink Bulk Data Client',
    type: 'confidential',
    grant_types: ['client_credentials'],
    pkce_required: false,
    redirect_uris: [],
    scopes: ['system/*.read']
  }
];

const users = [
  {
    id: 'user-demo',
    username: 'demo',
    password: 'demo123',
    name: 'Alex Rivera',
    email: 'alex.rivera@example.com',
    role: 'patient',
    fhirPatientId: 'alex-rivera',
    partition: 'patient-access',
    scopes: [
      'openid',
      'fhirUser',
      'launch/patient',
      'patient/*.read',
      'patient/Patient.read',
      'patient/Observation.read',
      'patient/Condition.read',
      'patient/MedicationRequest.read',
      'patient/CarePlan.read',
      'patient/Appointment.read',
      'patient/Coverage.read',
      'patient/ExplanationOfBenefit.read',
      'patient/AllergyIntolerance.read'
    ]
  },
  {
    id: 'user-jordan',
    username: 'jordan',
    password: 'jordan123',
    name: 'Jordan Lee',
    email: 'jordan.lee@example.com',
    role: 'patient',
    fhirPatientId: 'jordan-lee',
    partition: 'patient-access',
    scopes: [
      'openid',
      'fhirUser',
      'launch/patient',
      'patient/*.read'
    ]
  },
  {
    id: 'user-admin',
    username: 'admin',
    password: 'admin123',
    name: 'Platform Admin',
    email: 'admin@carelink.local',
    role: 'admin',
    fhirPatientId: null,
    partition: 'payer-internal',
    scopes: ['openid', 'fhirUser', 'user/*.read', 'system/*.read', 'patient/*.read']
  },
  {
    id: 'user-provider',
    username: 'provider',
    password: 'provider123',
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@riverside.example',
    role: 'provider',
    fhirPatientId: null,
    partition: 'provider-access',
    scopes: ['openid', 'fhirUser', 'user/*.read', 'patient/*.read']
  }
];

const defaultPatientScopes = [
  'patient/*.read',
  'patient/Patient.read',
  'patient/Observation.read',
  'patient/Condition.read',
  'patient/MedicationRequest.read',
  'patient/CarePlan.read',
  'patient/Appointment.read',
  'patient/Coverage.read',
  'patient/ExplanationOfBenefit.read',
  'patient/AllergyIntolerance.read'
];

module.exports = {
  PARTITION_SYSTEM,
  modules,
  partitions,
  clients,
  users,
  defaultPatientScopes
};
