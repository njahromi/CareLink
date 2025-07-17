const mongoose = require('mongoose');
const sql = require('mssql');
const logger = require('./logger');

// MongoDB connection
const connectMongoDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/carelink';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info('✅ MongoDB connected successfully');
  } catch (error) {
    logger.error('❌ MongoDB connection error:', error);
    throw error;
  }
};

// Azure SQL connection
const connectAzureSQL = async () => {
  try {
    const sqlConfig = {
      user: process.env.AZURE_SQL_USER,
      password: process.env.AZURE_SQL_PASSWORD,
      database: process.env.AZURE_SQL_DATABASE,
      server: process.env.AZURE_SQL_SERVER,
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        encrypt: true,
        trustServerCertificate: false
      }
    };

    const pool = await sql.connect(sqlConfig);
    logger.info('✅ Azure SQL connected successfully');
    return pool;
  } catch (error) {
    logger.error('❌ Azure SQL connection error:', error);
    throw error;
  }
};

// Initialize database connections
const connectDB = async () => {
  try {
    await connectMongoDB();
    
    // Only connect to Azure SQL if connection string is provided
    if (process.env.AZURE_SQL_CONNECTION_STRING) {
      await connectAzureSQL();
    } else {
      logger.warn('⚠️ Azure SQL connection string not provided, skipping SQL connection');
    }
    
    logger.info('✅ All database connections established');
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    throw error;
  }
};

// Graceful shutdown
const closeDBConnections = async () => {
  try {
    await mongoose.connection.close();
    logger.info('✅ MongoDB connection closed');
    
    if (sql.connected) {
      await sql.close();
      logger.info('✅ Azure SQL connection closed');
    }
  } catch (error) {
    logger.error('❌ Error closing database connections:', error);
  }
};

// Handle process termination
process.on('SIGINT', async () => {
  await closeDBConnections();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDBConnections();
  process.exit(0);
});

module.exports = {
  connectDB,
  closeDBConnections,
  mongoose,
  sql
}; 