/**
 * SIMPLE SLIP BACKEND SERVER
 * 
 * This is the main entry point for the Simple Slip backend application.
 * It sets up an Express.js server that handles all API requests for the kirana shop management system.
 * 
 * The server provides endpoints for:
 * - User authentication (login/register)
 * - Creating and managing sales slips
 * - Managing product prices
 * - Processing voice inputs
 * - WhatsApp integration
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config'); // Path is correct and matches directory name
const { globalErrorHandler } = require('./utils/errorHandler'); // Path is correct and matches file name

// Create an Express application instance
const app = express();

// MIDDLEWARE SETUP
// Middleware are functions that run between receiving a request and sending a response

// Enable CORS (Cross-Origin Resource Sharing)
// This allows our API to be called from web browsers running on different domains
// Without this, a frontend on localhost:3000 couldn't call our API on localhost:5001
app.use(cors());

// Parse JSON request bodies
// This allows us to access JSON data sent in POST/PUT requests via req.body
app.use(express.json());

// Parse URL-encoded request bodies (form submissions)
// extended: true allows for rich objects and arrays to be encoded
app.use(express.urlencoded({ extended: true }));

// Serve static files from the 'public' directory
// This means any file in ./public can be accessed directly via URL
// e.g., /index.html serves ./public/index.html
app.use(express.static(path.join(__dirname, 'public')));

// API ROUTES
// Each route module handles a specific feature of the application
// The first parameter is the base path, the second is the router module

// Authentication routes - handles user login, registration, and session management
app.use('/api/auth', require('./routes/auth'));

// Slip management routes - handles creating, viewing, and managing sales slips
app.use('/api/slips', require('./routes/slips'));

// Price management routes - handles product pricing and product catalog
app.use('/api/prices', require('./routes/prices'));

// Voice processing routes - handles voice-to-text conversion for slip creation
app.use('/api/voice', require('./routes/voice'));

// WhatsApp integration routes - handles sending/receiving WhatsApp messages
app.use('/api/whatsapp', require('./routes/whatsapp'));

// HEALTH CHECK ENDPOINT
// This endpoint is used to verify the server is running properly
// Monitoring tools and load balancers often use this to check server health
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv
  });
});

// CATCH-ALL ROUTE
// This serves the index.html file for any route that doesn't match the above
// This is useful for Single Page Applications (SPAs) where the frontend handles routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// GLOBAL ERROR HANDLER
// This middleware catches any errors that occur in the application
// It must be defined after all other routes and middleware
app.use(globalErrorHandler);

// SERVER STARTUP
// Get the port from environment variables or use 5001 as default
// Using environment variables allows easy configuration without code changes
// Get the port from environment variables (Cloud Run provides PORT=8080) or use config/server port as fallback
const PORT = process.env.PORT || config.server.port || 8080;

// Start the server and listen for incoming requests
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${config.server.nodeEnv}`);
  console.log(`Supabase URL: ${config.supabase.url}`);
});
