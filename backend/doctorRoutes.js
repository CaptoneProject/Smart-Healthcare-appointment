const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken } = require('./middleware/auth');

// Get all patients for a specific doctor
router.get('/patients/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Ensure the requesting user is accessing their own data
    if (req.user.userId !== parseInt(doctorId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Get all patients who have appointments with this doctor
    const result = await db.query(`
      SELECT DISTINCT u.id, u.name, u.email
      FROM users u
      JOIN appointments a ON u.id = a.patient_id
      WHERE a.doctor_id = $1 AND u.user_type = 'patient'
      ORDER BY u.name ASC
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

module.exports = router;