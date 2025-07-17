const express = require('express');
const { body, param, query } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * @swagger
 * /api/chat/messages:
 *   get:
 *     summary: Get chat messages
 *     tags: [Chat]
 *     parameters:
 *       - in: query
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: number
 *         description: Number of messages to retrieve
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/messages',
  authenticateToken,
  query('roomId').isString().notEmpty(),
  query('limit').optional().isInt({ min: 1, max: 100 }),
  async (req, res, next) => {
    try {
      const { roomId, limit = 50 } = req.query;

      // Mock chat messages
      const messages = [
        {
          id: '1',
          roomId,
          sender: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            role: 'provider'
          },
          content: 'Hello John, how are you feeling today?',
          timestamp: '2024-01-15T10:30:00Z',
          type: 'text'
        },
        {
          id: '2',
          roomId,
          sender: {
            id: '2',
            name: 'John Doe',
            role: 'patient'
          },
          content: 'Hi Dr. Johnson, I\'m feeling much better. My blood sugar has been stable.',
          timestamp: '2024-01-15T10:32:00Z',
          type: 'text'
        },
        {
          id: '3',
          roomId,
          sender: {
            id: '1',
            name: 'Dr. Sarah Johnson',
            role: 'provider'
          },
          content: 'That\'s great to hear! Have you been following your exercise routine?',
          timestamp: '2024-01-15T10:35:00Z',
          type: 'text'
        }
      ];

      res.json({
        success: true,
        data: messages.slice(0, limit)
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/chat/messages:
 *   post:
 *     summary: Send a new message
 *     tags: [Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               roomId:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 default: text
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Message sent successfully
 */
router.post('/messages',
  authenticateToken,
  [
    body('roomId').isString().notEmpty(),
    body('content').isString().notEmpty(),
    body('type').optional().isIn(['text', 'image', 'file'])
  ],
  async (req, res, next) => {
    try {
      const { roomId, content, type = 'text' } = req.body;
      
      const message = {
        id: Date.now().toString(),
        roomId,
        sender: {
          id: req.user.id,
          name: req.user.name,
          role: req.user.role
        },
        content,
        type,
        timestamp: new Date().toISOString()
      };

      res.status(201).json({
        success: true,
        data: message
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms:
 *   get:
 *     summary: Get chat rooms for current user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat rooms retrieved successfully
 */
router.get('/rooms',
  authenticateToken,
  async (req, res, next) => {
    try {
      // Mock chat rooms
      const rooms = [
        {
          id: 'room-1',
          name: 'Dr. Sarah Johnson',
          type: 'provider',
          lastMessage: {
            content: 'That\'s great to hear! Have you been following your exercise routine?',
            timestamp: '2024-01-15T10:35:00Z',
            sender: 'Dr. Sarah Johnson'
          },
          unreadCount: 0
        },
        {
          id: 'room-2',
          name: 'Dr. Michael Chen',
          type: 'provider',
          lastMessage: {
            content: 'Your cardiology appointment is confirmed for next week.',
            timestamp: '2024-01-14T15:20:00Z',
            sender: 'Dr. Michael Chen'
          },
          unreadCount: 1
        }
      ];

      res.json({
        success: true,
        data: rooms
      });
    } catch (error) {
      next(error);
    }
  }
);

/**
 * @swagger
 * /api/chat/rooms/{roomId}:
 *   get:
 *     summary: Get chat room details
 *     tags: [Chat]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Chat room details retrieved successfully
 */
router.get('/rooms/:roomId',
  authenticateToken,
  param('roomId').isString().notEmpty(),
  async (req, res, next) => {
    try {
      const { roomId } = req.params;

      // Mock room details
      const room = {
        id: roomId,
        name: 'Dr. Sarah Johnson',
        type: 'provider',
        participants: [
          {
            id: '1',
            name: 'Dr. Sarah Johnson',
            role: 'provider',
            avatar: 'https://example.com/avatar1.jpg'
          },
          {
            id: '2',
            name: 'John Doe',
            role: 'patient',
            avatar: 'https://example.com/avatar2.jpg'
          }
        ],
        createdAt: '2024-01-01T00:00:00Z',
        lastActivity: '2024-01-15T10:35:00Z'
      };

      res.json({
        success: true,
        data: room
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router; 