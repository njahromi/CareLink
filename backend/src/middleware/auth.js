const logger = require('../utils/logger');
const { verifyToken } = require('../services/tokenService');
const { users } = require('../config/platform');
const { isModuleEnabled } = require('../services/platformStore');

function extractBearer(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || typeof authHeader !== 'string') {
    return null;
  }
  const [scheme, token] = authHeader.split(' ');
  if (scheme !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

function hydrateUser(decoded) {
  const profile = users.find((user) => user.id === decoded.id || user.username === decoded.username);
  return {
    id: decoded.id,
    username: decoded.username,
    name: decoded.name,
    email: decoded.email,
    role: decoded.role,
    fhirPatientId: decoded.fhirPatientId || decoded.patient || profile?.fhirPatientId || null,
    partition: decoded.partition || profile?.partition || null,
    scopes: Array.isArray(decoded.scopes)
      ? decoded.scopes
      : (decoded.scope ? String(decoded.scope).split(/[,\s]+/).filter(Boolean) : profile?.scopes || []),
    clientId: decoded.client_id || decoded.clientId,
    tokenType: decoded.typ || 'app'
  };
}

function attachUserFromToken(req) {
  const token = extractBearer(req);
  if (!token) {
    return null;
  }
  const decoded = verifyToken(token);
  req.user = hydrateUser(decoded);
  req.accessToken = token;
  return req.user;
}

const authenticateToken = (req, res, next) => {
  try {
    if (!attachUserFromToken(req)) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }
    return next();
  } catch (error) {
    logger.error('Token verification failed:', error.message);
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token'
    });
  }
};

const authenticateSMART = (req, res, next) => {
  if (!isModuleEnabled('smart-auth') && !isModuleEnabled('fhir-gateway')) {
    return res.status(503).json({
      success: false,
      error: 'SMART / FHIR gateway module is disabled'
    });
  }
  return authenticateToken(req, res, next);
};

const authenticateAny = authenticateToken;

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

    return next();
  };
};

const requirePatientContext = (req, res, next) => {
  const requestedId = req.params.patientId;
  if (req.user.role === 'admin' || req.user.role === 'provider') {
    req.patientId = requestedId || req.user.fhirPatientId;
    return next();
  }

  if (!req.user.fhirPatientId) {
    return res.status(400).json({
      success: false,
      error: 'Patient context required'
    });
  }

  if (requestedId && requestedId !== req.user.fhirPatientId) {
    return res.status(403).json({
      success: false,
      error: 'Patient context does not match the launched member'
    });
  }

  req.patientId = req.user.fhirPatientId;
  return next();
};

function scopeMatches(granted, required) {
  if (!required) {
    return true;
  }
  if (granted.includes(required) || granted.includes('*') || granted.includes('system/*.read') && required.endsWith('.read')) {
    return true;
  }

  const [reqContext, reqRest] = required.split('/');
  const [reqResource, reqPerm] = (reqRest || '').split('.');

  return granted.some((scope) => {
    if (scope === required) {
      return true;
    }
    const [context, rest] = scope.split('/');
    if (!rest || context !== reqContext) {
      return false;
    }
    const [resource, perm] = rest.split('.');
    const resourceOk = resource === '*' || resource === reqResource;
    const permOk = !reqPerm || perm === '*' || perm === reqPerm;
    return resourceOk && permOk;
  });
}

const requireScope = (...requiredScopes) => {
  return (req, res, next) => {
    if (req.user?.role === 'admin') {
      return next();
    }
    const granted = req.user?.scopes || [];
    const ok = requiredScopes.some((scope) => scopeMatches(granted, scope));
    if (!ok) {
      return res.status(403).json({
        success: false,
        error: `Scope '${requiredScopes.join(' or ')}' required`
      });
    }
    return next();
  };
};

module.exports = {
  authenticateToken,
  authenticateSMART,
  authenticateAny,
  authorizeRole,
  requirePatientContext,
  requireScope,
  scopeMatches
};
