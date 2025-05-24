/**
 * VOICE ROUTES
 * 
 * This module defines all routes related to voice processing:
 * - Processing voice inputs to extract slip data
 * - Providing supported languages for voice recognition
 * 
 * These routes use the voiceController to handle business logic.
 */

const express = require('express');
const { protect } = require('../middleware/auth');
const { validateBody } = require('../utils/validator');
const voiceController = require('../controllers/voiceController');

const router = express.Router();

/**
 * @route   POST /api/voice/process
 * @desc    Process voice input and extract slip data
 * @access  Private
 */
router.post(
  '/process', 
  protect, 
  validateBody(['audioData']), 
  voiceController.processVoice
);

/**
 * @route   GET /api/voice/languages
 * @desc    Get supported languages for voice recognition
 * @access  Public
 */
router.get(
  '/languages', 
  voiceController.getSupportedLanguages
);

module.exports = router;
