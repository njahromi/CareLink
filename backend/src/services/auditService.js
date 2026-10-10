const logger = require('../utils/logger');
const fhirService = require('./fhirService');
const { isModuleEnabled } = require('./platformStore');

const memoryLog = [];

function recordMemory(event) {
  memoryLog.unshift(event);
  if (memoryLog.length > 200) {
    memoryLog.pop();
  }
}

function buildAuditEvent({ user, action, outcome, entity, query }) {
  return {
    resourceType: 'AuditEvent',
    type: {
      system: 'http://terminology.hl7.org/CodeSystem/audit-event-type',
      code: 'rest',
      display: 'RESTful Operation'
    },
    subtype: query ? [{ code: query, display: query }] : undefined,
    action,
    recorded: new Date().toISOString(),
    outcome: outcome === 'success' ? '0' : '8',
    agent: [{
      who: {
        display: user?.name || user?.username || 'anonymous'
      },
      requestor: true,
      name: user?.role || 'unknown'
    }],
    source: {
      observer: { display: 'CareLink FHIR Gateway' },
      type: [{ system: 'http://terminology.hl7.org/CodeSystem/security-source-type', code: '4' }]
    },
    entity: entity ? [{
      what: { reference: entity }
    }] : []
  };
}

async function writeAudit({ user, action, outcome = 'success', entity, query }) {
  const event = buildAuditEvent({ user, action, outcome, entity, query });
  recordMemory({
    id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    recorded: event.recorded,
    action,
    outcome,
    entity,
    query,
    agent: user?.name || user?.username || 'anonymous',
    role: user?.role
  });

  if (!isModuleEnabled('audit')) {
    return event;
  }

  try {
    await fhirService.createResource('AuditEvent', event);
  } catch (error) {
    logger.warn(`AuditEvent persist skipped: ${error.message}`);
  }
  return event;
}

function listMemory(limit = 50) {
  return memoryLog.slice(0, limit);
}

module.exports = {
  writeAudit,
  listMemory
};
