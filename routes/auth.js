/**
 * AUTHENTICATION ROUTES
 * 
 * This module defines all routes related to user authentication:
 * - User registration
 * - User login
 * - Simple login (for testing)
 * 
 * These routes use the authController to handle business logic.
 */

const express = require('express');
const { validateBody } = require('../utils/validator');
const authController = require('../controllers/authController');

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register', 
  validateBody(['name', 'phone', 'password']), 
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login', 
  validateBody(['phone', 'password']), 
  authController.login
);

/**
 * @route   POST /api/auth/simple-login
 * @desc    Simple login for testing (bypasses password check)
 * @access  Public
 */
router.post(
  '/simple-login', 
  validateBody(['phone']), 
  authController.simpleLogin
);

module.exports = router;
