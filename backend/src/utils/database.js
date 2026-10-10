const mongoose = require('mongoose');
const { Client } = require('pg');
const logger = require('./logger');

let mongoConnected = false;

const connectMongoDB = async () => {
  const mongoUri = process.env.MONGODB_URI;
  if (process.env.CONNECT_MONGO === 'false' || !mongoUri) {
    logger.info('MongoDB skipped (CONNECT_MONGO=false or MONGODB_URI unset)');
    return;
  }
  try {
    await mongoose.connect(mongoUri);
    mongoConnected = true;
    logger.info('MongoDB connected');
  } catch (error) {
    logger.warn(`MongoDB unavailable: ${error.message}`);
  }
};

const connectDB = async () => {
  await connectMongoDB();
};

const closeDBConnections = async () => {
  if (mongoConnected) {
    await mongoose.connection.close();
    mongoConnected = false;
  }
};

function mongoStatus() {
  return mongoConnected ? 'connected' : 'skipped';
}

async function probeFhir() {
  const fhirService = require('../services/fhirService');
  const started = Date.now();
  try {
    await fhirService.ensureBackend();
    const capabilities = await fhirService.getCapabilities();
    return {
      status: 'connected',
      mode: fhirService.embedded ? 'embedded' : 'hapi',
      responseTimeMs: Date.now() - started,
      fhirVersion: capabilities?.fhirVersion || 'R4',
      software: capabilities?.software?.name || 'HAPI FHIR'
    };
  } catch (error) {
    return {
      status: 'down',
      responseTimeMs: Date.now() - started,
      error: error.message
    };
  }
}

async function probePostgres() {
  const connectionString = process.env.FHIR_POSTGRES_URL;
  if (!connectionString) {
    return { status: 'skipped', error: 'FHIR_POSTGRES_URL not set' };
  }
  const started = Date.now();
  const client = new Client({ connectionString, connectionTimeoutMillis: 4000 });
  try {
    await client.connect();
    const result = await client.query('SELECT COUNT(*)::int AS resources FROM hfj_resource WHERE res_deleted_at IS NULL');
    await client.end();
    return {
      status: 'connected',
      responseTimeMs: Date.now() - started,
      resourceCount: result.rows[0]?.resources ?? null
    };
  } catch (error) {
    try {
      await client.end();
    } catch (closeError) {
      // ignore
    }
    return {
      status: error.message.includes('does not exist') ? 'connected' : 'down',
      responseTimeMs: Date.now() - started,
      error: error.message,
      note: error.message.includes('does not exist')
        ? 'Database reachable; HAPI tables appear after the first repository write.'
        : undefined
    };
  }
}

process.on('SIGINT', async () => {
  await closeDBConnections();
});

process.on('SIGTERM', async () => {
  await closeDBConnections();
});

module.exports = {
  connectDB,
  closeDBConnections,
  mongoStatus,
  probeFhir,
  probePostgres,
  mongoose
};
