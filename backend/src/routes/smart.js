const express = require('express');
const { clients, users } = require('../config/platform');
const {
  createAuthorizationCode,
  consumeAuthorizationCode,
  signAccessToken,
  createRefreshToken,
  consumeRefreshToken,
  verifyPkce
} = require('../services/tokenService');
const { isModuleEnabled } = require('../services/platformStore');

const router = express.Router();

function publicBase(req) {
  return process.env.BASE_URL || `${req.protocol}://${req.get('host')}`;
}

function findClient(id) {
  return clients.find((client) => client.client_id === id);
}

function moduleGuard(req, res, next) {
  if (!isModuleEnabled('smart-auth')) {
    return res.status(503).json({ success: false, error: 'SMART Auth module is disabled' });
  }
  return next();
}

router.get('/.well-known/smart-configuration', (req, res) => {
  const base = publicBase(req);
  res.json({
    issuer: base,
    authorization_endpoint: `${base}/oauth/authorize`,
    token_endpoint: `${base}/oauth/token`,
    introspection_endpoint: `${base}/oauth/introspect`,
    capabilities: [
      'launch-standalone',
      'launch-ehr',
      'client-public',
      'client-confidential-symmetric',
      'sso-openid-connect',
      'context-standalone-patient',
      'permission-patient',
      'permission-user',
      'permission-offline',
      'authorize-post'
    ],
    grant_types_supported: ['authorization_code', 'client_credentials', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    scopes_supported: [
      'openid',
      'fhirUser',
      'launch',
      'launch/patient',
      'offline_access',
      'patient/*.read',
      'user/*.read',
      'system/*.read'
    ],
    response_types_supported: ['code'],
    token_endpoint_auth_methods_supported: ['client_secret_basic', 'client_secret_post']
  });
});

router.get('/oauth/authorize', moduleGuard, (req, res) => {
  const {
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    aud,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod,
    launch
  } = req.query;

  const client = findClient(clientId);
  if (!client) {
    return res.status(400).send('Unknown client_id');
  }
  if (redirectUri && !client.redirect_uris.includes(redirectUri)) {
    return res.status(400).send('Invalid redirect_uri');
  }

  res.setHeader('Content-Type', 'text/html');
  return res.send(`<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>CareLink SMART Authorize</title>
  <style>
    body { font-family: Inter, system-ui, sans-serif; background: #f8fafc; margin: 0; }
    .card { max-width: 420px; margin: 48px auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p, label { color: #475569; font-size: 14px; }
    input { width: 100%; padding: 10px; margin: 6px 0 14px; border: 1px solid #cbd5e1; border-radius: 8px; box-sizing: border-box; }
    button { width: 100%; background: #2563eb; color: #fff; border: 0; padding: 10px; border-radius: 8px; font-weight: 600; }
    .meta { background: #eff6ff; padding: 10px; border-radius: 8px; font-size: 12px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>SMART on FHIR consent</h1>
    <p>Sign in to authorize <strong>${client.name}</strong>.</p>
    <div class="meta">
      scopes: ${scope || 'patient/*.read'}<br/>
      aud: ${aud || process.env.FHIR_PUBLIC_URL || 'http://localhost:8080/fhir'}
    </div>
    <form method="post" action="/oauth/authorize">
      <input type="hidden" name="client_id" value="${clientId || ''}" />
      <input type="hidden" name="redirect_uri" value="${redirectUri || ''}" />
      <input type="hidden" name="scope" value="${scope || ''}" />
      <input type="hidden" name="state" value="${state || ''}" />
      <input type="hidden" name="aud" value="${aud || ''}" />
      <input type="hidden" name="code_challenge" value="${codeChallenge || ''}" />
      <input type="hidden" name="code_challenge_method" value="${codeChallengeMethod || 'S256'}" />
      <input type="hidden" name="launch" value="${launch || ''}" />
      <label>Username</label>
      <input name="username" value="demo" />
      <label>Password</label>
      <input name="password" type="password" value="demo123" />
      <button type="submit">Allow Patient Access</button>
    </form>
    <p>demo/demo123 · jordan/jordan123 · admin/admin123</p>
  </div>
</body>
</html>`);
});

router.post('/oauth/authorize', express.urlencoded({ extended: true }), moduleGuard, (req, res) => {
  const {
    username,
    password,
    client_id: clientId,
    redirect_uri: redirectUri,
    scope,
    state,
    aud,
    code_challenge: codeChallenge,
    code_challenge_method: codeChallengeMethod
  } = req.body;

  const user = users.find((item) => item.username === username && item.password === password);
  const client = findClient(clientId);
  if (!user || !client) {
    return res.status(401).send('Invalid credentials or client');
  }

  const requested = (scope || user.scopes.join(' ')).split(/[,\s]+/).filter(Boolean);
  const granted = requested.filter((item) => client.scopes.includes(item) || user.scopes.includes(item) || item.startsWith('patient/') || item.startsWith('openid') || item === 'fhirUser' || item === 'launch/patient');

  const code = createAuthorizationCode({
    user,
    clientId,
    redirectUri,
    scopes: granted,
    aud,
    codeChallenge,
    codeChallengeMethod
  });

  const target = new URL(redirectUri);
  target.searchParams.set('code', code);
  if (state) {
    target.searchParams.set('state', state);
  }
  return res.redirect(target.toString());
});

router.post('/oauth/token', express.urlencoded({ extended: true }), moduleGuard, (req, res) => {
  const grantType = req.body.grant_type;
  const clientId = req.body.client_id;
  const clientSecret = req.body.client_secret;
  const client = findClient(clientId);

  if (!client) {
    return res.status(401).json({ error: 'invalid_client' });
  }
  if (client.type === 'confidential' && client.client_secret !== clientSecret) {
    return res.status(401).json({ error: 'invalid_client' });
  }

  if (grantType === 'authorization_code') {
    const record = consumeAuthorizationCode(req.body.code);
    if (!record || record.clientId !== clientId) {
      return res.status(400).json({ error: 'invalid_grant' });
    }
    if (record.codeChallenge && !verifyPkce(req.body.code_verifier, record.codeChallenge, record.codeChallengeMethod)) {
      return res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' });
    }

    const accessToken = signAccessToken({
      id: record.user.id,
      username: record.user.username,
      name: record.user.name,
      email: record.user.email,
      role: record.user.role,
      fhirPatientId: record.user.fhirPatientId,
      patient: record.user.fhirPatientId,
      partition: record.user.partition,
      scopes: record.scopes,
      scope: record.scopes.join(' '),
      client_id: clientId
    });
    const refreshToken = createRefreshToken({
      id: record.user.id,
      username: record.user.username,
      scopes: record.scopes,
      clientId
    });

    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      refresh_token: refreshToken,
      scope: record.scopes.join(' '),
      patient: record.user.fhirPatientId,
      fhirUser: record.user.fhirPatientId ? `Patient/${record.user.fhirPatientId}` : undefined
    });
  }

  if (grantType === 'client_credentials') {
    if (!client.grant_types.includes('client_credentials')) {
      return res.status(400).json({ error: 'unsupported_grant_type' });
    }
    const scopes = client.scopes;
    const accessToken = signAccessToken({
      id: client.client_id,
      username: client.client_id,
      name: client.name,
      role: 'system',
      scopes,
      scope: scopes.join(' '),
      client_id: client.client_id
    });
    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: scopes.join(' ')
    });
  }

  if (grantType === 'refresh_token') {
    const record = consumeRefreshToken(req.body.refresh_token);
    if (!record) {
      return res.status(400).json({ error: 'invalid_grant' });
    }
    const user = users.find((item) => item.id === record.id);
    const accessToken = signAccessToken({
      id: record.id,
      username: record.username,
      name: user?.name,
      email: user?.email,
      role: user?.role,
      fhirPatientId: user?.fhirPatientId,
      patient: user?.fhirPatientId,
      partition: user?.partition,
      scopes: record.scopes,
      scope: record.scopes.join(' '),
      client_id: record.clientId
    });
    return res.json({
      access_token: accessToken,
      token_type: 'Bearer',
      expires_in: 3600,
      scope: record.scopes.join(' '),
      patient: user?.fhirPatientId
    });
  }

  return res.status(400).json({ error: 'unsupported_grant_type' });
});

router.post('/oauth/introspect', express.urlencoded({ extended: true }), moduleGuard, (req, res) => {
  try {
    const { verifyToken } = require('../services/tokenService');
    const decoded = verifyToken(req.body.token);
    return res.json({ active: true, ...decoded });
  } catch (error) {
    return res.json({ active: false });
  }
});

module.exports = router;
