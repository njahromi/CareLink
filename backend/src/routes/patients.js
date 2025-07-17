const express = require('express');
const { param, query } = require('express-validator');
const { authenticateToken, authorizeRole } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/patients:
 *   get:
 *     summary: Get all patients (admin only)
 *     tags: [Patients]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 */
router.get('/',
  authenticateToken,
  authorizeRole('admin', 'provider'),
  async (req, res, next) => {
    try {
      // Mock patient data - in real app, this would come from database
      const patients = [
        {
          id: '1',
          name: 'John Doe',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          dateOfBirth: '1985-03-15',
          gender: 'male',
          address: '123 Main St, Anytown, USA',
          emergencyContact: {
            name: 'Jane Doe',
            relationship: 'Spouse',
            phone: '+1-555-0124'
          }
        },
        {
          id: '2',
          name: 'Jane Smith',
          email: 'jane.smith@example.com',
          phone: '+1-555-0125',
          dateOfBirth: '1990-07-22',
          gender: 'female',
          address: '456 Oak Ave, Somewhere, USA',
          emergencyContact: {
            name: 'Bob Smith',
            relationship: 'Brother',
            phone: '+1-555-0126'
          }
        }
      ];

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
 * /api/patients/{id}:
 *   get:
 *     summary: Get patient by ID
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 */
router.get('/:id',
  authenticateToken,
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Mock patient data
      const patient = {
        id,
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-555-0123',
        dateOfBirth: '1985-03-15',
        gender: 'male',
        address: '123 Main St, Anytown, USA',
        emergencyContact: {
          name: 'Jane Doe',
          relationship: 'Spouse',
          phone: '+1-555-0124'
        },
        medicalHistory: [
          {
            condition: 'Hypertension',
            diagnosedDate: '2020-01-15',
            status: 'Active'
          },
          {
            condition: 'Type 2 Diabetes',
            diagnosedDate: '2019-06-20',
            status: 'Controlled'
          }
        ],
        allergies: [
          {
            allergen: 'Penicillin',
            severity: 'Severe',
            reaction: 'Anaphylaxis'
          }
        ]
      };

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
 * /api/patients/{id}/vitals:
 *   get:
 *     summary: Get patient vital signs
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *         description: Time period (e.g., 7d, 30d, 90d)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vital signs retrieved successfully
 */
router.get('/:id/vitals',
  authenticateToken,
  param('id').isString().notEmpty(),
  query('period').optional().isString(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { period = '7d' } = req.query;

      // Mock vital signs data
      const vitals = {
        bloodPressure: [
          { systolic: 120, diastolic: 80, date: '2024-01-15T10:30:00Z' },
          { systolic: 118, diastolic: 78, date: '2024-01-14T09:15:00Z' },
          { systolic: 125, diastolic: 82, date: '2024-01-13T14:20:00Z' }
        ],
        heartRate: [
          { value: 72, date: '2024-01-15T10:30:00Z' },
          { value: 68, date: '2024-01-14T09:15:00Z' },
          { value: 75, date: '2024-01-13T14:20:00Z' }
        ],
        temperature: [
          { value: 98.6, date: '2024-01-15T10:30:00Z' },
          { value: 98.4, date: '2024-01-14T09:15:00Z' },
          { value: 98.8, date: '2024-01-13T14:20:00Z' }
        ],
        weight: [
          { value: 175, unit: 'lbs', date: '2024-01-15T10:30:00Z' },
          { value: 174, unit: 'lbs', date: '2024-01-14T09:15:00Z' },
          { value: 176, unit: 'lbs', date: '2024-01-13T14:20:00Z' }
        ]
      };

      res.json({
        success: true,
        data: {
          patientId: id,
          period,
          vitals
        }
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/patients/{id}/appointments:
 *   get:
 *     summary: Get patient appointments
 *     tags: [Patients]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/:id/appointments',
  authenticateToken,
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { id } = req.params;

      // Mock appointments data
      const appointments = [
        {
          id: '1',
          patientId: id,
          provider: 'Dr. Sarah Johnson',
          type: 'Follow-up',
          date: '2024-01-20T14:00:00Z',
          duration: 30,
          status: 'Scheduled',
          notes: 'Routine check-up'
        },
        {
          id: '2',
          patientId: id,
          provider: 'Dr. Michael Chen',
          type: 'Specialist Consultation',
          date: '2024-01-25T10:00:00Z',
          duration: 60,
          status: 'Scheduled',
          notes: 'Cardiology consultation'
        }
      ];

      res.json({
        success: true,
        data: appointments
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 