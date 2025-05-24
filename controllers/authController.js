/**
 * AUTHENTICATION CONTROLLER
 * 
 * This controller handles all authentication-related functionality:
 * - User registration
 * - User login
 * - Simple login (for testing)
 * 
 * It uses Supabase for authentication and JWT for token generation.
 */

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabase } = require('../database/supabase');
const config = require('../config');
const { catchAsync, AppError, handleDatabaseError } = require('../utils/errorHandler');

/**
 * Generate a JWT token for a user
 * 
 * @param {Object} user - User object from database
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      phone: user.phone,
      role: user.role,
      shop_id: user.shop_id
    },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
exports.register = catchAsync(async (req, res) => {
  const { name, phone, password, shop_id = 1, role = 'user', language = 'en' } = req.body;
  
  // Check if user already exists
  const { data: existingUser, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (findError && !findError.message.includes('No rows found')) {
    throw handleDatabaseError(findError, 'Check existing user');
  }
  
  if (existingUser) {
    throw new AppError('User already exists with this phone number', 400);
  }
  
  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);
  
  // Create user
  const { data: user, error: createError } = await supabase
    .from('users')
    .insert({
      name,
      phone,
      password: hashedPassword,
      shop_id,
      role,
      language
    })
    .select()
    .single();
  
  if (createError) {
    throw handleDatabaseError(createError, 'Create user');
  }
  
  // Generate token
  const token = generateToken(user);
  
  res.status(201).json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      shop_id: user.shop_id,
      language: user.language
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
exports.login = catchAsync(async (req, res) => {
  const { phone, password } = req.body;
  
  // Check if user exists
  const { data: user, error: findError } = await supabase
    .from('users')
    .select('*')
    .eq('phone', phone)
    .single();
  
  if (findError) {
    throw handleDatabaseError(findError, 'Find user');
  }
  
  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Check password
  const isMatch = await bcrypt.compare(password, user.password);
  
  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }
  
  // Generate token
  const token = generateToken(user);
  
  res.json({
    success: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      shop_id: user.shop_id,
      language: user.language
    }
  });
});

/**
 * @desc    Simple login for testing (bypasses password check)
 * @route   POST /api/auth/simple-login
 * @access  Public
 */
exports.simpleLogin = catchAsync(async (req, res) => {
  const { phone } = req.body;
  
  // For testing, create a mock user
  const mockUser = {
    id: 'mock-user-id',
    phone,
    name: 'Test User',
    role: 'owner',
    shop_id: 1,
    language: 'hi'
  };
  
  // Generate token
  const token = generateToken(mockUser);
  
  res.json({
    success: true,
    token,
    user: mockUser
  });
});
