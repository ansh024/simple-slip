/**
 * CONFIGURATION MODULE
 * 
 * This module centralizes all configuration management for the application.
 * It loads environment variables from .env and validates that required values are present.
 * This prevents runtime errors due to missing configuration.
 * 
 * All environment variables should be accessed through this module rather than process.env directly.
 */

const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

/**
 * Get a required configuration value
 * Throws an error if the value is missing
 * 
 * @param {string} key - The environment variable name
 * @param {string} description - Human-readable description of the variable
 * @returns {string} The environment variable value
 */
const required = (key, description) => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key} (${description})`);
  }
  return value;
};

/**
 * Get an optional configuration value with a default
 * 
 * @param {string} key - The environment variable name
 * @param {any} defaultValue - The default value if the environment variable is not set
 * @returns {any} The environment variable value or the default
 */
const optional = (key, defaultValue) => {
  const value = process.env[key];
  return value !== undefined ? value : defaultValue;
};

// Export all configuration values
module.exports = {
  // Server configuration
  server: {
    port: optional('PORT', 5001),
    nodeEnv: optional('NODE_ENV', 'development'),
    frontendUrl: optional('FRONTEND_URL', 'http://localhost:3000')
  },

  // Supabase configuration
  supabase: {
    url: required('SUPABASE_URL', 'Supabase project DB URL (postgresql://...)'), // For pg Pool
    projectUrl: required('SUPABASE_PROJECT_URL', 'Supabase project HTTP URL (https://...)'), // For Supabase JS client
    anonKey: required('SUPABASE_ANON_KEY', 'Supabase anonymous API key'),
    serviceKey: required('SUPABASE_SERVICE_ROLE_KEY', 'Supabase service role key')
  },

  // JWT configuration
  jwt: {
    secret: required('JWT_SECRET', 'Secret key for JWT signing'),
    expiresIn: optional('JWT_EXPIRE', '7d')
  },

  // API keys
  api: {
    key: optional('API_KEY', 'your_api_key_here')
  },

  // Google Cloud configuration (for future implementation)
  google: {
    projectId: optional('GOOGLE_PROJECT_ID', ''),
    credentials: optional('GOOGLE_APPLICATION_CREDENTIALS', '')
  },

  // Twilio configuration (for future implementation)
  twilio: {
    accountSid: optional('TWILIO_ACCOUNT_SID', ''),
    authToken: optional('TWILIO_AUTH_TOKEN', ''),
    whatsappNumber: optional('TWILIO_WHATSAPP_NUMBER', '')
  }
};
