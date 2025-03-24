require('dotenv').config();
const express = require('express');
// Remove the Pool import
// const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database'); // Add the shared database module
const notificationsRouter = require('./notifications').router; // Change this line

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize database tables
async function initDatabase() {
  try {
    // Create users table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create refresh_tokens table
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Initialize database on startup
initDatabase();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error('JWT secret not configured');
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Generate JWT tokens function (still needed for refresh token endpoint)
const generateTokens = (user) => {
  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, userType: user.user_type },
    process.env.JWT_SECRET || 'your-secret-key',
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret',
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

// Refresh token endpoint
app.post('/api/auth/refresh-token', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET || 'your-refresh-secret'
    );

    // Check if refresh token exists and is valid
    const tokenResult = await db.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refreshToken]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(403).json({ error: 'Invalid or expired refresh token' });
    }

    // Get user details
    const userResult = await db.query(
      'SELECT id, email, user_type FROM users WHERE id = $1',
      [decoded.userId]
    );

    const user = userResult.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate new tokens
    const tokens = generateTokens(user);

    // Update refresh token
    await db.query(
      'UPDATE refresh_tokens SET token = $1, expires_at = NOW() + INTERVAL \'7 days\' WHERE user_id = $2 AND token = $3',
      [tokens.refreshToken, user.id, refreshToken]
    );

    res.json(tokens);
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(403).json({ error: 'Invalid or expired refresh token' });
  }
});

// Logout endpoint
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Remove refresh token
    await db.query(
      'DELETE FROM refresh_tokens WHERE user_id = $1 AND token = $2',
      [req.user.userId, refreshToken]
    );

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user profile endpoint
app.get('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, name, user_type, created_at FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = result.rows[0];

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      userType: user.user_type,
      createdAt: user.created_at
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user profile endpoint
app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, currentPassword, newPassword } = req.body;
    
    // Get current user data
    const userResult = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );

    const user = userResult.rows[0];

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required' });
      }

      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await db.query(
        'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
        [hashedPassword, req.user.userId]
      );
    }

    // Update name if provided
    if (name) {
      await db.query(
        'UPDATE users SET name = $1, updated_at = NOW() WHERE id = $2',
        [name, req.user.userId]
      );
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import routers
const authRoutes = require('./auth');
const appointmentsRoutes = require('./appointments');
const doctorSchedulingRoutes = require('./doctorScheduling');
const adminRoutes = require('./adminRoutes');

// Use routers
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctor', doctorSchedulingRoutes);
app.use('/api/notifications', notificationsRouter);

app.use('/api/admin', authenticateToken, adminRoutes);

// Add this after all your routes
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    details: err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;