const express = require('express');
const router = express.Router();
const db = require('../database');
const { authenticateToken } = require('../middleware/auth');

// Search patients (doctor only)
router.get('/search', authenticateToken, async (req, res) => {
  try {
    // Ensure the user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const { query } = req.query;
    
    if (!query || query.length < 2) {
      return res.json([]);
    }
    
    const result = await db.query(`
      SELECT id, name, email, phone
      FROM users
      WHERE 
        user_type = 'patient' AND
        (
          name ILIKE $1 OR
          email ILIKE $1
        )
      LIMIT 10
    `, [`%${query}%`]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error searching patients:', error);
    res.status(500).json({ error: 'Failed to search patients' });
  }
});

// Get all patients (doctor only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Ensure the user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Optionally, you might want to limit this to patients associated with this doctor
    const result = await db.query(`
      SELECT id, name, email, phone
      FROM users
      WHERE user_type = 'patient'
      ORDER BY name
      LIMIT 100
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get a specific patient (doctor only)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    // Ensure the user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT id, name, email, phone, dob, gender, address
      FROM users
      WHERE id = $1 AND user_type = 'patient'
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ error: 'Failed to fetch patient' });
  }
});

module.exports = router;