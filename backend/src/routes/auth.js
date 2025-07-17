const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const { Issuer } = require('openid-client');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/auth/smart/launch:
 *   get:
 *     summary: Launch SMART on FHIR application
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: iss
 *         required: true
 *         schema:
 *           type: string
 *         description: FHIR server URL
 *       - in: query
 *         name: launch
 *         required: true
 *         schema:
 *           type: string
 *         description: Launch token
 *     responses:
 *       200:
 *         description: SMART launch URL generated
 */
router.get('/smart/launch',
  async (req, res, next) => {
    try {
      const { iss, launch } = req.query;
      
      if (!iss || !launch) {
        return res.status(400).json({
          success: false,
          error: 'Missing required parameters: iss and launch'
        });
      }

      // Generate SMART launch URL
      const clientId = process.env.SMART_CLIENT_ID;
      const redirectUri = `${process.env.BASE_URL}/auth/smart/callback`;
      const scope = 'launch patient/*.read observation/*.read careplan/*.read appointment/*.read medicationrequest/*.read condition/*.read';
      
      const launchUrl = `${iss}/auth/authorize?` +
        `response_type=code&` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `launch=${launch}&` +
        `state=${Math.random().toString(36).substring(7)}`;

      res.json({
        success: true,
        data: {
          launchUrl,
          clientId,
          scope
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/smart/callback:
 *   get:
 *     summary: Handle SMART on FHIR callback
 *     tags: [Authentication]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Authentication successful
 */
router.get('/smart/callback',
  async (req, res, next) => {
    try {
      const { code, state } = req.query;
      
      if (!code) {
        return res.status(400).json({
          success: false,
          error: 'Authorization code required'
        });
      }

      // Exchange code for tokens
      const fhirServerUrl = process.env.FHIR_SERVER_URL;
      const issuer = await Issuer.discover(`${fhirServerUrl}/.well-known/openid_configuration`);
      
      const client = new issuer.Client({
        client_id: process.env.SMART_CLIENT_ID,
        client_secret: process.env.SMART_CLIENT_SECRET,
        redirect_uris: [`${process.env.BASE_URL}/auth/smart/callback`],
        response_types: ['code']
      });

      const tokenSet = await client.callback(
        `${process.env.BASE_URL}/auth/smart/callback`,
        { code, state },
        { state }
      );

      // Extract user information
      const userInfo = {
        id: tokenSet.claims.sub,
        name: tokenSet.claims.name,
        email: tokenSet.claims.email,
        role: tokenSet.claims.role || 'patient',
        fhirPatientId: tokenSet.claims.fhir_patient_id,
        scopes: tokenSet.claims.scope?.split(' ') || []
      };

      // Generate JWT token
      const jwtToken = jwt.sign(
        userInfo,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          user: userInfo,
          token: jwtToken,
          accessToken: tokenSet.access_token,
          refreshToken: tokenSet.refresh_token
        }
      });
    } catch (error) {
      logger.error('SMART callback error:', error);
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with username and password
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/login',
  [
    body('username').isString().notEmpty(),
    body('password').isString().notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, password } = req.body;

      // In a real application, you would validate against a database
      // For demo purposes, we'll use a mock user
      const mockUser = {
        id: '1',
        username: 'demo',
        password: '$2a$10$example.hash',
        name: 'Demo User',
        email: 'demo@carelink.com',
        role: 'patient',
        fhirPatientId: 'example-patient-123'
      };

      if (username !== mockUser.username) {
        return res.status(401).json({
          success: false,
          error: 'Invalid credentials'
        });
      }

      // In production, you would verify the password hash
      // const isValidPassword = await bcrypt.compare(password, mockUser.password);
      // if (!isValidPassword) {
      //   return res.status(401).json({
      //     success: false,
      //     error: 'Invalid credentials'
      //   });
      // }

      // Generate JWT token
      const token = jwt.sign(
        {
          id: mockUser.id,
          username: mockUser.username,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          fhirPatientId: mockUser.fhirPatientId
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          user: {
            id: mockUser.id,
            username: mockUser.username,
            name: mockUser.name,
            email: mockUser.email,
            role: mockUser.role,
            fhirPatientId: mockUser.fhirPatientId
          },
          token
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 */
router.post('/register',
  [
    body('username').isString().isLength({ min: 3 }),
    body('email').isEmail(),
    body('password').isString().isLength({ min: 6 }),
    body('name').isString().notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { username, email, password, name } = req.body;

      // Hash password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // In a real application, you would save to database
      // For demo purposes, we'll just return success
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        name,
        role: 'patient',
        fhirPatientId: `patient-${Date.now()}`
      };

      res.status(201).json({
        success: true,
        data: {
          user: newUser,
          message: 'User registered successfully'
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh JWT token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 */
router.post('/refresh',
  [
    body('refreshToken').isString().notEmpty()
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: errors.array()
        });
      }

      const { refreshToken } = req.body;

      // In a real application, you would validate the refresh token
      // and get user information from it
      // For demo purposes, we'll generate a new token

      const newToken = jwt.sign(
        {
          id: '1',
          username: 'demo',
          name: 'Demo User',
          email: 'demo@carelink.com',
          role: 'patient',
          fhirPatientId: 'example-patient-123'
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token: newToken
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 */
router.get('/me',
  async (req, res, next) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          error: 'No token provided'
        });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      res.json({
        success: true,
        data: {
          user: decoded
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 