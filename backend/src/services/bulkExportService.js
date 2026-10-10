const fs = require('fs');
const path = require('path');
const { v4: uuid } = require('uuid');
const fhirService = require('./fhirService');
const { incrementMetric } = require('./platformStore');
const logger = require('../utils/logger');

const exportDir = process.env.EXPORT_DIR || path.join(__dirname, '../../../data/exports');
const jobs = new Map();

const DEFAULT_TYPES = [
  'Patient',
  'Observation',
  'Condition',
  'MedicationRequest',
  'CarePlan',
  'Coverage',
  'ExplanationOfBenefit'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function listJobs() {
  return Array.from(jobs.values()).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

function getJob(id) {
  return jobs.get(id) || null;
}

function getFilePath(jobId, resourceType) {
  return path.join(exportDir, jobId, `${resourceType}.ndjson`);
}

async function fetchAll(resourceType, partition) {
  const resources = [];
  let offset = 0;
  const count = 50;
  for (let page = 0; page < 20; page += 1) {
    const bundle = await fhirService.search(resourceType, { _count: count, _getpagesoffset: offset }, partition);
    const entries = fhirService.bundleEntries(bundle);
    resources.push(...entries);
    if (entries.length < count) {
      break;
    }
    offset += count;
  }
  return resources;
}

async function runJob(job) {
  try {
    job.status = 'in-progress';
    const jobDir = path.join(exportDir, job.id);
    ensureDir(jobDir);
    const output = [];

    for (const resourceType of job.types) {
      const resources = await fetchAll(resourceType, job.partition);
      const file = path.join(jobDir, `${resourceType}.ndjson`);
      const lines = resources.map((resource) => JSON.stringify(resource)).join('\n');
      fs.writeFileSync(file, lines ? `${lines}\n` : '');
      output.push({
        type: resourceType,
        url: `/api/fhir/$export/jobs/${job.id}/files/${resourceType}`,
        count: resources.length
      });
    }

    job.output = output;
    job.status = 'completed';
    job.completedAt = new Date().toISOString();
  } catch (error) {
    logger.error(`Bulk export ${job.id} failed: ${error.message}`);
    job.status = 'failed';
    job.error = error.message;
    job.completedAt = new Date().toISOString();
  }
}

function createJob({ types, partition, requestedBy }) {
  const id = uuid();
  const job = {
    id,
    status: 'accepted',
    types: types?.length ? types : DEFAULT_TYPES,
    partition: partition || null,
    requestedBy,
    createdAt: new Date().toISOString(),
    completedAt: null,
    output: [],
    error: null
  };
  jobs.set(id, job);
  incrementMetric('exportJobs');
  setImmediate(() => runJob(job));
  return job;
}

module.exports = {
  createJob,
  listJobs,
  getJob,
  getFilePath,
  DEFAULT_TYPES
};
