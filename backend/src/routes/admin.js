const express = require('express');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const fhirService = require('../services/fhirService');
const { writeAudit, listMemory } = require('../services/auditService');
const { listJobs } = require('../services/bulkExportService');
const {
  getState,
  setModuleEnabled,
  addPartition,
  recordIngest,
  incrementMetric
} = require('../services/platformStore');
const { clients, users } = require('../config/platform');
const { probePostgres, probeFhir } = require('../utils/database');

const router = express.Router();

router.use(authenticateToken, authorizeRole('admin'));

router.get('/overview', async (req, res, next) => {
  try {
    const [fhir, postgres] = await Promise.all([probeFhir(), probePostgres()]);
    const state = getState();
    res.json({
      success: true,
      data: {
        environment: process.env.NODE_ENV || 'development',
        repositoryUrl: fhirService.repositoryUrl,
        fhir,
        postgres,
        modules: state.modules,
        metrics: state.metrics,
        exportQueue: listJobs().filter((job) => job.status === 'accepted' || job.status === 'in-progress').length,
        recentIngest: state.ingestHistory.slice(0, 5)
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/modules', (req, res) => {
  res.json({ success: true, data: getState().modules });
});

router.put('/modules/:id', (req, res) => {
  const updated = setModuleEnabled(req.params.id, req.body.enabled);
  if (!updated) {
    return res.status(404).json({ success: false, error: 'Module not found' });
  }
  return res.json({ success: true, data: updated });
});

router.get('/repositories', async (req, res, next) => {
  try {
    let capabilities = null;
    let counts = {};
    try {
      capabilities = await fhirService.getCapabilities();
      counts = await fhirService.countByType();
    } catch (error) {
      capabilities = { error: error.message };
    }
    res.json({
      success: true,
      data: {
        id: 'carelink-r4',
        name: 'CareLink FHIR R4 Repository',
        engine: 'HAPI FHIR JPA',
        smileAnalog: 'Smile CDR FHIR Storage module',
        fhirVersion: 'R4',
        url: fhirService.repositoryUrl,
        publicUrl: process.env.FHIR_PUBLIC_URL || 'http://localhost:8080/fhir',
        resourceCounts: counts,
        software: capabilities?.software || null,
        resourceTypes: capabilities?.rest?.[0]?.resource?.map((item) => item.type) || []
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/partitions', (req, res) => {
  res.json({ success: true, data: getState().partitions });
});

router.post('/partitions', (req, res) => {
  const { id, name, program, description } = req.body;
  if (!id || !name) {
    return res.status(400).json({ success: false, error: 'id and name are required' });
  }
  const created = addPartition({ id, name, program: program || 'custom', description: description || '' });
  if (!created) {
    return res.status(409).json({ success: false, error: 'Partition already exists' });
  }
  return res.status(201).json({ success: true, data: created });
});

router.get('/channels', (req, res) => {
  const state = getState();
  res.json({
    success: true,
    data: {
      channels: state.channels,
      history: state.ingestHistory
    }
  });
});

router.post('/channels/ingest', async (req, res, next) => {
  try {
    const bundle = req.body.bundle || req.body;
    const partition = req.body.partition || req.query.partition || 'payer-internal';
    if (!bundle || bundle.resourceType !== 'Bundle') {
      recordIngest({ success: false, error: 'Request must be a FHIR Bundle', partition });
      await writeAudit({ user: req.user, action: 'C', outcome: 'failure', query: 'channel-ingest' });
      return res.status(400).json({ success: false, error: 'Request must be a FHIR Bundle' });
    }

    incrementMetric('fhirWrites');
    const result = await fhirService.postTransaction(bundle, partition);
    const entries = result.entry || [];
    const failed = entries.filter((entry) => !String(entry.response?.status || '').startsWith('2'));
    const summary = {
      success: failed.length === 0,
      partition,
      entries: entries.length,
      failed: failed.length,
      message: failed.length ? 'One or more entries failed' : 'Transaction accepted'
    };
    recordIngest(summary);
    await writeAudit({
      user: req.user,
      action: 'C',
      outcome: summary.success ? 'success' : 'failure',
      query: 'channel-ingest',
      entity: `Bundle/${entries.length}`
    });
    return res.status(summary.success ? 200 : 207).json({ success: summary.success, data: { summary, result } });
  } catch (error) {
    recordIngest({ success: false, error: error.message, partition: req.body.partition });
    await writeAudit({ user: req.user, action: 'C', outcome: 'failure', query: 'channel-ingest' });
    next(error);
  }
});

router.get('/security', (req, res) => {
  res.json({
    success: true,
    data: {
      clients: clients.map((client) => ({
        client_id: client.client_id,
        name: client.name,
        type: client.type,
        grant_types: client.grant_types,
        pkce_required: client.pkce_required,
        scopes: client.scopes,
        redirect_uris: client.redirect_uris
      })),
      users: users.map((user) => ({
        username: user.username,
        name: user.name,
        role: user.role,
        fhirPatientId: user.fhirPatientId,
        partition: user.partition,
        scopes: user.scopes
      }))
    }
  });
});

router.get('/audit', async (req, res, next) => {
  try {
    let fhirEvents = [];
    try {
      const bundle = await fhirService.search('AuditEvent', { _sort: '-date', _count: 25 });
      fhirEvents = fhirService.bundleEntries(bundle);
    } catch (error) {
      fhirEvents = [];
    }
    res.json({
      success: true,
      data: {
        memory: listMemory(Number(req.query.limit) || 50),
        fhir: fhirEvents
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/apis', (req, res) => {
  const base = process.env.BASE_URL || 'http://localhost:3000';
  res.json({
    success: true,
    data: {
      patientAccess: `${base}/api/fhir`,
      smartLaunch: `${base}/oauth/authorize`,
      smartConfiguration: `${base}/.well-known/smart-configuration`,
      bulkExport: `${base}/api/fhir/$export`,
      capabilities: `${base}/api/fhir/capabilities`,
      jobs: listJobs()
    }
  });
});

module.exports = router;
