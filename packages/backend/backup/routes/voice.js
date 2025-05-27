const express = require('express');
const multer = require('multer');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Process voice input
router.post('/process', protect, upload.single('audio'), async (req, res) => {
  try {
    const { language = 'hi' } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    // TODO: Integrate with Google Speech-to-Text API
    // For now, return a mock response
    const mockTranscription = {
      text: "दो किलो आटा, एक किलो चीनी, पांच सौ ग्राम नमक",
      items: [
        { name: "आटा", quantity: 2, unit: "kg" },
        { name: "चीनी", quantity: 1, unit: "kg" },
        { name: "नमक", quantity: 0.5, unit: "kg" }
      ],
      confidence: 0.95
    };
    
    res.json({
      success: true,
      transcription: mockTranscription
    });
  } catch (error) {
    console.error('Voice processing error:', error);
    res.status(500).json({ error: 'Failed to process voice input' });
  }
});

// Get supported languages
router.get('/languages', (req, res) => {
  res.json({
    success: true,
    languages: [
      { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
      { code: 'en', name: 'English', nativeName: 'English' },
      { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
      { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
      { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
      { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
      { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
      { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
      { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
      { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' }
    ]
  });
});

module.exports = router;
