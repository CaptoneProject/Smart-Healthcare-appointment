const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartcare',
  password: process.env.DB_PASSWORD || 'vedang18',
  port: process.env.DB_PORT || 5432,
});

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.userType === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
};

// Get doctor credentials for review
router.get('/doctor-credentials', isAdmin, async (req, res) => {
  try {
    const { filter } = req.query;
    
    let query = `
      SELECT 
        dc.id,
        dc.doctor_id as "doctorId",
        u.name as "doctorName",
        u.email,
        dc.degree,
        dc.license_number as "licenseNumber",
        dc.specialization,
        dc.years_of_experience as "yearsOfExperience",
        dc.verification_status as status,
        dc.created_at as "submittedAt"
      FROM doctor_credentials dc
      JOIN users u ON dc.doctor_id = u.id
    `;
    
    // Add filter if specified
    if (filter === 'pending') {
      query += ` WHERE dc.verification_status = 'pending'`;
    }
    
    query += ` ORDER BY dc.created_at DESC`;
    
    const result = await pool.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update doctor credentials status
router.put('/doctor-credentials/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Update status
    await pool.query(
      `UPDATE doctor_credentials 
       SET verification_status = $1, 
           verification_notes = $2,
           verified_by = $3,
           updated_at = NOW()
       WHERE doctor_id = $4`,
      [status, reason || null, req.user.userId, id]
    );
    
    // Get doctor's email
    const userResult = await pool.query(
      'SELECT email FROM users WHERE id = $1',
      [id]
    );
    
    if (userResult.rows.length > 0) {
      const doctorEmail = userResult.rows[0].email;
      
      // In a real app, you'd send an email notification here
      console.log(`Notification to ${doctorEmail}: Your credentials have been ${status}${reason ? '. Reason: ' + reason : ''}`);
    }
    
    res.json({ message: `Doctor credentials ${status} successfully` });
  } catch (error) {
    console.error('Error updating doctor credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system stats for admin dashboard
router.get('/system-stats', isAdmin, async (req, res) => {
  try {
    // Get total users count
    const usersResult = await pool.query(
      `SELECT COUNT(*) as count, user_type FROM users GROUP BY user_type`
    );
    
    // Get pending credentials count
    const pendingResult = await pool.query(
      `SELECT COUNT(*) as count FROM doctor_credentials WHERE verification_status = 'pending'`
    );
    
    // Get today's appointments count
    const today = new Date().toISOString().split('T')[0];
    const appointmentsResult = await pool.query(
      `SELECT COUNT(*) as count FROM appointments WHERE date = $1`,
      [today]
    );
    
    // Format the response
    const stats = {
      users: {
        total: 0,
        patients: 0,
        doctors: 0,
        admins: 0
      },
      pendingApprovals: parseInt(pendingResult.rows[0]?.count || '0'),
      todayAppointments: parseInt(appointmentsResult.rows[0]?.count || '0'),
    };
    
    // Process user counts
    usersResult.rows.forEach(row => {
      const count = parseInt(row.count);
      stats.users.total += count;
      
      switch (row.user_type) {
        case 'patient':
          stats.users.patients = count;
          break;
        case 'doctor':
          stats.users.doctors = count;
          break;
        case 'admin':
          stats.users.admins = count;
          break;
      }
    });
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;