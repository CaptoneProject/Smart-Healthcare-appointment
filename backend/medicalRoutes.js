const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken, isAdmin } = require('./middleware/auth');
const { upload } = require('./s3Config'); // Update import to destructure upload
const { sendMedicalRecordNotification } = require('./notifications');

// Initialize tables
// const initMedicalTables = async () => {
//   try {
//     // Create medical records table
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS medical_records (
//         id SERIAL PRIMARY KEY,
//         patient_id INTEGER REFERENCES users(id),
//         doctor_id INTEGER REFERENCES users(id),
//         title VARCHAR(255) NOT NULL,
//         type VARCHAR(100) NOT NULL,
//         department VARCHAR(100) NOT NULL,
//         file_url TEXT NOT NULL,
//         sensitivity_level VARCHAR(50) NOT NULL,
//         content TEXT,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Add NOT NULL constraint to doctor_id if not already present
//     await db.query(`
//       DO $$ 
//       BEGIN
//         ALTER TABLE medical_records ALTER COLUMN doctor_id SET NOT NULL;
//       EXCEPTION
//         WHEN others THEN
//           -- Silently handle errors
//           NULL;
//       END $$;
//     `);

//     // Create patient consent table
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS patient_consent (
//         patient_id INTEGER PRIMARY KEY REFERENCES users(id),
//         consent_given BOOLEAN DEFAULT false,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       );
//     `);

//     // Create access log table with proper constraints
//     await db.query(`
//       CREATE TABLE IF NOT EXISTS medical_record_access_logs (
//         id SERIAL PRIMARY KEY,
//         record_id INTEGER NOT NULL,
//         accessed_by INTEGER NOT NULL,
//         access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         reason TEXT,
//         is_emergency BOOLEAN DEFAULT false,
//         CONSTRAINT fk_record FOREIGN KEY (record_id) REFERENCES medical_records(id) ON DELETE CASCADE,
//         CONSTRAINT fk_user FOREIGN KEY (accessed_by) REFERENCES users(id) ON DELETE CASCADE
//       );
//     `);

//     // Add any missing constraints if table already exists
//     await db.query(`
//       DO $$ 
//       BEGIN
//         -- Add NOT NULL constraints if they don't exist
//         ALTER TABLE medical_record_access_logs 
//         ALTER COLUMN record_id SET NOT NULL,
//         ALTER COLUMN accessed_by SET NOT NULL;
        
//         -- Add foreign key constraints if they don't exist
//         IF NOT EXISTS (
//           SELECT 1 
//           FROM information_schema.table_constraints 
//           WHERE constraint_name = 'fk_record'
//         ) THEN
//           ALTER TABLE medical_record_access_logs
//           ADD CONSTRAINT fk_record 
//           FOREIGN KEY (record_id) 
//           REFERENCES medical_records(id) 
//           ON DELETE CASCADE;
//         END IF;

//         IF NOT EXISTS (
//           SELECT 1 
//           FROM information_schema.table_constraints 
//           WHERE constraint_name = 'fk_user'
//         ) THEN
//           ALTER TABLE medical_record_access_logs
//           ADD CONSTRAINT fk_user 
//           FOREIGN KEY (accessed_by) 
//           REFERENCES users(id)
//           ON DELETE CASCADE;
//         END IF;
//       EXCEPTION
//         WHEN others THEN
//           -- Handle any errors silently
//           NULL;
//       END $$;
//     `);

//     console.log('Medical records tables initialized successfully');
//   } catch (error) {
//     console.error('Error initializing medical records tables:', error);
//   }
// };

// Call initialization
// initMedicalTables();

// Middleware to check consent
const checkConsent = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT consent_given FROM patient_consent WHERE patient_id = $1',
      [req.user.userId]
    );
    
    if (!result.rows[0]?.consent_given) {
      return res.status(403).json({ error: 'Consent not provided for medical records access' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Error checking consent status' });
  }
};

// Consent Management Endpoints
router.post('/consent', authenticateToken, async (req, res) => {
  try {
    const { consent } = req.body;
    await db.query(
      `INSERT INTO patient_consent (patient_id, consent_given) 
       VALUES ($1, $2) 
       ON CONFLICT (patient_id) 
       DO UPDATE SET consent_given = $2, updated_at = CURRENT_TIMESTAMP`,
      [req.user.userId, consent]
    );
    res.json({ message: 'Consent updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update consent' });
  }
});

// Get consent status
router.get('/consent', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT consent_given FROM patient_consent WHERE patient_id = $1',
      [req.user.userId]
    );
    res.json({ consentGiven: result.rows[0]?.consent_given || false });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get consent status' });
  }
});

