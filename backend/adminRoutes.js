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

// Initialize the system_activities table if it doesn't exist
const initSystemActivitiesTable = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('System activities table initialized');
  } catch (error) {
    console.error('Error creating system_activities table:', error);
  }
};

// Call the initialization function
initSystemActivitiesTable();

// Function to log system activities
const logSystemActivity = async (type, message, relatedId = null) => {
  try {
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [type, message, relatedId]
    );
  } catch (error) {
    console.error('Error logging system activity:', error);
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
    
    // First get the doctor's name for the activity log
    const doctorQuery = await db.query(
      `SELECT u.name FROM users u WHERE u.id = $1`, 
      [id]
    );
    
    const doctorName = doctorQuery.rows[0]?.name || 'Unknown doctor';
    
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
    
    // Log activity based on status
    await logSystemActivity(
      `DOCTOR_${status.toUpperCase()}`,
      `Dr. ${doctorName}'s credentials were ${status}`,
      id
    );
    
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
    const today = new Date().toISOString().split('T')[0];
    
    // Update the query to only count confirmed appointments
    const appointmentsResult = await db.query(
      `SELECT COUNT(*) as count 
       FROM appointments 
       WHERE date = $1 
       AND LOWER(status) = 'confirmed'`,  // Only count confirmed appointments
      [today]
    );
    
    const todayAppointments = parseInt(appointmentsResult.rows[0].count || '0');
    
    // Get total users count
    const usersResult = await db.query(
      `SELECT COUNT(*) as count, user_type FROM users GROUP BY user_type`
    );
    
    // Get pending credentials count
    const pendingResult = await db.query(
      `SELECT COUNT(*) as count FROM doctor_credentials WHERE verification_status = 'pending'`
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
      todayAppointments: todayAppointments,
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
    
    res.json({
      users: {
        total: stats.users.total,
        patients: stats.users.patients,
        doctors: stats.users.doctors,
        admins: stats.users.admins
      },
      pendingApprovals: parseInt(pendingResult.rows[0]?.count || '0'),
      todayAppointments: todayAppointments
    });

  } catch (error) {
    console.error('Error fetching system stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users with details
router.get('/users', isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        id,
        name,
        email,
        user_type,
        created_at,
        updated_at
      FROM users
      ORDER BY created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get today's appointments with details
router.get('/today-appointments', isAdmin, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    const result = await db.query(`
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.type,
        a.notes,
        p.id as patient_id,
        p.name as patient_name,
        p.email as patient_email,
        d.id as doctor_id,
        d.name as doctor_name,
        d.email as doctor_email,
        dc.specialization as specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_credentials dc ON dc.doctor_id = d.id
      WHERE a.date = $1
      ORDER BY a.time
    `, [today]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching today\'s appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a more comprehensive appointments endpoint
router.get('/appointments', isAdmin, async (req, res) => {
  try {
    const { dateFilter = 'today' } = req.query;
    let dateCondition = '';
    
    // Set date filter based on parameter
    if (dateFilter === 'today') {
      dateCondition = `WHERE a.date = CURRENT_DATE`;
    } else if (dateFilter === 'tomorrow') {
      dateCondition = `WHERE a.date = CURRENT_DATE + INTERVAL '1 day'`;
    } else if (dateFilter === 'week') {
      dateCondition = `WHERE a.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '7 days'`;
    } else if (dateFilter === 'month') {
      dateCondition = `WHERE a.date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 days'`;
    } else if (dateFilter === 'all') {
      dateCondition = '';
    }
    
    const query = `
      SELECT 
        a.id,
        a.date,
        a.time,
        a.status,
        a.type,
        a.notes,
        p.id as patient_id,
        p.name as patient_name,
        p.email as patient_email,
        d.id as doctor_id,
        d.name as doctor_name,
        d.email as doctor_email,
        dc.specialization as specialty
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_credentials dc ON dc.doctor_id = d.id
      ${dateCondition}
      ORDER BY a.date, a.time
    `;
    
    const result = await db.query(query);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update the activities endpoint
router.get('/activities', isAdmin, async (req, res) => {
  try {
    // Check if the table exists
    const tableExists = await db.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'system_activities'
      )
    `);
    
    if (!tableExists.rows[0].exists) {
      await initSystemActivitiesTable();
      return res.json([]);
    }
    
    // Get the most recent 20 system activities
    const result = await db.query(`
      SELECT 
        id,
        type,
        message,
        created_at
      FROM system_activities
      ORDER BY created_at DESC
      LIMIT 20
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching activities:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint to handle user deletion
router.delete('/users/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent admins from deleting themselves
    if (parseInt(id) === req.user.userId) {
      return res.status(400).json({ error: 'You cannot delete your own account' });
    }
    
    // Check if user exists
    const userCheck = await db.query('SELECT id, user_type FROM users WHERE id = $1', [id]);
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Extra safety check for preventing deletion of the last admin
    if (userCheck.rows[0].user_type === 'admin') {
      const adminCount = await db.query('SELECT COUNT(*) FROM users WHERE user_type = $1', ['admin']);
      if (parseInt(adminCount.rows[0].count) <= 1) {
        return res.status(400).json({ error: 'Cannot delete the last admin user' });
      }
    }
    
    // Delete user - this should cascade to related data if you've set up your foreign keys correctly
    await db.query('DELETE FROM users WHERE id = $1', [id]);
    
    // Log the activity
    await logSystemActivity(
      'USER_DELETED',
      `User account deleted: ID ${id}`,
      req.user.userId
    );
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;