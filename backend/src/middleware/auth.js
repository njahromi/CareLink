const jwt = require('jsonwebtoken');
const { Issuer } = require('openid-client');
const logger = require('../utils/logger');

// JWT token verification middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access token required'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

// SMART on FHIR authentication middleware
const authenticateSMART = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'SMART token required'
      });
    }

    // Verify SMART token with FHIR server
    const fhirServerUrl = process.env.FHIR_SERVER_URL;
    const issuer = await Issuer.discover(`${fhirServerUrl}/.well-known/openid_configuration`);
    
    const client = new issuer.Client({
      client_id: process.env.SMART_CLIENT_ID,
      client_secret: process.env.SMART_CLIENT_SECRET,
      token_endpoint_auth_method: 'client_secret_basic'
    });

    const tokenSet = await client.validateIdToken(token);
    
    // Extract user information from token
    req.user = {
      id: tokenSet.claims.sub,
      name: tokenSet.claims.name,
      email: tokenSet.claims.email,
      role: tokenSet.claims.role || 'patient',
      fhirPatientId: tokenSet.claims.fhir_patient_id,
      scopes: tokenSet.claims.scope?.split(' ') || []
    };

    next();
  } catch (error) {
    logger.error('SMART authentication failed:', error);
    return res.status(401).json({
      success: false,
      error: 'Invalid SMART token'
    });
  }
};

// Role-based access control middleware
const authorizeRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
    }

    next();
  };
};

// Patient context middleware (for SMART on FHIR)
const requirePatientContext = (req, res, next) => {
  if (!req.user.fhirPatientId) {
    return res.status(400).json({
      success: false,
      error: 'Patient context required'
    });
  }

  req.patientId = req.user.fhirPatientId;
  next();
};

// Scope validation middleware
const requireScope = (requiredScope) => {
  return (req, res, next) => {
    if (!req.user.scopes || !req.user.scopes.includes(requiredScope)) {
      return res.status(403).json({
        success: false,
        error: `Scope '${requiredScope}' required`
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authenticateSMART,
  authorizeRole,
  requirePatientContext,
  requireScope
}; 