// Get medical records for a patient
router.get('/records/patient', authenticateToken, async (req, res) => {
  try {
    // Query with improved error handling for doctor_id
    const result = await db.query(`
      SELECT 
        mr.*,
        COALESCE(d.name, 'Unknown Doctor') AS doctor_name,
        p.name AS patient_name
      FROM medical_records mr
      LEFT JOIN users d ON mr.doctor_id = d.id AND d.user_type = 'doctor'
      LEFT JOIN users p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1
      ORDER BY mr.created_at DESC
    `, [req.user.userId]);

    console.log(`Found ${result.rows.length} patient records`);
    if (result.rows.length > 0) {
      console.log('Record sample:', { 
        doctor_id: result.rows[0].doctor_id,
        doctor_name: result.rows[0].doctor_name,
        patient_id: result.rows[0].patient_id,
        patient_name: result.rows[0].patient_name
      });
    }

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching patient records:', err);
    res.status(500).json({ error: 'Failed to fetch records' });
  }
});

// Update the GET medical records endpoint
router.get('/records/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId, userType } = req.user;

    // Base query to get medical records
    let query = `
      SELECT 
        mr.*,
        d.name as doctor_name,
        p.name as patient_name
      FROM medical_records mr
      LEFT JOIN users d ON mr.doctor_id = d.id
      LEFT JOIN users p ON mr.patient_id = p.id
      WHERE mr.patient_id = $1
    `;
    
    const queryParams = [patientId];
    
    // Apply restriction logic based on user type
    if (userType === 'doctor' && parseInt(userId) !== parseInt(patientId)) {
      // Doctors can see:
      // 1. All unrestricted records
      // 2. Restricted records they personally created
      query += ` AND (mr.sensitivity_level != 'restricted' OR mr.doctor_id = $2)`;
      queryParams.push(userId);
    } else if (userType !== 'admin' && userType !== 'patient') {
      // Other non-patient, non-admin users (like nurses, staff)
      // can only see unrestricted records
      query += ` AND mr.sensitivity_level != 'restricted'`;
    }
    
    // Order by most recent first
    query += ` ORDER BY mr.created_at DESC`;
    
    const result = await db.query(query, queryParams);
    
    // Log this access for audit trail
    for (const record of result.rows) {
      await db.query(
        `INSERT INTO medical_record_access_logs 
         (record_id, accessed_by, reason, is_emergency)
         VALUES ($1, $2, $3, false)`,
        [record.id, userId, 'Standard record access']
      );
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching medical records:', error);
    res.status(500).json({ error: 'Failed to fetch medical records' });
  }
});

// Get access logs for a specific record
router.get('/records/:id/access-logs', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
        mal.*,
        u.name as accessed_by_name,
        u.user_type as accessor_role
       FROM medical_record_access_logs mal
       JOIN users u ON mal.accessed_by = u.id
       WHERE mal.record_id = $1
       ORDER BY mal.access_time DESC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching access logs:', error);
    res.status(500).json({ error: 'Failed to fetch access logs' });
  }
});

