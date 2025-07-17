const express = require('express');
const { body, query, param } = require('express-validator');
const { authenticateSMART, requirePatientContext, requireScope } = require('../middleware/auth');
const fhirService = require('../services/fhirService');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/fhir/patients/{patientId}:
 *   get:
 *     summary: Get patient information
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *         description: Patient ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Patient not found
 */
router.get('/patients/:patientId',
  authenticateSMART,
  requireScope('patient/*.read'),
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const patient = await fhirService.getPatient(patientId);
      
      res.json({
        success: true,
        data: patient
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/{patientId}/observations:
 *   get:
 *     summary: Get patient observations (vital signs)
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Observation category (e.g., vital-signs)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Observations retrieved successfully
 */
router.get('/patients/:patientId/observations',
  authenticateSMART,
  requireScope('observation/*.read'),
  param('patientId').isString().notEmpty(),
  query('category').optional().isString(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const { category } = req.query;
      
      const observations = await fhirService.getPatientObservations(patientId, category);
      const formattedVitals = fhirService.formatVitalSigns(observations);
      
      res.json({
        success: true,
        data: {
          observations,
          vitals: formattedVitals
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/{patientId}/care-plans:
 *   get:
 *     summary: Get patient care plans
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Care plans retrieved successfully
 */
router.get('/patients/:patientId/care-plans',
  authenticateSMART,
  requireScope('careplan/*.read'),
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const carePlans = await fhirService.getPatientCarePlans(patientId);
      const formattedPlans = fhirService.formatCarePlans(carePlans);
      
      res.json({
        success: true,
        data: {
          carePlans,
          formattedPlans
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/{patientId}/appointments:
 *   get:
 *     summary: Get patient appointments
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/patients/:patientId/appointments',
  authenticateSMART,
  requireScope('appointment/*.read'),
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const appointments = await fhirService.getPatientAppointments(patientId);
      
      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/{patientId}/medications:
 *   get:
 *     summary: Get patient medications
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Medications retrieved successfully
 */
router.get('/patients/:patientId/medications',
  authenticateSMART,
  requireScope('medicationrequest/*.read'),
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const medications = await fhirService.getPatientMedications(patientId);
      
      res.json({
        success: true,
        data: medications
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/{patientId}/conditions:
 *   get:
 *     summary: Get patient conditions (diagnoses)
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: patientId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Conditions retrieved successfully
 */
router.get('/patients/:patientId/conditions',
  authenticateSMART,
  requireScope('condition/*.read'),
  param('patientId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { patientId } = req.params;
      const conditions = await fhirService.getPatientConditions(patientId);
      
      res.json({
        success: true,
        data: conditions
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/patients/search:
 *   get:
 *     summary: Search for patients
 *     tags: [FHIR]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *       - in: query
 *         name: identifier
 *         schema:
 *           type: string
 *       - in: query
 *         name: birthdate
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient search completed successfully
 */
router.get('/patients/search',
  authenticateSMART,
  requireScope('patient/*.read'),
  async (req, res, next) => {
    try {
      const searchParams = {
        name: req.query.name,
        identifier: req.query.identifier,
        birthdate: req.query.birthdate
      };
      
      const patients = await fhirService.searchPatients(searchParams);
      
      res.json({
        success: true,
        data: patients
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/observations:
 *   post:
 *     summary: Create a new observation (vital sign)
 *     tags: [FHIR]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               subject:
 *                 type: object
 *               code:
 *                 type: object
 *               valueQuantity:
 *                 type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Observation created successfully
 */
router.post('/observations',
  authenticateSMART,
  requireScope('observation/*.write'),
  body('subject').isObject(),
  body('code').isObject(),
  body('valueQuantity').isObject(),
  async (req, res, next) => {
    try {
      const observationData = {
        resourceType: 'Observation',
        status: 'final',
        ...req.body,
        effectiveDateTime: new Date().toISOString()
      };
      
      const observation = await fhirService.createObservation(observationData);
      
      res.status(201).json({
        success: true,
        data: observation
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/care-plans/{carePlanId}:
 *   put:
 *     summary: Update a care plan
 *     tags: [FHIR]
 *     parameters:
 *       - in: path
 *         name: carePlanId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Care plan updated successfully
 */
router.put('/care-plans/:carePlanId',
  authenticateSMART,
  requireScope('careplan/*.write'),
  param('carePlanId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { carePlanId } = req.params;
      const carePlan = await fhirService.updateCarePlan(carePlanId, req.body);
      
      res.json({
        success: true,
        data: carePlan
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/fhir/capabilities:
 *   get:
 *     summary: Get FHIR server capabilities
 *     tags: [FHIR]
 *     responses:
 *       200:
 *         description: Server capabilities retrieved successfully
 */
router.get('/capabilities',
  async (req, res, next) => {
    try {
      const capabilities = await fhirService.getCapabilities();
      
      res.json({
        success: true,
        data: capabilities
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 