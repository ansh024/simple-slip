/**
 * VOICE CONTROLLER
 * 
 * This controller handles all voice processing functionality:
 * - Processing voice inputs to extract slip data
 * - Providing supported languages for voice recognition
 * 
 * CURRENT IMPLEMENTATION:
 * The current version uses mock responses for development and testing.
 * It's designed to be easily replaced with actual Google Speech-to-Text API integration.
 */

const { catchAsync, AppError } = require('../utils/errorHandler');

/**
 * @desc    Process voice input and extract slip data
 * @route   POST /api/voice/process
 * @access  Private
 */
exports.processVoice = catchAsync(async (req, res) => {
  // Extract request data
  const { audioData, language = 'hi', shopId } = req.body;
  
  // Validate input
  if (!audioData) {
    throw new AppError('Audio data is required', 400);
  }
  
  // MOCK IMPLEMENTATION
  // In the future, this will be replaced with actual Google Speech-to-Text API
  // The mock simulates the processing of Hindi voice input for a vegetable shop
  
  // 1. Simulate speech-to-text conversion
  const transcript = "5 किलो आलू 40 रुपये किलो, 2 किलो प्याज 30 रुपये किलो";
  
  // 2. Simulate data extraction from transcript
  const extractedData = {
    customerName: "राज कुमार",
    items: [
      {
        name: "आलू",
        qty: 5,
        unit: "किलो",
        rate: 40
      },
      {
        name: "प्याज",
        qty: 2,
        unit: "किलो",
        rate: 30
      }
    ]
  };
  
  // 3. Return the processed data
  res.json({
    success: true,
    transcript,
    extractedData
  });
});

/**
 * @desc    Get supported languages for voice recognition
 * @route   GET /api/voice/languages
 * @access  Public
 */
exports.getSupportedLanguages = catchAsync(async (req, res) => {
  // List of supported languages for voice recognition
  // This is a static list for now, but could be fetched from Google Cloud in the future
  const languages = [
    { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
    { code: "en", name: "English", nativeName: "English" },
    { code: "mr", name: "Marathi", nativeName: "मराठी" },
    { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી" },
    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },
    { code: "pa", name: "Punjabi", nativeName: "ਪੰਜਾਬੀ" },
    { code: "bn", name: "Bengali", nativeName: "বাংলা" }
  ];
  
  res.json({
    success: true,
    languages
  });
});
