const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const logger = require('./utils/logger');
const { connectDB } = require('./utils/database');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth');
const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const carePlanRoutes = require('./routes/carePlans');
const chatRoutes = require('./routes/chat');
const fhirRoutes = require('./routes/fhir');
const healthRoutes = require('./routes/health');
const adminRoutes = require('./routes/admin');
const smartRoutes = require('./routes/smart');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
});

const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: 'Too many requests from this IP, please try again later.'
});

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(compression());
app.use(limiter);
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV
  });
});

app.use(smartRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/care-plans', carePlanRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/fhir', fhirRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/admin', adminRoutes);

if (process.env.NODE_ENV !== 'production') {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');

  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'CareLink Interoperability Platform API',
        version: '1.0.0',
        description: 'SMART on FHIR gateway, Patient Access, and Smile-style platform admin APIs'
      },
      servers: [{
        url: `http://localhost:${process.env.PORT || 3000}`,
        description: 'Development server'
      }],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    },
    apis: ['./src/routes/*.js']
  };

  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

io.on('connection', (socket) => {
  logger.info(`User connected: ${socket.id}`);
  socket.on('disconnect', () => {
    logger.info(`User disconnected: ${socket.id}`);
  });
});

app.use(errorHandler);

app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    server.listen(PORT, () => {
      logger.info(`CareLink platform listening on ${PORT}`);
      logger.info(`SMART configuration: http://localhost:${PORT}/.well-known/smart-configuration`);
      logger.info(`API docs: http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => {
  server.close(() => logger.info('Process terminated'));
});

if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
