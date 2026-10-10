const express = require('express');
const { body, validationResult } = require('express-validator');
const { users, clients } = require('../config/platform');
const { signAppToken, signAccessToken, createRefreshToken, consumeRefreshToken } = require('../services/tokenService');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    fhirPatientId: user.fhirPatientId,
    partition: user.partition,
    scopes: user.scopes
  };
}

function issueTokens(user) {
  const claims = {
    id: user.id,
    username: user.username,
    name: user.name,
    email: user.email,
    role: user.role,
    fhirPatientId: user.fhirPatientId,
    patient: user.fhirPatientId,
    partition: user.partition,
    scopes: user.scopes,
    scope: user.scopes.join(' ')
  };
  return {
    token: signAppToken(claims),
    accessToken: signAccessToken(claims),
    refreshToken: createRefreshToken({
      id: user.id,
      username: user.username,
      scopes: user.scopes,
      clientId: 'carelink-admin'
    })
  };
}

router.get('/smart/launch', (req, res) => {
  const iss = req.query.iss || process.env.FHIR_PUBLIC_URL || 'http://localhost:8080/fhir';
  const clientId = process.env.SMART_CLIENT_ID || 'carelink-patient-access';
  const redirectUri = process.env.SMART_REDIRECT_URI || 'http://localhost:5173/smart/callback';
  const scope = req.query.scope || 'openid fhirUser launch/patient patient/*.read';
  const state = req.query.state || Math.random().toString(36).slice(2);
  const base = process.env.BASE_URL || 'http://localhost:3000';
  const launchUrl = `${base}/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(state)}&aud=${encodeURIComponent(iss)}&code_challenge=${encodeURIComponent(req.query.code_challenge || '')}&code_challenge_method=${encodeURIComponent(req.query.code_challenge_method || 'S256')}`;

  res.json({
    success: true,
    data: {
      launchUrl,
      clientId,
      scope,
      redirectUri,
      authorizeEndpoint: `${base}/oauth/authorize`
    }
  });
});

router.post('/login',
  [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, error: 'Validation failed', details: errors.array() });
      }

      const user = users.find((item) => item.username === req.body.username && item.password === req.body.password);
      if (!user) {
        return res.status(401).json({ success: false, error: 'Invalid credentials' });
      }

      const tokens = issueTokens(user);
      return res.json({
        success: true,
        data: {
          user: publicUser(user),
          ...tokens
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post('/register',
  [
    body('username').isString().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('name').isString().notEmpty()
  ],
  async (req, res) => {
    return res.status(501).json({
      success: false,
      error: 'Self-registration is disabled. Use demo, jordan, provider, or admin accounts.'
    });
  }
);

router.post('/refresh',
  [body('refreshToken').isString().notEmpty()],
  async (req, res, next) => {
    try {
      const record = consumeRefreshToken(req.body.refreshToken);
      if (!record) {
        return res.status(401).json({ success: false, error: 'Invalid refresh token' });
      }
      const user = users.find((item) => item.id === record.id);
      if (!user) {
        return res.status(401).json({ success: false, error: 'User no longer exists' });
      }
      const tokens = issueTokens(user);
      return res.json({ success: true, data: tokens });
    } catch (error) {
      next(error);
    }
  }
);

router.get('/me', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      user: req.user
    }
  });
});

router.get('/clients', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: clients.map((client) => ({
      client_id: client.client_id,
      name: client.name,
      type: client.type
    }))
  });
});

module.exports = router;