// Upload medical record - Update with more error checking and proper return values
router.post('/records/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    // Check if user is authorized
    if (req.user.userType !== 'doctor' && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Only doctors and admins can upload medical records' });
    }

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { patientId, title, type, sensitivityLevel, department } = req.body;

    // Validate required fields
    if (!patientId || !title || !type || !sensitivityLevel || !department) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log('Upload request body:', req.body);
    console.log('File information:', req.file);

    // Get file URL from S3
    const fileUrl = req.file.location;
    if (!fileUrl) {
      return res.status(500).json({ error: 'Failed to get file URL from S3' });
    }

    // Make sure we have a valid doctor ID
    let doctorId = req.user.userType === 'doctor' ? req.user.userId : null;
    
    if (!doctorId) {
      // If not a doctor, find a doctor to assign
      const doctorResult = await db.query(
        "SELECT id FROM users WHERE user_type = 'doctor' LIMIT 1"
      );
      
      if (doctorResult.rows.length > 0) {
        doctorId = doctorResult.rows[0].id;
      } else {
        return res.status(400).json({ error: 'No doctor available to assign to record' });
      }
    }

    // Get doctor and patient information to include in the response
    const doctorInfo = await db.query('SELECT name FROM users WHERE id = $1', [doctorId]);
    const patientInfo = await db.query('SELECT name FROM users WHERE id = $1', [patientId]);

    if (doctorInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (patientInfo.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const doctorName = doctorInfo.rows[0].name;
    const patientName = patientInfo.rows[0].name;

    // Insert record into database - ensure doctor_id is always set
    const result = await db.query(
      `INSERT INTO medical_records 
       (patient_id, doctor_id, title, type, department, file_url, sensitivity_level)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [patientId, doctorId, title, type, department, fileUrl, sensitivityLevel]
    );

    console.log('About to send medical record notification with data:', {
      recordId: result.rows[0].id,
      patientId,
      doctorId,
      title,
      type, // Add the record type
      doctorName,
      patientName
    });

    // Send notification (add await to ensure it completes)
    await sendMedicalRecordNotification({
      recordId: result.rows[0].id,
      patientId,
      doctorId,
      title,
      type, // Add the record type
      doctorName,
      patientName
    }).catch(err => console.error('Notification error:', err));

    console.log('Medical record notification sent');

    // Create patient consent if needed
    const consentCheck = await db.query(
      'SELECT * FROM patient_consent WHERE patient_id = $1',
      [patientId]
    );

    if (consentCheck.rows.length === 0) {
      await db.query(
        `INSERT INTO patient_consent (patient_id, consent_given) 
         VALUES ($1, true)`,
        [patientId]
      );
    }

    // Return complete record with added fields
    const completeRecord = {
      ...result.rows[0],
      doctor_name: doctorName,
      patient_name: patientName
    };

    res.status(201).json(completeRecord);
  } catch (error) {
    console.error('Error uploading medical record:', error);
    // More detailed error response
    res.status(500).json({ 
      error: 'Failed to upload medical record',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Emergency access to medical records
router.post('/medical-records/emergency-access', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { patientId, reason } = req.body;
    
    if (!patientId || !reason) {
      return res.status(400).json({ error: 'Patient ID and reason are required' });
    }

    // Log the emergency access attempt
    await db.query(
      `INSERT INTO medical_record_access_logs 
       (record_id, accessed_by, reason, is_emergency)
       VALUES ($1, $2, $3, true)`,
      [null, req.user.id, reason]
    );

    // Get all records for the patient
    const records = await db.query(
      `SELECT mr.*, u.name as doctor_name
       FROM medical_records mr
       JOIN users u ON mr.doctor_id = u.id
       WHERE mr.patient_id = $1`,
      [patientId]
    );

    // Log the system activity
    await db.query(
      `INSERT INTO system_activities 
       (type, message, user_id, related_id)
       VALUES ($1, $2, $3, $4)`,
      [
        'EMERGENCY_ACCESS',
        `Emergency access to patient ${patientId}'s records`,
        req.user.id,
        patientId
      ]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Error in emergency access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint for doctor emergency access to medical records
router.post('/records/emergency-access', authenticateToken, async (req, res) => {
  try {
    // Check if user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can request emergency access' });
    }

    const { patientId, reason } = req.body;
    
    if (!patientId || !reason) {
      return res.status(400).json({ error: 'Patient ID and reason are required' });
    }

    // Get all records for the patient, including restricted ones
    const records = await db.query(
      `SELECT 
        mr.*,
        d.name as doctor_name,
        p.name as patient_name
       FROM medical_records mr
       LEFT JOIN users d ON mr.doctor_id = d.id
       LEFT JOIN users p ON mr.patient_id = p.id
       WHERE mr.patient_id = $1`,
      [patientId]
    );

    // Critical fix: Log emergency access for EACH record this patient has
    // This ensures each record shows up in emergency access filters
    for (const record of records.rows) {
      await db.query(
        `INSERT INTO medical_record_access_logs 
         (record_id, accessed_by, reason, is_emergency)
         VALUES ($1, $2, $3, true)`,
        [record.id, req.user.userId, reason]
      );
    }

    // Log the system activity
    await db.query(
      `INSERT INTO system_activities 
       (type, message, related_id)
       VALUES ($1, $2, $3)`,
      [
        'EMERGENCY_ACCESS',
        `Emergency access to patient ${patientId}'s records by doctor ${req.user.userId}`,
        req.user.userId
      ]
    );

    res.json(records.rows);
  } catch (error) {
    console.error('Error in emergency access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Test S3 connection
router.get('/test-s3', async (req, res) => {
  try {
    const { s3 } = require('./s3Config');
    await s3.listBuckets().promise();
    res.json({ message: 'S3 connection successful!' });
  } catch (error) {
    console.error('S3 connection error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get doctor's associated patients
router.get('/doctor/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const result = await db.query(
      `SELECT DISTINCT 
        p.id, 
        p.name, 
        p.email,
        pc.consent_given
       FROM users p
       LEFT JOIN appointments a ON p.id = a.patient_id
       LEFT JOIN patient_consent pc ON p.id = pc.patient_id
       WHERE a.doctor_id = $1
       AND p.user_type = 'patient'
       ORDER BY p.name`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching associated patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Update the doctor's patient list endpoint 
router.get('/doctor/patients/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;

    // Modified query to include consent status and handle missing relationships better
    const result = await db.query(`
      SELECT DISTINCT 
        p.id,
        p.name,
        p.email,
        COALESCE(COUNT(mr.id) FILTER (WHERE mr.id IS NOT NULL), 0) as record_count,
        MAX(mr.created_at) as last_record_date,
        COALESCE(pc.consent_given, false) as consent_given
      FROM users p
      JOIN appointments a ON p.id = a.patient_id
      LEFT JOIN medical_records mr ON p.id = mr.patient_id
      LEFT JOIN patient_consent pc ON p.id = pc.patient_id
      WHERE a.doctor_id = $1 AND p.user_type = 'patient'
      GROUP BY p.id, p.name, p.email, pc.consent_given
      ORDER BY p.name
    `, [doctorId]);

    // Add additional logging
    console.log(`Found ${result.rows.length} patients for doctor ${doctorId}`);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor patients:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Bulk update medical records
router.put('/medical-records/:id/bulk-update', isAdmin, async (req, res) => {
  try {
    const { records } = req.body;
    // Bulk update implementation
  } catch (error) {
    res.status(500).json({ error: 'Failed to update records' });
  }
});

// Replace the make-public endpoint with this version that uses bucket policy instead of ACLs
router.put('/records/:id/make-public', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the file URL from the database
    const record = await db.query(
      'SELECT file_url FROM medical_records WHERE id = $1',
      [id]
    );
    
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // Instead of updating ACL, generate a signed URL for temporary access
    const fileUrl = record.rows[0].file_url;
    const key = fileUrl.split('.amazonaws.com/')[1];
    
    // Generate a signed URL valid for 24 hours
    const { s3 } = require('./s3Config');
    const signedUrl = await s3.getSignedUrl(key);
    
    // Update the database to store the signed URL (optional)
    await db.query(
      'UPDATE medical_records SET temp_signed_url = $1, url_expiry = NOW() + INTERVAL \'24 hours\' WHERE id = $2',
      [signedUrl, id]
    );
    
    res.json({ 
      message: 'Temporary access URL generated successfully',
      signedUrl
    });
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate file access URL' });
  }
});

// Update this endpoint for getting signed URLs for file viewing
router.get('/records/:id/signed-url', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { preview } = req.query; // Add this to differentiate preview vs download
    
    // Get the file URL from the database
    const record = await db.query(
      'SELECT file_url FROM medical_records WHERE id = $1',
      [id]
    );
    
    if (record.rows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    const fileUrl = record.rows[0].file_url;
    
    // Debug the file URL to see what it contains
    console.log('File URL from database:', fileUrl);
    
    // Extract S3 key from the URL
    const key = fileUrl.split('.amazonaws.com/')[1];
    
    if (!key) {
      return res.status(400).json({ error: 'Invalid file URL format' });
    }
    
    // Debug the extracted key
    console.log('Extracted S3 key:', key);
    
    // Generate a signed URL with content disposition for viewing in browser
    const { s3 } = require('./s3Config');
    const isPreview = preview !== 'false';
    
    // Try-catch specifically around the getSignedUrl call
    try {
      const signedUrl = await s3.getSignedUrl(key, isPreview);
      
      // Log this access for audit trail
      await db.query(
        `INSERT INTO medical_record_access_logs 
         (record_id, accessed_by, reason, is_emergency)
         VALUES ($1, $2, $3, false)`,
        [id, req.user.userId, isPreview ? 'File viewed' : 'File downloaded']
      );
      
      res.json({ 
        signedUrl,
        contentType: s3.getContentType(key),
        message: 'Signed URL generated successfully'
      });
    } catch (s3Error) {
      console.error('S3 error generating signed URL:', s3Error);
      res.status(500).json({ error: 'Failed to generate file access URL', details: s3Error.message });
    }
  } catch (error) {
    console.error('Error generating signed URL:', error);
    res.status(500).json({ error: 'Failed to generate file access URL' });
  }
});

// Add this debug endpoint temporarily to test
router.get('/debug-records/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Simple query without any JOINs or consent checks
    const records = await db.query(`
      SELECT * FROM medical_records WHERE patient_id = $1
    `, [patientId]);
    
    res.json({
      recordCount: records.rows.length,
      records: records.rows
    });
  } catch (error) {
    res.status(500).json({ error: 'Debug query failed' });
  }
});

// Add this endpoint to fix existing records
router.post('/repair-doctor-records', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Find records with null doctor_id
    const nullRecords = await db.query(
      'SELECT COUNT(*) FROM medical_records WHERE doctor_id IS NULL'
    );
    
    const nullCount = parseInt(nullRecords.rows[0].count);
    
    if (nullCount > 0) {
      // Update records with your user ID as a default doctor
      await db.query(
        'UPDATE medical_records SET doctor_id = $1 WHERE doctor_id IS NULL',
        [req.user.userId]
      );
      
      res.json({ 
        message: `Fixed ${nullCount} records with missing doctor_id`,
        success: true
      });
    } else {
      res.json({ 
        message: 'No records with missing doctor_id found',
        success: true
      });
    }
  } catch (error) {
    console.error('Error repairing records:', error);
    res.status(500).json({ error: 'Failed to repair records' });
  }
});

// Add this endpoint to fix existing records with wrong doctor_id
router.post('/fix-patient-as-doctor-records', authenticateToken, isAdmin, async (req, res) => {
  try {
    // Find records where doctor_id = patient_id (self-referencing)
    const brokenRecords = await db.query(
      'SELECT COUNT(*) FROM medical_records WHERE doctor_id = patient_id'
    );
    
    const brokenCount = parseInt(brokenRecords.rows[0].count);
    
    if (brokenCount > 0) {
      // Get a doctor ID to use as replacement
      const doctorResult = await db.query(
        "SELECT id FROM users WHERE user_type = 'doctor' LIMIT 1"
      );
      
      if (doctorResult.rows.length === 0) {
        return res.status(404).json({ error: 'No doctor found to fix records' });
      }
      
      const defaultDoctorId = doctorResult.rows[0].id;
      
      // Update records with a proper doctor
      await db.query(
        'UPDATE medical_records SET doctor_id = $1 WHERE doctor_id = patient_id',
        [defaultDoctorId]
      );
      
      res.json({ 
        message: `Fixed ${brokenCount} records with patient as doctor`,
        success: true
      });
    } else {
      res.json({ 
        message: 'No records with patient as doctor found',
        success: true
      });
    }
  } catch (error) {
    console.error('Error fixing records:', error);
    res.status(500).json({ error: 'Failed to fix records' });
  }
});

// Add this endpoint to get restricted records count
router.get('/patients/:patientId/restricted-count', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    const { userId } = req.user;
    
    // Count restricted records that this doctor didn't create
    const result = await db.query(
      `SELECT COUNT(*) 
       FROM medical_records
       WHERE patient_id = $1
       AND sensitivity_level = 'restricted'
       AND doctor_id != $2`,
      [patientId, userId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error counting restricted records:', error);
    res.status(500).json({ error: 'Failed to count restricted records' });
  }
});

// Add more endpoints here later...

module.exports = router;