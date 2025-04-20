const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken, isAdmin } = require('./middleware/auth');

// Middleware to check if user is admin
const isAdminMiddleware = (req, res, next) => {
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
// const initSystemActivitiesTable = async () => {
//   try {
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS system_activities (
//         id SERIAL PRIMARY KEY,
//         type VARCHAR(50) NOT NULL,
//         message TEXT NOT NULL,
//         related_id INTEGER,
//         created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
//       )
//     `);
//     console.log('System activities table initialized');
//   } catch (error) {
//     console.error('Error creating system_activities table:', error);
//   }
// };

// Call the initialization function
// initSystemActivitiesTable();

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
router.get('/doctor-credentials', isAdminMiddleware, async (req, res) => {
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
router.put('/doctor-credentials/status/:id', isAdminMiddleware, async (req, res) => {
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
router.get('/system-stats', isAdminMiddleware, async (req, res) => {
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
router.get('/users', isAdminMiddleware, async (req, res) => {
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
router.get('/today-appointments', isAdminMiddleware, async (req, res) => {
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
router.get('/appointments', authenticateToken, isAdmin, async (req, res) => {
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
router.get('/activities', isAdminMiddleware, async (req, res) => {
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
router.delete('/users/:id', isAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.query('BEGIN');
    
    try {
      // 1. Check user exists and validate
      const userCheck = await db.query(
        'SELECT id, user_type, name FROM users WHERE id = $1',
        [id]
      );
      
      if (userCheck.rows.length === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ error: 'User not found' });
      }

      const user = userCheck.rows[0];
      
      // 2. Prevent self-deletion
      if (parseInt(id) === req.user.userId) {
        await db.query('ROLLBACK');
        return res.status(400).json({ error: 'You cannot delete your own account' });
      }

      // 3. Prevent deleting last admin
      if (user.user_type === 'admin') {
        const adminCount = await db.query(
          'SELECT COUNT(*) FROM users WHERE user_type = $1',
          ['admin']
        );
        if (parseInt(adminCount.rows[0].count) <= 1) {
          await db.query('ROLLBACK');
          return res.status(400).json({ error: 'Cannot delete the last admin user' });
        }
      }

      // 4. First handle appointments - Important to do this first!
      await db.query(
        `UPDATE appointments 
         SET status = 'cancelled' 
         WHERE doctor_id = $1 OR patient_id = $1`,
        [id]
      );

      // 5. Then delete related records in correct order
      await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [id]);
      await db.query('DELETE FROM notifications WHERE user_id = $1', [id]);
      
      if (user.user_type === 'doctor') {
        await db.query('DELETE FROM doctor_credentials WHERE doctor_id = $1', [id]);
        await db.query('DELETE FROM doctor_schedules WHERE doctor_id = $1', [id]);
      }
      
      // 6. Delete the user's appointments after they've been cancelled
      await db.query('DELETE FROM appointments WHERE doctor_id = $1 OR patient_id = $1', [id]);
      
      // 7. Finally delete the user
      await db.query('DELETE FROM users WHERE id = $1', [id]);

      // 8. Log the activity
      await db.query(
        `INSERT INTO system_activities (type, message, related_id) 
         VALUES ($1, $2, $3)`,
        ['USER_DELETED', `User ${user.name} (${user.user_type}) was deleted`, req.user.userId]
      );

      await db.query('COMMIT');
      
      res.json({ 
        message: 'User deleted successfully',
        deletedUser: {
          id: user.id,
          name: user.name,
          type: user.user_type
        }
      });
      
    } catch (innerError) {
      await db.query('ROLLBACK');
      throw innerError;
    }
    
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Emergency access endpoint
router.post('/medical-records/emergency-access', isAdminMiddleware, async (req, res) => {
  try {
    const { patientId, reason } = req.body;
    
    // Log the emergency access attempt
    await db.query(
      `INSERT INTO medical_record_access_logs 
       (record_id, accessed_by, reason, is_emergency)
       VALUES ($1, $2, $3, true)`,
      [null, req.user.userId, reason]
    );

    // Get patient records with emergency override
    const records = await db.query(
      `SELECT mr.*, u.name as doctor_name
       FROM medical_records mr
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.patient_id = $1`,
      [patientId]
    );

    // Log system activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id)
       VALUES ($1, $2, $3)`,
      ['EMERGENCY_ACCESS', 
       `Emergency access to patient ${patientId}'s records by ${req.user.name}`,
       req.user.userId]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Error in emergency access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add to adminRoutes.js
router.get('/medical-records/audit-trail', isAdminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        ma.id,
        ma.record_id,
        ma.accessed_by,
        ma.access_type,
        ma.timestamp,
        ma.is_emergency,
        ma.reason,
        u.name as accessor_name,
        u.user_type as accessor_role
      FROM medical_record_access_logs ma
      JOIN users u ON ma.accessed_by = u.id
      ORDER BY ma.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

router.get('/audit-trail', isAdminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        a.id,
        a.type,
        a.message,
        a.timestamp,
        a.user_id,
        u.name as user_name,
        u.user_type
      FROM system_activities a
      LEFT JOIN users u ON a.user_id = u.id
      WHERE a.type LIKE 'MEDICAL_RECORD%'
      ORDER BY a.timestamp DESC
    `);
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch audit trail' });
  }
});

// Add after existing routes
router.get('/medical-records/analytics', isAdminMiddleware, async (req, res) => {
  try {
    // Get total records count
    const totalRecords = await db.query(
      'SELECT COUNT(*) FROM medical_records'
    );

    // Get records by type
    const recordsByType = await db.query(`
      SELECT type, COUNT(*) as count 
      FROM medical_records 
      GROUP BY type
    `);

    // Get records by department
    const recordsByDepartment = await db.query(`
      SELECT department, COUNT(*) as count 
      FROM medical_records 
      GROUP BY department
    `);

    // Get access frequency
    const accessFrequency = await db.query(`
      SELECT 
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '24 HOURS') as daily,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '7 DAYS') as weekly,
        COUNT(*) FILTER (WHERE timestamp >= NOW() - INTERVAL '30 DAYS') as monthly
      FROM medical_record_access_logs
    `);

    res.json({
      totalRecords: totalRecords.rows[0].count,
      recordsByType: recordsByType.rows,
      recordsByDepartment: recordsByDepartment.rows,
      accessFrequency: accessFrequency.rows[0]
    });
  } catch (error) {
    console.error('Error getting analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

router.get('/medical-records/access-patterns', isAdminMiddleware, async (req, res) => {
  try {
    const patterns = await db.query(`
      SELECT 
        mr.id as record_id,
        COUNT(mal.id) as access_count,
        MAX(mal.timestamp) as last_accessed,
        SUM(CASE WHEN mal.is_emergency THEN 1 ELSE 0 END) as emergency_count
      FROM medical_records mr
      LEFT JOIN medical_record_access_logs mal ON mr.id = mal.record_id
      GROUP BY mr.id
      ORDER BY access_count DESC
      LIMIT 10
    `);

    res.json({
      mostAccessedRecords: patterns.rows,
      emergencyAccessCount: patterns.rows.reduce((acc, curr) => acc + parseInt(curr.emergency_count), 0)
    });
  } catch (error) {
    console.error('Error getting access patterns:', error);
    res.status(500).json({ error: 'Failed to fetch access patterns' });
  }
});

// Add this endpoint to fetch all medical records for admin
router.get('/medical-records', isAdminMiddleware, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT 
        mr.*,
        p.name as patient_name,
        d.name as doctor_name
      FROM medical_records mr
      LEFT JOIN users p ON mr.patient_id = p.id
      LEFT JOIN users d ON mr.doctor_id = d.id AND d.user_type = 'doctor'
      ORDER BY mr.created_at DESC
    `);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Add this endpoint to fetch access logs for a specific record
router.get('/medical-records/:id/access-logs', isAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT 
        mal.*,
        u.name as accessed_by_name,
        u.user_type as accessor_role,
        mal.access_time as timestamp,
        mal.is_emergency as isEmergency,
        mal.accessed_by as accessedBy,
        u.name as accessorName
       FROM medical_record_access_logs mal
       JOIN users u ON mal.accessed_by = u.id
       WHERE mal.record_id = $1
       ORDER BY mal.access_time DESC`,
      [id]
    );
    
    // Transform data to match expected format on frontend
    const formattedLogs = result.rows.map(log => ({
      id: log.id,
      recordId: log.record_id,
      accessedBy: log.accessed_by_name,
      accessorName: log.accessed_by_name,
      accessorRole: log.accessor_role,
      timestamp: log.timestamp,
      reason: log.reason,
      isEmergency: log.isEmergency
    }));
    
    res.json(formattedLogs);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

// Add endpoint to update record access settings
router.put('/medical-records/:id/access', isAdminMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body;
    
    if (!['restrict', 'unrestrict'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action. Use "restrict" or "unrestrict"' });
    }
    
    const sensitivityLevel = action === 'restrict' ? 'restricted' : 'normal';
    
    // Update the record's sensitivity level
    await db.query(
      `UPDATE medical_records 
       SET sensitivity_level = $1 
       WHERE id = $2`,
      [sensitivityLevel, id]
    );
    
    // Log the activity - FIX: Change user_id to related_id
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'MEDICAL_RECORD_ACCESS_CHANGE',
        `Medical record ID ${id} access level changed to ${sensitivityLevel}`,
        req.user.userId // This should be the admin's ID
      ]
    );
    
    // Log the access change in access logs
    await db.query(
      `INSERT INTO medical_record_access_logs 
       (record_id, accessed_by, reason, is_emergency)
       VALUES ($1, $2, $3, false)`,
      [id, req.user.userId, `Changed access level to ${sensitivityLevel}`]
    );
    
    res.json({ 
      success: true, 
      message: `Record access level updated to ${sensitivityLevel}`
    });
  } catch (error) {
    console.error('Error updating record access:', error);
    res.status(500).json({ error: 'Failed to update record access' });
  }
});

// Add this endpoint to get records with emergency access
router.get('/medical-records/emergency-access', isAdminMiddleware, async (req, res) => {
  try {
    // Get records that have had emergency access
    const result = await db.query(
      `SELECT DISTINCT mr.* 
       FROM medical_records mr
       JOIN medical_record_access_logs mal ON mr.id = mal.record_id
       WHERE mal.is_emergency = true`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emergency access records:', error);
    res.status(500).json({ error: 'Failed to fetch records with emergency access' });
  }
});

// This endpoint retrieves records that have had emergency access
router.get('/medical-records/emergency', isAdminMiddleware, async (req, res) => {
  try {
    // Get records that have had emergency access
    const result = await db.query(`
      SELECT DISTINCT 
        mr.*, 
        p.name as patient_name,
        d.name as doctor_name
      FROM medical_records mr
      JOIN medical_record_access_logs mal ON mr.id = mal.record_id
      LEFT JOIN users p ON mr.patient_id = p.id
      LEFT JOIN users d ON mr.doctor_id = d.id
      WHERE mal.is_emergency = true
      ORDER BY mr.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching emergency access records:', error);
    res.status(500).json({ error: 'Failed to fetch records with emergency access' });
  }
});

// Add these routes to your adminRoutes.js file

// Get all patients (for admin)
router.get('/patients', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email
      FROM users
      WHERE user_type = 'patient'
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get all appointments (for admin)
router.get('/appointments', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, 
             p.name as patient_name,
             d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      ORDER BY a.date DESC, a.time ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;