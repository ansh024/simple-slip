/**
 * SPEECH SERVICE
 * Encapsulates Google Cloud Speech-to-Text API interactions.
 */

const path = require('path');
const fs = require('fs');
const { SpeechClient } = require('@google-cloud/speech');

// Use explicit credentials file path if env var not set
const gcpKeyPath = path.resolve(__dirname, '../gcp/key.json');

// Configure client options
const clientOptions = {};

// Check if credentials file exists in the project directory
if (fs.existsSync(gcpKeyPath)) {
  console.log('Using local credentials file:', gcpKeyPath);
  clientOptions.keyFilename = gcpKeyPath;
} else {
  console.warn('WARNING: Local credentials file not found. Using environment variables if available.');
}

const speechClient = new SpeechClient(clientOptions);

/**
 * Transcribes a local audio file using the Google Cloud Speech-to-Text V1 API.
 * @param {string} filePath Path to the audio file.
 * @param {string} languageCode BCP-47 code (e.g., 'hi-IN').
 * @returns {Promise<string>} Transcribed text.
 */
async function transcribeAudio(filePath, languageCode = 'hi-IN') {
  try {
    console.log(`Processing audio file: ${filePath} with language: ${languageCode}`);
    
    // Get file info and validate
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist: ${filePath}`);
    }
    
    const fileExt = path.extname(filePath).toLowerCase();
    const fileStats = fs.statSync(filePath);
    
    if (fileStats.size === 0) {
      throw new Error('File is empty');
    }
    
    console.log(`File: ${path.basename(filePath)}, Size: ${fileStats.size} bytes, Type: ${fileExt}`);
    
    // Read audio file and encode it
    const audioBytes = fs.readFileSync(filePath).toString('base64');
    console.log(`Audio encoded, length: ${audioBytes.length} bytes`);
    
    // Determine audio encoding based on file extension
    let encoding = 'WEBM_OPUS'; // Default for browser recordings
    
    if (fileExt === '.wav') {
      encoding = 'LINEAR16';
    } else if (fileExt === '.mp3') {
      encoding = 'MP3';
    } else if (fileExt === '.flac') {
      encoding = 'FLAC';
    } else if (fileExt === '.ogg') {
      encoding = 'OGG_OPUS';
    } else if (fileExt === '.webm') {
      encoding = 'WEBM_OPUS';
    }
    
    console.log(`Using encoding: ${encoding} for file: ${fileExt}`);
    
    // Create request using V1 API format (we know this works from test-speech.js)
    const request = {
      config: {
        encoding: encoding,
        // Let Google detect sample rate automatically
        languageCode: languageCode,
        enableAutomaticPunctuation: true,
        model: 'default', // or 'command_and_search' for short audio
        useEnhanced: true,
      },
      audio: {
        content: audioBytes
      }
    };
    
    console.log(`Sending request to Google Speech API with language: ${languageCode}`);
    
    // Call V1 recognize API - this is known to work from test-speech.js
    const [response] = await speechClient.recognize(request);
    
    console.log('Speech API response received, extracting transcript...');
    
    // Extract transcript from response
    const transcript = (response.results || [])
      .map(result => result.alternatives?.[0]?.transcript || '')
      .join(' ')
      .trim();
      
    console.log(`Transcript result (${transcript.length} chars): ${transcript || 'EMPTY'}`);
    return transcript;
  } catch (error) {
    console.error('Speech-to-Text API error:', error.message);
    console.error('Error details:', error.details || 'No details');
    console.error('Error code:', error.code || 'Unknown');
    console.error('Error stack:', error.stack);
    throw error;
  }
}

module.exports = { transcribeAudio };
