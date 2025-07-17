const express = require('express');
const { body, param } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/care-plans:
 *   get:
 *     summary: Get all care plans
 *     tags: [Care Plans]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Care plans retrieved successfully
 */
router.get('/',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Mock care plans data
      const carePlans = [
        {
          id: '1',
          patientId: '1',
          title: 'Diabetes Management Plan',
          description: 'Comprehensive plan for managing Type 2 Diabetes',
          status: 'Active',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          goals: [
            'Maintain blood glucose levels between 80-130 mg/dL',
            'Achieve HbA1c < 7%',
            'Lose 10 pounds in 6 months'
          ],
          activities: [
            {
              type: 'Medication',
              description: 'Metformin 500mg twice daily',
              frequency: 'Daily',
              status: 'Active'
            },
            {
              type: 'Exercise',
              description: '30 minutes of moderate exercise',
              frequency: '5 times per week',
              status: 'Active'
            },
            {
              type: 'Diet',
              description: 'Low-carbohydrate diet',
              frequency: 'Daily',
              status: 'Active'
            }
          ]
        }
      ];

      res.json({
        success: true,
        data: carePlans
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/care-plans/{id}:
 *   get:
 *     summary: Get care plan by ID
 *     tags: [Care Plans]
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
 *         description: Care plan retrieved successfully
 */
router.get('/:id',
  authenticateToken,
  param('id').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Mock care plan data
      const carePlan = {
        id,
        patientId: '1',
        title: 'Diabetes Management Plan',
        description: 'Comprehensive plan for managing Type 2 Diabetes',
        status: 'Active',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        goals: [
          'Maintain blood glucose levels between 80-130 mg/dL',
          'Achieve HbA1c < 7%',
          'Lose 10 pounds in 6 months'
        ],
        activities: [
          {
            type: 'Medication',
            description: 'Metformin 500mg twice daily',
            frequency: 'Daily',
            status: 'Active'
          },
          {
            type: 'Exercise',
            description: '30 minutes of moderate exercise',
            frequency: '5 times per week',
            status: 'Active'
          },
          {
            type: 'Diet',
            description: 'Low-carbohydrate diet',
            frequency: 'Daily',
            status: 'Active'
          }
        ],
        progress: {
          bloodGlucose: 'On track',
          hba1c: 'Needs improvement',
          weightLoss: 'On track'
        }
      };

      res.json({
        success: true,
        data: carePlan
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 