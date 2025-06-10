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
const multer = require('multer');
const voiceController = require('../controllers/voiceController');

const router = express.Router();

// Ensure uploads directory exists with proper permissions
const fs = require('fs');
const path = require('path');

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log(`Created upload directory: ${uploadDir}`);
}

// Configure multer with improved options
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname) || '.webm';
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  fileFilter: (req, file, cb) => {
    // Accept audio files
    if (file.mimetype.startsWith('audio/')) {
      cb(null, true);
    } else {
      cb(new Error('Only audio files are allowed'));
    }
  }
});

/**
 * @route   POST /api/voice/process
 * @desc    Process voice input and extract slip data
 * @access  Private
 */
router.post(
  '/process', 
  protect, 
  upload.single('audio'),
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
