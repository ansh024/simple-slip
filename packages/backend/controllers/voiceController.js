/**
 * VOICE CONTROLLER
 * 
 * This controller handles all voice processing functionality:
 * - Processing voice inputs to extract slip data
 * - Providing supported languages for voice recognition
 * - Tracking voice recognition accuracy metrics
 * 
 * CURRENT IMPLEMENTATION:
 * The current version uses Google Cloud Speech-to-Text API for speech recognition
 * and tracks detailed metrics for accuracy analysis.
 */

const { catchAsync, AppError } = require('../utils/errorHandler');
const fs = require('fs');
const path = require('path');
const { pool } = require('../database/db');


/**
 * @desc    Process voice input and extract slip data with basic analytics
 * @route   POST /api/voice/process
 * @access  Private
 */
exports.processVoice = catchAsync(async (req, res) => {
  console.log('Voice processing request received');
  
  // Track basic performance metrics
  const startTime = Date.now();
  
  try {
    // Extract request data
    const { language = 'hi-IN', shopId } = req.body;
    console.log('Request body:', { language, shopId });
    console.log('File info:', req.file || 'No file attached');
    
    // Validate input
    if (!req.file) {
      throw new AppError('Audio file is required', 400);
    }
    
    // Get file details for logging
    const filePath = req.file.path;
    const fileExt = path.extname(filePath).toLowerCase();
    const fileStats = fs.statSync(filePath);
    
    console.log(`Processing audio file: ${filePath}`);
    console.log(`Original filename: ${req.file.originalname}, size: ${fileStats.size} bytes, format: ${fileExt}`);
    
    // Check if file exists and is accessible
    if (!fs.existsSync(filePath)) {
      throw new AppError(`Audio file not found at ${filePath}`, 404);
    }
    
    if (fileStats.size === 0) {
      throw new AppError('Audio file is empty', 400);
    }
    
    // Get speech service and transcribe audio
    const speechService = require('../utils/speechService');
    console.log('Transcribing audio with language:', language);
    
    // Process audio with GCP Speech API
    const transcript = await speechService.transcribeAudio(filePath, language);
    
    // Log transcript details
    const wordCount = transcript ? transcript.split(/\s+/).length : 0;
    console.log(`Transcription result: ${transcript ? transcript.length : 0} chars, ${wordCount} words`);
    
    // If transcript is empty, return early
    if (!transcript || transcript.trim() === '') {
      console.log('Empty transcript returned');
      
      // Return response to client
      return res.json({ 
        success: true, 
        transcript: '',
        items: [],
        message: 'No speech detected in the audio file',
        processingTime: Date.now() - startTime
      });
    }
    
    // Begin extraction with improved patterns for better accuracy
    console.log('Extracting items from transcript...');
    const itemPatterns = [
      // Pattern 1: {qty} {unit} {name} {rate} - standard format
      { 
        regex: /(\d+(?:\.\d+)?)\s*(किलो|kg|किलोग्राम|kilo|gram|ग्राम)\s*([^,\d]+?)\s*(\d+(?:\.\d+)?)/g,
        mapper: match => ({
          name: match[3].trim(),
          qty: parseFloat(match[1]),
          unit: match[2],
          rate: parseFloat(match[4])
        })
      },
      // Pattern 2: {name} {qty} {unit} at {rate} - conversational format
      { 
        regex: /([^\d,]+)\s*(\d+(?:\.\d+)?)\s*(किलो|kg|किलोग्राम|kilo|gram|ग्राम)(?:\s*(?:at|@|रुपये|Rs\.?|₹))?\s*(\d+(?:\.\d+)?)/gi,
        mapper: match => ({
          name: match[1].trim(),
          qty: parseFloat(match[2]),
          unit: match[3].trim(),
          rate: parseFloat(match[4])
        })
      }
    ];
    
    const items = [];
    let unrecognizedText = transcript;
    
    // Try each pattern to extract items
    for (const pattern of itemPatterns) {
      let match;
      
      while ((match = pattern.regex.exec(transcript))) {
        const item = pattern.mapper(match);
        console.log('Extracted item:', item);
        
        // Track what was recognized and remove from unrecognized text
        const matchedText = match[0];
        unrecognizedText = unrecognizedText.replace(matchedText, '');
        
        items.push(item);
      }
    }
    
    // Store statistics about items found
    const stats = {
      itemsIdentified: items.length,
      unrecognizedText: unrecognizedText.trim().length > 0 ? unrecognizedText.trim() : null
    };
    
    // Clean up temp file safely
    try {
      fs.unlinkSync(filePath);
      console.log(`Deleted temp file: ${filePath}`);
    } catch (unlinkError) {
      console.error('Error deleting temp file:', unlinkError);
      // Non-critical error, continue with response
    }
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    console.log(`Voice processing complete. Found ${items.length} items in ${processingTime}ms.`);
    
    // Return the extracted items along with statistics
    res.json({ 
      success: true, 
      transcript, 
      items,
      message: items.length > 0 ? 
        `Successfully identified ${items.length} items from voice input` : 
        'No items could be identified from the voice input',
      stats: {
        processingTime,
        success: items.length > 0,
        wordsRecognized: wordCount,
        unprocessedText: stats.unrecognizedText
      }
    });
  } catch (error) {
    // Log the full error details before passing to error handler
    console.error('Voice processing error:', error);
    
    // Clean up the file if it exists and processing failed
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
        console.log(`Deleted temp file after error: ${req.file.path}`);
      } catch (unlinkError) {
        console.error('Error deleting temp file:', unlinkError);
      }
    }
    
    throw new AppError(error.message || 'Voice processing failed', 500);
  }
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

    { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
    { code: "te", name: "Telugu", nativeName: "తెలుగు" },
    { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
    { code: "ml", name: "Malayalam", nativeName: "മലയാളം" },

    { code: "bn", name: "Bengali", nativeName: "বাংলা" }
  ];
  
  res.json({
    success: true,
    languages
  });
});
