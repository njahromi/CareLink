const { randomUUID } = require('crypto');
const { allResources, PARTITION_SYSTEM } = require('../../../fhir/seed');

const store = new Map();

function key(type, id) {
  return `${type}/${id}`;
}

function clone(resource) {
  return JSON.parse(JSON.stringify(resource));
}

function resetFromSeed() {
  store.clear();
  allResources().forEach((resource) => {
    store.set(key(resource.resourceType, resource.id), clone(resource));
  });
}

resetFromSeed();

function matchesSearch(resource, params = {}) {
  const subjectRef = resource.subject?.reference || resource.patient?.reference || resource.beneficiary?.reference;
  if (params._id && resource.id !== params._id) return false;
  if (params.patient && subjectRef !== params.patient && subjectRef !== `Patient/${params.patient}`) return false;
  if (params.subject && subjectRef !== params.subject && subjectRef !== `Patient/${params.subject}`) return false;
  if (params.beneficiary && subjectRef !== params.beneficiary) return false;
  if (params.actor) {
    const actors = (resource.participant || []).map((item) => item.actor?.reference);
    if (!actors.includes(params.actor)) return false;
  }
  if (params.name && resource.resourceType === 'Patient') {
    const hay = JSON.stringify(resource.name || []).toLowerCase();
    if (!hay.includes(String(params.name).toLowerCase())) return false;
  }
  if (params.identifier && resource.identifier) {
    const found = resource.identifier.some((item) => item.value === params.identifier);
    if (!found) return false;
  }
  if (params.birthdate && resource.birthDate !== params.birthdate) return false;
  if (params.category) {
    const categories = JSON.stringify(resource.category || []);
    if (!categories.includes(params.category)) return false;
  }
  if (params._tag) {
    const [system, code] = String(params._tag).split('|');
    const ok = (resource.meta?.tag || []).some((tag) => tag.system === system && tag.code === code);
    if (!ok) return false;
  }
  return true;
}

function bundleOf(resources, summary) {
  if (summary === 'count') {
    return { resourceType: 'Bundle', type: 'searchset', total: resources.length };
  }
  return {
    resourceType: 'Bundle',
    type: 'searchset',
    total: resources.length,
    entry: resources.map((resource) => ({ resource: clone(resource) }))
  };
}

const localFhir = {
  mode: 'embedded',
  resetFromSeed,
  async get(path, params) {
    if (path === '/metadata' || path === 'metadata') {
      return {
        resourceType: 'CapabilityStatement',
        status: 'active',
        date: new Date().toISOString(),
        kind: 'instance',
        fhirVersion: 'R4',
        format: ['application/fhir+json'],
        software: { name: 'CareLink Embedded FHIR (HAPI-compatible)', version: '1.0.0' },
        rest: [{ mode: 'server', resource: ['Patient', 'Observation', 'Condition', 'MedicationRequest', 'CarePlan', 'Appointment', 'Coverage', 'ExplanationOfBenefit', 'AllergyIntolerance', 'AuditEvent', 'Organization', 'Practitioner'].map((type) => ({ type })) }]
      };
    }
    const clean = path.replace(/^\//, '');
    const [type, id] = clean.split('/');
    if (id && !id.startsWith('$')) {
      const resource = store.get(key(type, id));
      if (!resource) {
        const error = new Error(`Resource ${type}/${id} not found`);
        error.statusCode = 404;
        error.name = 'FHIRError';
        throw error;
      }
      return clone(resource);
    }
    const resources = Array.from(store.values()).filter((item) => item.resourceType === type && matchesSearch(item, params));
    return bundleOf(resources, params?._summary);
  },
  async post(path, data) {
    if (path === '/' || path === '' || data?.resourceType === 'Bundle') {
      const outcomes = (data.entry || []).map((entry) => {
        const resource = clone(entry.resource);
        const method = entry.request?.method || 'POST';
        if (method === 'POST' && !resource.id) {
          resource.id = randomUUID();
        }
        store.set(key(resource.resourceType, resource.id), resource);
        return { response: { status: method === 'POST' ? '201 Created' : '200 OK' } };
      });
      return { resourceType: 'Bundle', type: 'transaction-response', entry: outcomes };
    }
    const type = path.replace(/^\//, '').split('/')[0];
    const resource = clone(data);
    resource.resourceType = resource.resourceType || type;
    if (!resource.id) resource.id = randomUUID();
    store.set(key(resource.resourceType, resource.id), resource);
    return clone(resource);
  },
  async put(path, data) {
    const clean = path.replace(/^\//, '');
    const [type, id] = clean.split('/');
    const resource = clone(data);
    resource.resourceType = type;
    resource.id = id;
    store.set(key(type, id), resource);
    return clone(resource);
  },
  countByType() {
    const counts = {};
    for (const resource of store.values()) {
      counts[resource.resourceType] = (counts[resource.resourceType] || 0) + 1;
    }
    return counts;
  },
  size() {
    return store.size;
  }
};

module.exports = localFhir;
