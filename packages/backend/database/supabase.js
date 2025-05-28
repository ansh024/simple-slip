/**
 * SUPABASE DATABASE CONNECTION MODULE
 * 
 * This module creates and exports a Supabase client that connects to your Supabase project.
 * Supabase is an open-source Firebase alternative that provides:
 * - PostgreSQL database
 * - Authentication
 * - Storage
 * - Realtime subscriptions
 * - Functions
 * 
 * We use Supabase in this app to store and retrieve:
 * - Products and prices
 * - Sales slips and their line items
 * - User authentication data
 * 
 * HOW IT WORKS:
 * 1. We create a Supabase client using the URL and API key from environment variables
 * 2. We export this client to be used in various parts of the application
 * 3. Other modules can import this client and use it to make database queries
 */

// Import the Supabase JavaScript client library
const { createClient } = require('@supabase/supabase-js');
const config = require('../config');
const { handleDatabaseError } = require('../utils/errorHandler');

// Create a Supabase client instance with service role key for admin operations
const supabase = createClient(config.supabase.projectUrl, config.supabase.serviceKey);

// Create a Supabase client instance with anon key for public operations
const supabaseAnon = createClient(config.supabase.projectUrl, config.supabase.anonKey);

// Log connection status for debugging purposes
console.log('Supabase client initialized');

// Export the Supabase client and helper functions for use in other modules
module.exports = {
  supabase,
  supabaseAnon,
  handleDatabaseError
};
