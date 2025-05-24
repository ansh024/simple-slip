/**
 * WHATSAPP ROUTES
 * 
 * This module defines all routes related to WhatsApp integration:
 * - Processing webhook requests from Twilio
 * - Sending WhatsApp messages
 * - Generating and sending daily sales summaries
 * 
 * These routes use the whatsappController to handle business logic.
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../utils/validator');
const whatsappController = require('../controllers/whatsappController');

const router = express.Router();

/**
 * @route   POST /api/whatsapp/webhook
 * @desc    Handle incoming WhatsApp messages (webhook)
 * @access  Public
 */
router.post(
  '/webhook', 
  whatsappController.webhookHandler
);

/**
 * @route   POST /api/whatsapp/send
 * @desc    Send a WhatsApp message
 * @access  Private
 */
router.post(
  '/send', 
  protect, 
  validateBody(['to', 'message']), 
  whatsappController.sendMessage
);

/**
 * @route   POST /api/whatsapp/daily-summary
 * @desc    Generate and send daily sales summary
 * @access  Private
 */
router.post(
  '/daily-summary', 
  protect, 
  whatsappController.sendDailySummary
);

module.exports = router;
