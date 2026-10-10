const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateSMART, requirePatientContext, requireScope, authorizeRole } = require('../middleware/auth');
const fhirService = require('../services/fhirService');
const { writeAudit } = require('../services/auditService');
const { incrementMetric, isModuleEnabled } = require('../services/platformStore');
const { createJob, listJobs, getJob, getFilePath } = require('../services/bulkExportService');
const fs = require('fs');

const router = express.Router();

function partitionOf(req) {
  return req.query.partition || req.user?.partition || null;
}

function gatewayGuard(req, res, next) {
  if (!isModuleEnabled('fhir-rest') || !isModuleEnabled('fhir-gateway')) {
    return res.status(503).json({ success: false, error: 'FHIR REST / Gateway module is disabled' });
  }
  return next();
}

async function audited(req, action, entity, work) {
  try {
    incrementMetric(action === 'R' ? 'fhirReads' : 'fhirWrites');
    const data = await work();
    await writeAudit({ user: req.user, action, outcome: 'success', entity, query: req.originalUrl });
    return data;
  } catch (error) {
    await writeAudit({ user: req.user, action, outcome: 'failure', entity, query: req.originalUrl });
    throw error;
  }
}

router.get('/patients/search',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'user/*.read', 'system/*.read'),
  async (req, res, next) => {
    try {
      const patients = await audited(req, 'E', 'Patient', () => fhirService.searchPatients({
        name: req.query.name,
        identifier: req.query.identifier,
        birthdate: req.query.birthdate
      }, partitionOf(req)));
      res.json({ success: true, data: patients });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/Patient.read', 'user/*.read'),
  requirePatientContext,
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const patient = await audited(req, 'R', `Patient/${req.params.patientId}`, () => fhirService.getPatient(req.params.patientId));
      res.json({ success: true, data: patient });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/observations',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/Observation.read'),
  requirePatientContext,
  query('category').optional().isString(),
  async (req, res, next) => {
    try {
      const observations = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientObservations(req.params.patientId, req.query.category, partitionOf(req))
      ));
      res.json({
        success: true,
        data: {
          observations,
          vitals: fhirService.formatVitalSigns(observations)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/care-plans',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/CarePlan.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const carePlans = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientCarePlans(req.params.patientId, partitionOf(req))
      ));
      res.json({
        success: true,
        data: {
          carePlans,
          formattedPlans: fhirService.formatCarePlans(carePlans)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/appointments',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/Appointment.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const appointments = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientAppointments(req.params.patientId, partitionOf(req))
      ));
      res.json({
        success: true,
        data: {
          appointments,
          formatted: fhirService.formatAppointments(appointments)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/medications',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/MedicationRequest.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const medications = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientMedications(req.params.patientId, partitionOf(req))
      ));
      res.json({ success: true, data: medications });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/conditions',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/Condition.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const conditions = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientConditions(req.params.patientId, partitionOf(req))
      ));
      res.json({ success: true, data: conditions });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/coverage',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/Coverage.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const coverage = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientCoverage(req.params.patientId, partitionOf(req))
      ));
      res.json({ success: true, data: coverage });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/eob',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/ExplanationOfBenefit.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const eob = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientEobs(req.params.patientId, partitionOf(req))
      ));
      res.json({ success: true, data: eob });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/allergies',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read', 'patient/AllergyIntolerance.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const allergies = await audited(req, 'R', `Patient/${req.params.patientId}`, () => (
        fhirService.getPatientAllergies(req.params.patientId, partitionOf(req))
      ));
      res.json({ success: true, data: allergies });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/patients/:patientId/summary',
  authenticateSMART,
  gatewayGuard,
  requireScope('patient/*.read'),
  requirePatientContext,
  async (req, res, next) => {
    try {
      const patientId = req.params.patientId;
      const partition = partitionOf(req);
      const [patient, observations, conditions, medications, carePlans, appointments, coverage, eob, allergies] = await Promise.all([
        fhirService.getPatient(patientId),
        fhirService.getPatientObservations(patientId, 'vital-signs', partition),
        fhirService.getPatientConditions(patientId, partition),
        fhirService.getPatientMedications(patientId, partition),
        fhirService.getPatientCarePlans(patientId, partition),
        fhirService.getPatientAppointments(patientId, partition),
        fhirService.getPatientCoverage(patientId, partition),
        fhirService.getPatientEobs(patientId, partition),
        fhirService.getPatientAllergies(patientId, partition)
      ]);
      incrementMetric('fhirReads');
      await writeAudit({ user: req.user, action: 'R', entity: `Patient/${patientId}`, query: 'summary' });
      res.json({
        success: true,
        data: {
          patient,
          vitals: fhirService.formatVitalSigns(observations),
          conditions: fhirService.bundleEntries(conditions),
          medications: fhirService.bundleEntries(medications),
          carePlans: fhirService.formatCarePlans(carePlans),
          appointments: fhirService.formatAppointments(appointments),
          coverage: fhirService.bundleEntries(coverage),
          eob: fhirService.bundleEntries(eob),
          allergies: fhirService.bundleEntries(allergies)
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/observations',
  authenticateSMART,
  gatewayGuard,
  requireScope('observation/*.write', 'patient/*.write', 'user/*.write'),
  body('subject').isObject(),
  body('code').isObject(),
  async (req, res, next) => {
    try {
      const observation = await audited(req, 'C', 'Observation', () => fhirService.createObservation({
        ...req.body,
        effectiveDateTime: req.body.effectiveDateTime || new Date().toISOString()
      }, partitionOf(req)));
      res.status(201).json({ success: true, data: observation });
    } catch (error) {
      next(error);
    }
  }
);

router.put('/care-plans/:carePlanId',
  authenticateSMART,
  gatewayGuard,
  requireScope('careplan/*.write', 'patient/*.write'),
  param('carePlanId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const carePlan = await audited(req, 'U', `CarePlan/${req.params.carePlanId}`, () => (
        fhirService.updateCarePlan(req.params.carePlanId, req.body, partitionOf(req))
      ));
      res.json({ success: true, data: carePlan });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/capabilities', async (req, res, next) => {
  try {
    const capabilities = await fhirService.getCapabilities();
    const base = process.env.BASE_URL || 'http://localhost:3000';
    capabilities.software = capabilities.software || { name: 'CareLink FHIR Gateway' };
    capabilities.rest = capabilities.rest || [{}];
    capabilities.rest[0].security = {
      cors: true,
      service: [{
        coding: [{
          system: 'http://hl7.org/fhir/restful-security-service',
          code: 'SMART-on-FHIR',
          display: 'SMART on FHIR'
        }]
      }],
      extension: [{
        url: 'http://fhir-registry.smarthealthit.org/StructureDefinition/oauth-uris',
        extension: [
          { url: 'authorize', valueUri: `${base}/oauth/authorize` },
          { url: 'token', valueUri: `${base}/oauth/token` }
        ]
      }]
    };
    res.json({ success: true, data: capabilities });
  } catch (error) {
    next(error);
  }
});

function startExport(req, res, next) {
  if (!isModuleEnabled('bulk-export')) {
    return res.status(503).json({ success: false, error: 'Bulk Export module is disabled' });
  }
  try {
    const types = (req.query._type || req.body?._type || '')
      .toString()
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const job = createJob({
      types,
      partition: req.query.partition || req.body?.partition,
      requestedBy: req.user.username
    });
    writeAudit({ user: req.user, action: 'E', query: '$export', entity: `BulkExport/${job.id}` });
    res.set('Content-Location', `/api/fhir/$export/jobs/${job.id}`);
    return res.status(202).json({
      success: true,
      data: job
    });
  } catch (error) {
    return next(error);
  }
}

router.post('/$export', authenticateSMART, requireScope('system/*.read', 'user/*.read'), startExport);
router.get('/$export', authenticateSMART, requireScope('system/*.read', 'user/*.read'), startExport);
router.post('/export', authenticateSMART, requireScope('system/*.read', 'user/*.read'), startExport);

router.get('/$export/jobs', authenticateSMART, authorizeRole('admin', 'provider'), (req, res) => {
  res.json({ success: true, data: listJobs() });
});

router.get('/export/jobs', authenticateSMART, authorizeRole('admin', 'provider'), (req, res) => {
  res.json({ success: true, data: listJobs() });
});

router.get('/$export/jobs/:id', authenticateSMART, (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Export job not found' });
  }
  const status = job.status === 'completed' ? 200 : job.status === 'failed' ? 500 : 202;
  return res.status(status).json({ success: job.status !== 'failed', data: job });
});

router.get('/export/jobs/:id', authenticateSMART, (req, res) => {
  const job = getJob(req.params.id);
  if (!job) {
    return res.status(404).json({ success: false, error: 'Export job not found' });
  }
  return res.json({ success: true, data: job });
});

router.get('/$export/jobs/:id/files/:resourceType', authenticateSMART, requireScope('system/*.read', 'user/*.read'), (req, res) => {
  const file = getFilePath(req.params.id, req.params.resourceType);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ success: false, error: 'Export file not found' });
  }
  res.setHeader('Content-Type', 'application/fhir+ndjson');
  return res.sendFile(file);
});

router.get('/export/jobs/:id/files/:resourceType', authenticateSMART, requireScope('system/*.read', 'user/*.read'), (req, res) => {
  const file = getFilePath(req.params.id, req.params.resourceType);
  if (!fs.existsSync(file)) {
    return res.status(404).json({ success: false, error: 'Export file not found' });
  }
  res.setHeader('Content-Type', 'application/fhir+ndjson');
  return res.sendFile(file);
});

module.exports = router;
