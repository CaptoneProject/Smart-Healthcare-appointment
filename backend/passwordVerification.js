const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('./database');

// Endpoint to verify a user's password without creating a full login session
router.post('/verify-password', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    // Find user by email
    const userResult = await db.query(
      'SELECT id, email, password FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      // Send generic error for security
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Password is valid
    res.json({ success: true, message: 'Password verified successfully' });
    
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;