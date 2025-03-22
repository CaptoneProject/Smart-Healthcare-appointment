const express = require('express');
const router = express.Router();
const db = require('./database');

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  console.log('Checking admin privileges for:', req.user);
  
  if (req.user && req.user.userType === 'admin') {
    console.log('User has admin privileges, proceeding...');
    next();
  } else {
    console.log('Access denied, user is not admin:', req.user);
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
        dc.created_at as "submittedAt",
        dc.biography,
        dc.education_history as "educationHistory"
      FROM doctor_credentials dc
      JOIN users u ON dc.doctor_id = u.id
    `;
    
    // Add filter if specified
    if (filter === 'pending') {
      query += ` WHERE dc.verification_status = 'pending'`;
    }
    
    query += ` ORDER BY dc.created_at DESC`;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update doctor status (approve/reject)
router.put('/doctor-credentials/status/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    
    // Fix: Update query to use doctor_id instead of id
    const updateQuery = `
      UPDATE doctor_credentials 
      SET verification_status = $1, 
          updated_at = NOW() 
      WHERE doctor_id = $2 
      RETURNING *`;
    
    const updateResult = await db.query(updateQuery, [status, id]);
    
    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor credentials not found' });
    }
    
    res.json({
      message: `Doctor ${status === 'approved' ? 'approved' : 'rejected'} successfully`,
      credentials: updateResult.rows[0]
    });
  } catch (error) {
    console.error(`Error updating doctor status:`, error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get system stats for admin dashboard
router.get('/system-stats', isAdmin, async (req, res) => {
  try {
    // Get total users count
    const usersResult = await db.query(
      `SELECT COUNT(*) as count, user_type FROM users GROUP BY user_type`
    );
    
    // Get pending credentials count
    const pendingResult = await db.query(
      `SELECT COUNT(*) as count FROM doctor_credentials WHERE verification_status = 'pending'`
    );
    
    // Get today's appointments count
    const today = new Date().toISOString().split('T')[0];
    const appointmentsResult = await db.query(
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