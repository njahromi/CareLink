const express = require('express');
const fhirService = require('../services/fhirService');
const { getState } = require('../services/platformStore');
const { listJobs } = require('../services/bulkExportService');
const { probeFhir, probePostgres, mongoStatus } = require('../utils/database');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const [fhir, postgres] = await Promise.all([probeFhir(), probePostgres()]);
    const unhealthy = [fhir, postgres].some((item) => item.status !== 'connected');
    res.status(unhealthy ? 503 : 200).json({
      success: !unhealthy,
      data: {
        status: unhealthy ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        services: {
          fhir: fhir.status,
          postgres: postgres.status,
          mongo: mongoStatus()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

router.get('/detailed', async (req, res, next) => {
  try {
    const [fhir, postgres] = await Promise.all([probeFhir(), probePostgres()]);
    let capabilities = null;
    try {
      capabilities = await fhirService.getCapabilities();
    } catch (error) {
      capabilities = { error: error.message };
    }
    const state = getState();
    const unhealthy = fhir.status !== 'connected' || postgres.status !== 'connected';
    res.status(unhealthy ? 503 : 200).json({
      success: !unhealthy,
      data: {
        status: unhealthy ? 'degraded' : 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || 'development',
        version: '1.0.0',
        services: {
          fhir,
          postgres,
          mongo: { status: mongoStatus() },
          gateway: { status: 'connected', modulesEnabled: state.modules.filter((item) => item.enabled).length }
        },
        repository: {
          url: fhirService.repositoryUrl,
          software: capabilities?.software || null,
          fhirVersion: capabilities?.fhirVersion || 'R4'
        },
        exports: {
          jobs: listJobs().length,
          inProgress: listJobs().filter((job) => job.status === 'in-progress' || job.status === 'accepted').length
        },
        metrics: state.metrics,
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          memory: process.memoryUsage()
        }
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
