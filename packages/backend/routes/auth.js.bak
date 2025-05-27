const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { supabaseAnon } = require('../database/supabase');

const router = express.Router();

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id,
      phone: user.phone,
      role: user.role,
      shop_id: user.shop_id
    },
    process.env.JWT_SECRET || 'your_jwt_secret_key',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { name, phone, password, role = 'employee', shopId = 1, language = 'hi' } = req.body;
    
    // Check if user already exists
    const { data: existingUser } = await supabaseAnon
      .from('users')
      .select('id')
      .eq('phone', phone)
      .single();
    
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Create user in Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      phone: phone,
      password: password,
      options: {
        data: {
          name: name,
          role: role,
          shop_id: shopId,
          language: language
        }
      }
    });
    
    if (authError) throw authError;
    
    // Create user in users table
    const { data: user, error: userError } = await supabaseAnon
      .from('users')
      .insert({
        id: authData.user.id,
        name,
        phone,
        password: hashedPassword,
        role,
        shop_id: shopId,
        language
      })
      .select()
      .single();
    
    if (userError) throw userError;
    
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
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Failed to register user', details: error.message });
  }
});

// Login user
router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // Get user from database
    const { data: user, error: userError } = await supabaseAnon
      .from('users')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (userError || !user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabaseAnon.auth.signInWithPassword({
      phone: phone,
      password: password
    });
    
    if (authError) {
      console.error('Supabase auth error:', authError);
    }
    
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
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login', details: error.message });
  }
});

// Simple login without database (for testing)
router.post('/simple-login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    
    // For testing purposes, accept any phone/password combination
    // In production, this should validate against actual users
    const mockUser = {
      id: 'mock-user-id',
      phone: phone,
      name: 'Test User',
      role: 'owner',
      shop_id: 1,
      language: 'hi'
    };
    
    const token = generateToken(mockUser);
    
    res.json({
      success: true,
      token,
      user: mockUser
    });
  } catch (error) {
    console.error('Simple login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
});

// Logout user
router.post('/logout', async (req, res) => {
  try {
    // Sign out from Supabase
    await supabaseAnon.auth.signOut();
    
    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Failed to logout' });
  }
});

// Update user language preference
router.put('/language', async (req, res) => {
  try {
    const { userId, language } = req.body;
    
    await supabaseAnon
      .from('users')
      .update({ language })
      .eq('id', userId);

    res.json({ success: true, message: 'Language preference updated' });
  } catch (error) {
    console.error('Language update error:', error);
    res.status(500).json({ error: 'Failed to update language preference' });
  }
});

module.exports = router;
