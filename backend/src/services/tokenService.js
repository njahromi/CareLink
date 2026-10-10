const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const authorizationCodes = new Map();
const refreshTokens = new Map();

function signAccessToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '1h') {
  return jwt.sign(
    {
      typ: 'smart',
      ...payload
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function signAppToken(payload, expiresIn = process.env.JWT_EXPIRES_IN || '24h') {
  return jwt.sign(
    {
      typ: 'app',
      ...payload
    },
    process.env.JWT_SECRET,
    { expiresIn }
  );
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function createAuthorizationCode(data) {
  const code = crypto.randomBytes(24).toString('hex');
  authorizationCodes.set(code, {
    ...data,
    createdAt: Date.now()
  });
  setTimeout(() => authorizationCodes.delete(code), 5 * 60 * 1000);
  return code;
}

function consumeAuthorizationCode(code) {
  const record = authorizationCodes.get(code);
  authorizationCodes.delete(code);
  if (!record) {
    return null;
  }
  if (Date.now() - record.createdAt > 5 * 60 * 1000) {
    return null;
  }
  return record;
}

function createRefreshToken(payload) {
  const token = crypto.randomBytes(32).toString('hex');
  refreshTokens.set(token, payload);
  return token;
}

function consumeRefreshToken(token) {
  return refreshTokens.get(token) || null;
}

function base64Url(buffer) {
  return buffer.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function verifyPkce(verifier, challenge, method = 'S256') {
  if (!verifier || !challenge) {
    return false;
  }
  if (method === 'plain') {
    return verifier === challenge;
  }
  const hashed = base64Url(crypto.createHash('sha256').update(verifier).digest());
  return hashed === challenge;
}

module.exports = {
  signAccessToken,
  signAppToken,
  verifyToken,
  createAuthorizationCode,
  consumeAuthorizationCode,
  createRefreshToken,
  consumeRefreshToken,
  verifyPkce
};
