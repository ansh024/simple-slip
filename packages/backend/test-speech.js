// test-speech.js
const fs = require('fs');
const path = require('path');
const { SpeechClient } = require('@google-cloud/speech');

// The path to your Google Cloud credentials JSON file
const CREDENTIALS_PATH = path.join(__dirname, 'gcp/key.json');

async function testV1Api() {
  console.log('--------------------------------');
  console.log('TESTING SPEECH-TO-TEXT API V1...');
  console.log('--------------------------------');

  try {
    console.log('Loading credentials from:', CREDENTIALS_PATH);
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found at ${CREDENTIALS_PATH}`);
    }
    
    // Create client with explicit credentials
    const client = new SpeechClient({
      keyFilename: CREDENTIALS_PATH
    });
    console.log('Successfully created Speech client with credentials');
    
    // Read the audio file (sample.wav)
    const wavFilePath = path.join(__dirname, 'sample.wav');
    const b64FilePath = path.join(__dirname, 'sample.b64');
    
    let audioContent;
    if (fs.existsSync(wavFilePath)) {
      audioContent = fs.readFileSync(wavFilePath).toString('base64');
      console.log(`Read audio from WAV file: ${wavFilePath} (${audioContent.length} bytes)`);
    } else if (fs.existsSync(b64FilePath)) {
      audioContent = fs.readFileSync(b64FilePath, 'utf8');
      console.log(`Read audio from B64 file: ${b64FilePath} (${audioContent.length} bytes)`);
    } else {
      throw new Error('Neither sample.wav nor sample.b64 found');
    }
    
    // V1 API request - FIXED: Updated sample rate to 48000
    console.log('Sending request to Speech-to-Text V1 API...');
    const [response] = await client.recognize({
      config: {
        encoding: 'LINEAR16',
        sampleRateHertz: 48000, // FIXED: Changed from 16000 to 48000 to match WAV header
        languageCode: 'en-US',
      },
      audio: { content: audioContent },
    });
    
    // Print results
    console.log('V1 API Response:');
    console.log(JSON.stringify(response, null, 2));
    
    const transcription = response.results
      .map(result => result.alternatives[0].transcript)
      .join('\n');
    console.log('V1 API Transcription:', transcription);
    
    return true;
  } catch (error) {
    console.error('V1 API ERROR:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.code) console.error('Code:', error.code);
    if (error.metadata) console.error('Metadata:', error.metadata);
    return false;
  }
}

async function testV2Api() {
  console.log('--------------------------------');
  console.log('TESTING SPEECH-TO-TEXT API V2...');
  console.log('--------------------------------');
  
  try {
    console.log('Loading credentials from:', CREDENTIALS_PATH);
    if (!fs.existsSync(CREDENTIALS_PATH)) {
      throw new Error(`Credentials file not found at ${CREDENTIALS_PATH}`);
    }
    
    // Create client with explicit credentials
    const client = new SpeechClient({
      keyFilename: CREDENTIALS_PATH
    });
    console.log('Successfully created Speech client with credentials');
    
    // Read the audio file (sample.wav or sample.b64)
    const wavFilePath = path.join(__dirname, 'sample.wav');
    const b64FilePath = path.join(__dirname, 'sample.b64');
    
    let audioContent;
    if (fs.existsSync(wavFilePath)) {
      audioContent = fs.readFileSync(wavFilePath).toString('base64');
      console.log(`Read audio from WAV file: ${wavFilePath} (${audioContent.length} bytes)`);
    } else if (fs.existsSync(b64FilePath)) {
      audioContent = fs.readFileSync(b64FilePath, 'utf8');
      console.log(`Read audio from B64 file: ${b64FilePath} (${audioContent.length} bytes)`);
    } else {
      throw new Error('Neither sample.wav nor sample.b64 found');
    }
    
    // V2 API request - FIXED: proper V2 API format
    console.log('Sending request to Speech-to-Text V2 API...');
    
    // Option 1: Using speech.v2.SpeechClient (proper V2 API)
    try {
      console.log('Attempting V2 API with proper format...');
      const projectId = require('./gcp/key.json').project_id;
      const recognizerId = "_"; // Default recognizer
      const location = "global";
      
      const recognizerPath = `projects/${projectId}/locations/${location}/recognizers/${recognizerId}`;
      console.log('Using recognizer path:', recognizerPath);
      
      const request = {
        recognizer: recognizerPath,
        content: audioContent,
      };
      
      const [response] = await client.recognize(request);
      
      // Print results
      console.log('V2 API Response:');
      console.log(JSON.stringify(response, null, 2));
      
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log('V2 API Transcription:', transcription);
      
      return true;
    } catch (error) {
      console.error('V2 API Attempt 1 ERROR:');
      console.error('Message:', error.message);
      console.error('Code:', error.code);
      
      // Fallback to alternative V2 format
      console.log('\nFalling back to alternative V2 format...');
      
      const [response] = await client.recognize({
        name: "projects/simple-slip/locations/global/recognizers/_", // FIXED: using 'name' instead of 'recognizer'
        config: {
          autoDecodingConfig: {},
        },
        audio: { content: audioContent }, // FIXED: added audio object
      });
      
      // Print results
      console.log('V2 API Response (fallback):');
      console.log(JSON.stringify(response, null, 2));
      
      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join('\n');
      console.log('V2 API Transcription:', transcription);
      
      return true;
    }
  } catch (error) {
    console.error('V2 API ERROR:');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    if (error.details) console.error('Details:', error.details);
    if (error.code) console.error('Code:', error.code);
    if (error.metadata) console.error('Metadata:', error.metadata);
    return false;
  }
}

// Run both tests
async function runTests() {
  console.log('=========================================');
  console.log('GOOGLE CLOUD SPEECH-TO-TEXT API TEST');
  console.log('=========================================');
  console.log('Project ID:', require('./gcp/key.json').project_id);
  console.log('Service Account:', require('./gcp/key.json').client_email);
  console.log('=========================================\n');
  
  const v1Success = await testV1Api();
  console.log('\n');
  const v2Success = await testV2Api();
  
  console.log('\n=========================================');
  console.log('TEST RESULTS:');
  console.log('V1 API Test:', v1Success ? 'SUCCESS ✅' : 'FAILED ❌');
  console.log('V2 API Test:', v2Success ? 'SUCCESS ✅' : 'FAILED ❌');
  console.log('=========================================');
}

runTests();