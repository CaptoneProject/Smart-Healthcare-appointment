const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./database'); // Use the shared database module

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, password, name, userType } = req.body;

    // Validate input
    if (!email || !password || !name || !userType) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Validate user type
    const validUserTypes = ['patient', 'doctor', 'provider', 'admin'];
    if (!validUserTypes.includes(userType)) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Check if user already exists
    const userExists = await db.query( // Changed from pool.query to db.query
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (userExists.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const result = await db.query( // Changed from pool.query to db.query
      'INSERT INTO users (email, password, name, user_type) VALUES ($1, $2, $3, $4) RETURNING id, email, user_type',
      [email, hashedPassword, name, userType]
    );

    const user = result.rows[0];
    const tokens = generateTokens(user);

    // Store refresh token
    await db.query( // Changed from pool.query to db.query
      'INSERT INTO refresh_tokens (user_id, token, expires_at) VALUES ($1, $2, NOW() + INTERVAL \'7 days\')',
      [user.id, tokens.refreshToken]
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user.id,
        email: user.email,
        name,
        userType: user.user_type
      },
      ...tokens
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user
    const userResult = await db.query( // Changed from pool.query to db.query
      'SELECT id, email, name, password, user_type FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = userResult.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // For doctors, check their status
    let doctorStatus = null;
    if (user.user_type === 'doctor') {
      const statusCheck = await db.query( // Changed from pool.query to db.query
        'SELECT verification_status FROM doctor_credentials WHERE doctor_id = $1 ORDER BY created_at DESC LIMIT 1',
        [user.id]
      );
      
      if (statusCheck.rows.length > 0) {
        doctorStatus = statusCheck.rows[0].verification_status;
      }
    }
    
    // Generate tokens
    const tokens = generateTokens(user);
    
    // Return user data with status
    res.json({
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        userType: user.user_type,
        ...(user.user_type === 'doctor' && { doctorStatus: doctorStatus || 'pending' })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Helper function to generate tokens
const generateTokens = (user) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { 
      userId: user.id, 
      email: user.email, 
      userType: user.user_type 
    },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }  // Extended from 1h to 24h
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

module.exports = router;