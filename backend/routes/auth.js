const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { asyncHandler, ValidationError } = require('../utils/errorHandler');
const logger = require('../utils/logger');

const router = express.Router();

// Sign up
router.post('/signup', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    throw new ValidationError('Username and password are required');
  }

  if (typeof username !== 'string' || username.trim().length < 3) {
    throw new ValidationError('Username must be at least 3 characters long');
  }

  if (typeof password !== 'string' || password.length < 6) {
    throw new ValidationError('Password must be at least 6 characters long');
  }

  // Sanitize input
  const sanitizedUsername = username.trim().toLowerCase();
  const sanitizedPassword = password.trim();

  // Check if user already exists
  const existingUser = await User.findOne({ username: sanitizedUsername });
  if (existingUser) {
    throw new ValidationError('Username already exists');
  }

  // Create new user
  const user = new User({ 
    username: sanitizedUsername, 
    password: sanitizedPassword 
  });
  
  await user.save();

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  logger.info('User created successfully', { 
    userId: user._id, 
    username: sanitizedUsername 
  });

  res.status(201).json({
    message: 'User created successfully',
    token,
    user: {
      id: user._id,
      username: user.username
    }
  });
}));

// Sign in
router.post('/signin', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  // Input validation
  if (!username || !password) {
    throw new ValidationError('Username and password are required');
  }

  // Sanitize input
  const sanitizedUsername = username.trim().toLowerCase();
  const sanitizedPassword = password.trim();

  // Find user
  const user = await User.findOne({ username: sanitizedUsername });
  if (!user) {
    throw new ValidationError('Invalid credentials');
  }

  // Check password
  const isMatch = await user.comparePassword(sanitizedPassword);
  if (!isMatch) {
    throw new ValidationError('Invalid credentials');
  }

  // Generate JWT token
  const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d'
  });

  logger.info('User signed in successfully', { 
    userId: user._id, 
    username: sanitizedUsername 
  });

  res.json({
    message: 'Sign in successful',
    token,
    user: {
      id: user._id,
      username: user.username
    }
  });
}));

// Get current user (protected route)
router.get('/me', auth, asyncHandler(async (req, res) => {
  logger.info('User profile retrieved', { 
    userId: req.user._id, 
    username: req.user.username 
  });

  res.json({
    user: {
      id: req.user._id,
      username: req.user.username
    }
  });
}));

// Logout (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

module.exports = router; 