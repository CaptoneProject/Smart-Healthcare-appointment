const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken } = require('./middleware/auth');

// Get all patients for a specific doctor
router.get('/patients/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // More detailed debug info
    console.log('Request user:', JSON.stringify(req.user));
    console.log('User keys:', req.user ? Object.keys(req.user) : 'No user object');
    console.log('Requested doctor ID:', doctorId);
    
    // First check if user is valid
    if (!req.user) {
      return res.status(403).json({ error: 'Authentication required' });
    }
    
    // Notice from the log that the field is "userId" not "id" in the token
    // Check if the requesting user is the doctor or an admin
    if (req.user.userType !== 'admin' && req.user.userId !== parseInt(doctorId)) {
      return res.status(403).json({ 
        error: 'Unauthorized access',
        details: `User type: ${req.user.userType}, User ID: ${req.user.userId}, Requested doctor ID: ${doctorId}`
      });
    }
    
    // Fix the SQL query by removing the phone field:
    const result = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      LEFT JOIN appointments a ON u.id = a.patient_id AND a.doctor_id = $1
      LEFT JOIN prescriptions p ON u.id = p.patient_id AND p.doctor_id = $1
      WHERE (a.id IS NOT NULL OR p.id IS NOT NULL) 
        AND u.user_type = 'patient'
      ORDER BY u.name
    `, [doctorId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get doctor status
router.get('/status/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Ensure the requesting user is accessing their own data or is an admin
    if (req.user.userId !== parseInt(doctorId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(`
      SELECT status
      FROM doctor_credentials
      WHERE doctor_id = $1
    `, [doctorId]);
    
    if (result.rows.length === 0) {
      return res.json({ status: 'pending' });
    }
    
    res.json({ status: result.rows[0].status });
  } catch (error) {
    console.error('Error fetching doctor status:', error);
    res.status(500).json({ error: 'Failed to fetch doctor status' });
  }
});

// Get all patients
router.get('/all-patients', authenticateToken, async (req, res) => {
  try {
    // Ensure the requesting user is a doctor
    if (req.user.userType !== 'doctor' && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get all patients (limited for performance reasons)
    const result = await db.query(`
      SELECT id, name, email
      FROM users
      WHERE user_type = 'patient'
      ORDER BY name
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

module.exports = router;