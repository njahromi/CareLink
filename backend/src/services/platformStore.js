const fs = require('fs');
const path = require('path');
const { modules, partitions } = require('../config/platform');

const dataDir = process.env.PLATFORM_DATA_DIR || path.join(__dirname, '../../../data');
const stateFile = path.join(dataDir, 'platform-state.json');

const defaultState = () => ({
  modules: modules.map((item) => ({ ...item })),
  partitions: partitions.map((item) => ({ ...item })),
  channels: [
    {
      id: 'json-bundle-ingest',
      name: 'JSON Bundle Ingest',
      smileAnalog: 'Apache Camel channel',
      type: 'FHIR_TRANSACTION',
      status: 'idle',
      lastRun: null,
      lastResult: null
    }
  ],
  ingestHistory: [],
  metrics: {
    fhirReads: 0,
    fhirWrites: 0,
    ingestAttempts: 0,
    ingestFailures: 0,
    exportJobs: 0
  }
});

function ensureDir() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
}

function loadState() {
  try {
    if (fs.existsSync(stateFile)) {
      return { ...defaultState(), ...JSON.parse(fs.readFileSync(stateFile, 'utf8')) };
    }
  } catch (error) {
    // Fall through to defaults
  }
  return defaultState();
}

let state = loadState();

function save() {
  try {
    ensureDir();
    fs.writeFileSync(stateFile, JSON.stringify(state, null, 2));
  } catch (error) {
    // Persistence is best-effort for the demo
  }
}

function getState() {
  return state;
}

function isModuleEnabled(id) {
  const found = state.modules.find((item) => item.id === id);
  return found ? found.enabled : true;
}

function setModuleEnabled(id, enabled) {
  const found = state.modules.find((item) => item.id === id);
  if (!found) {
    return null;
  }
  found.enabled = Boolean(enabled);
  save();
  return found;
}

function addPartition(partition) {
  if (state.partitions.some((item) => item.id === partition.id)) {
    return null;
  }
  state.partitions.push(partition);
  save();
  return partition;
}

function recordIngest(result) {
  state.metrics.ingestAttempts += 1;
  if (!result.success) {
    state.metrics.ingestFailures += 1;
  }
  const channel = state.channels.find((item) => item.id === 'json-bundle-ingest');
  if (channel) {
    channel.status = result.success ? 'succeeded' : 'failed';
    channel.lastRun = new Date().toISOString();
    channel.lastResult = result;
  }
  state.ingestHistory.unshift({
    id: `ingest-${Date.now()}`,
    at: new Date().toISOString(),
    ...result
  });
  state.ingestHistory = state.ingestHistory.slice(0, 25);
  save();
}

function incrementMetric(name) {
  if (state.metrics[name] === undefined) {
    state.metrics[name] = 0;
  }
  state.metrics[name] += 1;
  save();
}

module.exports = {
  getState,
  isModuleEnabled,
  setModuleEnabled,
  addPartition,
  recordIngest,
  incrementMetric
};
