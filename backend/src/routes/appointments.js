const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     summary: Get all appointments
 *     tags: [Appointments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 */
router.get('/',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Mock appointments data
      const appointments = [
        {
          id: '1',
          patientId: '1',
          patientName: 'John Doe',
          provider: 'Dr. Sarah Johnson',
          type: 'Follow-up',
          date: '2024-01-20T14:00:00Z',
          duration: 30,
          status: 'Scheduled',
          notes: 'Routine check-up'
        },
        {
          id: '2',
          patientId: '1',
          patientName: 'John Doe',
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

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     summary: Create new appointment
 *     tags: [Appointments]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               patientId:
 *                 type: string
 *               provider:
 *                 type: string
 *               type:
 *                 type: string
 *               date:
 *                 type: string
 *               duration:
 *                 type: number
 *               notes:
 *                 type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Appointment created successfully
 */
router.post('/',
  authenticateToken,
  [
    body('patientId').isString().notEmpty(),
    body('provider').isString().notEmpty(),
    body('type').isString().notEmpty(),
    body('date').isISO8601(),
    body('duration').isInt({ min: 15, max: 180 }),
    body('notes').optional().isString()
  ],
  async (req, res, next) => {
    try {
      const appointment = {
        id: Date.now().toString(),
        ...req.body,
        status: 'Scheduled',
        createdAt: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: appointment
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 