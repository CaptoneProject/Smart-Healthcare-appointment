require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize database tables
async function initDatabase() {
  try {
    // Create users table first since it's referenced by other tables
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

    // Then create refresh_tokens which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create doctor_credentials which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_credentials (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) UNIQUE,
        degree VARCHAR(100),
        license_number VARCHAR(100),
        specialization VARCHAR(100),
        subspecialization VARCHAR(100),
        years_of_experience INTEGER,
        biography TEXT,
        education_history TEXT,
        verification_status VARCHAR(20) DEFAULT 'pending',
        verified_by INTEGER,
        verification_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create doctor_schedules which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id),
        day_of_week INTEGER,
        start_time TIME,
        end_time TIME,
        break_start TIME,
        break_end TIME,
        max_patients INTEGER DEFAULT 4,
        is_available BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create appointments which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES users(id),
        date DATE NOT NULL,
        time TIME NOT NULL,
        duration INTEGER NOT NULL,
        type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create notifications which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50),
        message TEXT,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create doctor_leaves which depends on users
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_leaves (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id),
        start_date DATE,
        end_date DATE,
        leave_type VARCHAR(50),
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create medical_records table
    await db.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES users(id),
        record_type VARCHAR(100) NOT NULL,
        description TEXT,
        record_date DATE NOT NULL,
        file_path VARCHAR(255),
        file_name VARCHAR(255),
        is_deleted BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

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

// Generate JWT tokens function
const generateTokens = (user) => {
  if (!process.env.JWT_SECRET || !process.env.REFRESH_TOKEN_SECRET) {
    throw new Error('JWT secrets not configured');
  }

  const accessToken = jwt.sign(
    { userId: user.id, email: user.email, userType: user.user_type },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const refreshToken = jwt.sign(
    { userId: user.id },
    process.env.REFRESH_TOKEN_SECRET,
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
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

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

// Password verification endpoint for sensitive data access
app.post('/api/auth/verify-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }
    
    // Get the user's stored password hash
    const userResult = await db.query(
      'SELECT password FROM users WHERE id = $1',
      [req.user.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid password' });
    }
    
    // Password verified successfully
    res.json({ success: true, message: 'Password verified successfully' });
  } catch (error) {
    console.error('Password verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Medical Records endpoints
app.get('/api/medical-records', authenticateToken, async (req, res) => {
  try {
    // Get user's medical records
    const result = await db.query(
      `SELECT 
        mr.id,
        mr.record_type,
        mr.description,
        mr.record_date,
        mr.file_name,
        u.name as doctor_name
      FROM medical_records mr
      JOIN users u ON mr.doctor_id = u.id
      WHERE mr.patient_id = $1 AND mr.is_deleted = false
      ORDER BY mr.record_date DESC`,
      [req.user.userId]
    );
    
    const records = result.rows.map(record => ({
      id: record.id,
      recordType: record.record_type,
      description: record.description,
      date: record.record_date,
      doctorName: record.doctor_name,
      fileName: record.file_name
    }));
    
    res.json(records);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get specific medical record
app.get('/api/medical-records/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if record exists and belongs to the requesting user
    const result = await db.query(
      `SELECT 
        mr.id,
        mr.record_type,
        mr.description,
        mr.record_date,
        mr.file_name,
        mr.file_path,
        u.name as doctor_name
      FROM medical_records mr
      JOIN users u ON mr.doctor_id = u.id
      WHERE mr.id = $1 AND mr.patient_id = $2 AND mr.is_deleted = false`,
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    const record = result.rows[0];
    
    res.json({
      id: record.id,
      recordType: record.record_type,
      description: record.description,
      date: record.record_date,
      doctorName: record.doctor_name,
      fileName: record.file_name
    });
  } catch (error) {
    console.error('Error fetching medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Download medical record file
app.get('/api/medical-records/:id/download', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if record exists and belongs to the requesting user
    const result = await db.query(
      `SELECT file_path, file_name 
       FROM medical_records 
       WHERE id = $1 AND patient_id = $2 AND is_deleted = false`,
      [id, req.user.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Medical record not found' });
    }
    
    const record = result.rows[0];
    
    // In a real implementation, you would handle file access here
    // For this example, we'll return a dummy success response
    res.json({ 
      success: true, 
      message: 'File download initiated',
      fileName: record.file_name
    });
  } catch (error) {
    console.error('Error downloading medical record:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Import routers
const authRoutes = require('./auth');
const appointmentsRoutes = require('./appointments');
const doctorSchedulingRoutes = require('./doctorScheduling');
const notificationsRoutes = require('./notifications');
const adminRoutes = require('./adminRoutes');

// Use routers
app.use('/api/auth', authRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/doctor', doctorSchedulingRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/admin', authenticateToken, adminRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
const PORT = process.env.PORT || 3000;

// Initialize database before starting the server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch(error => {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  });

module.exports = app;