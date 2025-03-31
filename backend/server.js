require('dotenv').config();
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');
const notificationsRouter = require('./notifications').router;
const medicalRoutes = require('./medicalRoutes');
const { authenticateToken, isAdmin } = require('./middleware/auth'); // We'll use this instead
const authRouter = require('./auth');

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

// Import routers
const appointmentsRoutes = require('./appointments');
const doctorSchedulingRoutes = require('./doctorScheduling');
const adminRoutes = require('./adminRoutes');

// Use routers
app.use('/api/auth', authRouter);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctor', doctorSchedulingRoutes);
app.use('/api/notifications', notificationsRouter);
app.use('/api/medical', medicalRoutes);

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