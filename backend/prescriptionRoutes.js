const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken } = require('./middleware/auth');

// Update the patient/current route with detailed logging:

router.get('/patient/current', authenticateToken, async (req, res) => {
  try {
    console.log('GET /patient/current - User:', JSON.stringify(req.user));
    
    // Ensure the user is a patient
    if (req.user.userType !== 'patient') {
      console.log('ERROR: User is not a patient:', req.user.userType);
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Handle both id and userId fields
    const patientId = req.user.userId || req.user.id;
    console.log('Using patient ID:', patientId);
    
    // Updated query to handle NULL doctor_id
    const result = await db.query(`
      SELECT p.*, 
             COALESCE(d.name, 'Unknown Doctor') as doctor,
             TO_CHAR(p.prescribed_date, 'Mon DD, YYYY') as "prescribedDate", 
             TO_CHAR(p.expiry_date, 'Mon DD, YYYY') as "expiryDate",
             CASE 
               WHEN NOW() - p.last_filled < INTERVAL '7 days' THEN '1 week ago'
               WHEN NOW() - p.last_filled < INTERVAL '14 days' THEN '2 weeks ago'
               WHEN NOW() - p.last_filled < INTERVAL '30 days' THEN '1 month ago'
               ELSE TO_CHAR(p.last_filled, 'Mon DD, YYYY')
             END as "lastFilled"
      FROM prescriptions p
      LEFT JOIN users d ON p.doctor_id = d.id
      WHERE p.patient_id = $1
      ORDER BY p.status = 'Active' DESC, p.expiry_date DESC
    `, [patientId]);
    
    console.log(`Found ${result.rows.length} prescriptions for patient ${patientId}`);
    
    if (result.rows.length === 0) {
      console.log('No prescriptions found for patient:', patientId);
      
      // Let's double check if the patient exists
      const patientCheck = await db.query(`
        SELECT id, name FROM users WHERE id = $1 AND user_type = 'patient'
      `, [patientId]);
      
      if (patientCheck.rows.length === 0) {
        console.log('Warning: Patient ID not found in users table:', patientId);
      } else {
        console.log('Patient exists but has no prescriptions:', patientCheck.rows[0].name);
      }
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Similarly, add this route for doctor/current
router.get('/refill/doctor/current', authenticateToken, async (req, res) => {
  try {
    console.log('GET /refill/doctor/current - User:', JSON.stringify(req.user));
    
    // Ensure the user is a doctor
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    // Get doctor ID from token
    const doctorId = req.user.id || req.user.userId;
    console.log('Using doctor ID:', doctorId);
    
    // Update query to return fields with correct naming for frontend
    const result = await db.query(`
      SELECT 
        r.id,
        r.prescription_id,
        r.patient_id,
        r.pharmacy,
        r.notes,
        r.status,
        r.created_at,
        r.updated_at,
        r.processed_by,
        p.medication,
        p.dosage,
        p.instructions,
        u.name as "patientName",
        TO_CHAR(r.created_at, 'Mon DD, YYYY') as "requestedDate"
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      JOIN users u ON r.patient_id = u.id
      WHERE p.doctor_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `, [doctorId]);
    
    console.log(`Found ${result.rows.length} pending refill requests for doctor ${doctorId}`);
    
    // Log the first result for debugging
    if (result.rows.length > 0) {
      console.log('First refill request:', result.rows[0]);
    }
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    res.status(500).json({ error: 'Failed to fetch refill requests' });
  }
});

// And this route for patient refill history
router.get('/refill/patient/current', authenticateToken, async (req, res) => {
  try {
    // Ensure the user is a patient
    if (req.user.userType !== 'patient') {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const patientId = req.user.id;
    
    const result = await db.query(`
      SELECT r.*, 
             p.medication, p.dosage,
             TO_CHAR(r.created_at, 'Mon DD, YYYY') as requested_date,
             TO_CHAR(r.updated_at, 'Mon DD, YYYY') as processed_date,
             u.name as doctor_name
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      JOIN users u ON p.doctor_id = u.id
      WHERE r.patient_id = $1
      ORDER BY r.created_at DESC
    `, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient refill history:', error);
    res.status(500).json({ error: 'Failed to fetch refill history' });
  }
});

// Get all prescriptions for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if the requesting user is the patient or a doctor treating the patient
    if (req.user.userType === 'patient' && req.user.id !== parseInt(patientId)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const result = await db.query(`
      SELECT p.*, 
             d.name as doctor,
             TO_CHAR(p.prescribed_date, 'Mon DD, YYYY') as prescribedDate,
             TO_CHAR(p.expiry_date, 'Mon DD, YYYY') as expiryDate,
             CASE 
               WHEN NOW() - p.last_filled < INTERVAL '7 days' THEN '1 week ago'
               WHEN NOW() - p.last_filled < INTERVAL '14 days' THEN '2 weeks ago'
               WHEN NOW() - p.last_filled < INTERVAL '30 days' THEN '1 month ago'
               ELSE TO_CHAR(p.last_filled, 'Mon DD, YYYY')
             END as lastFilled
      FROM prescriptions p
      JOIN users d ON p.doctor_id = d.id
      WHERE p.patient_id = $1
      ORDER BY p.status = 'Active' DESC, p.expiry_date DESC
    `, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching prescriptions:', error);
    res.status(500).json({ error: 'Failed to fetch prescriptions' });
  }
});

// Create a new prescription (doctor only)
router.post('/', authenticateToken, async (req, res) => {
  try {
    console.log('Creating prescription - User:', JSON.stringify(req.user));
    console.log('Prescription data:', req.body);
    
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can create prescriptions' });
    }
    
    const { patientId, doctorId, medication, dosage, instructions, refillsRemaining, expiryDate, pharmacy, warnings } = req.body;
    
    // Use doctorId from the request or fallback to user.id or user.userId
    const doctor_id = doctorId || req.user.id || req.user.userId;
    
    console.log('Using doctor ID:', doctor_id);
    
    const result = await db.query(`
      INSERT INTO prescriptions (
        patient_id, doctor_id, medication, dosage, instructions, 
        refills_remaining, expiry_date, pharmacy, warnings, status,
        prescribed_date, last_filled
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_DATE, CURRENT_TIMESTAMP)
      RETURNING id
    `, [
      patientId, 
      doctor_id,  // Use the determined doctor_id 
      medication, 
      dosage, 
      instructions, 
      refillsRemaining, 
      expiryDate,
      pharmacy || '',
      warnings || '',
      'Active'
    ]);
    
    console.log('Prescription created with ID:', result.rows[0].id);
    
    // Create notification for patient
    try {
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        patientId,
        'PRESCRIPTION_CREATED',
        'New Prescription',
        `You have received a new prescription for ${medication}`,
        result.rows[0].id
      ]);
      console.log('Notification created for patient');
    } catch (notifError) {
      console.error('Error creating notification:', notifError);
      // Continue even if notification fails
    }
    
    res.status(201).json({ 
      message: 'Prescription created successfully',
      id: result.rows[0].id
    });
  } catch (error) {
    console.error('Error creating prescription:', error);
    res.status(500).json({ error: 'Failed to create prescription' });
  }
});

// Request a refill
router.post('/refill', authenticateToken, async (req, res) => {
  try {
    // Log the user info and request body for debugging
    console.log('Refill request - User:', JSON.stringify(req.user));
    console.log('Refill request - Body:', JSON.stringify(req.body));
    
    const { prescriptionId, pharmacy, notes } = req.body;
    
    // Get the patient ID from the token
    const patientId = req.user.id || req.user.userId;
    console.log('Using patient ID from token:', patientId);
    
    // Verify this is the patient's prescription and it has refills
    const prescriptionCheck = await db.query(`
      SELECT id, patient_id, doctor_id, medication, refills_remaining, status
      FROM prescriptions
      WHERE id = $1
    `, [prescriptionId]);
    
    if (prescriptionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Prescription not found' });
    }
    
    const prescription = prescriptionCheck.rows[0];
    console.log('Prescription found:', prescription);
    console.log('Comparing patient IDs - Token:', patientId, 'Prescription:', prescription.patient_id);
    
    // Check if this is the patient's prescription
    // Use loose equality (==) to handle string vs number comparisons
    if (parseInt(patientId) != parseInt(prescription.patient_id)) {
      return res.status(403).json({ error: 'Not authorized to request this refill' });
    }
    
    // Check if the prescription has refills remaining
    if (prescription.refills_remaining <= 0) {
      return res.status(400).json({ error: 'No refills remaining for this prescription' });
    }
    
    // Check if the prescription is not already being refilled
    if (prescription.status === 'Refill Requested') {
      return res.status(400).json({ error: 'A refill request is already pending for this prescription' });
    }
    
    // All checks passed, create the refill request
    await db.query('BEGIN');
    
    try {
      // Create refill request
      const refillResult = await db.query(`
        INSERT INTO refill_requests (prescription_id, patient_id, pharmacy, notes, status)
        VALUES ($1, $2, $3, $4, 'pending')
        RETURNING id
      `, [prescriptionId, patientId, pharmacy, notes]);
      
      // Update prescription status
      await db.query(`
        UPDATE prescriptions
        SET status = 'Refill Requested', updated_at = NOW()
        WHERE id = $1
      `, [prescriptionId]);
      
      // Create notification for doctor
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        prescription.doctor_id,
        'REFILL_REQUESTED',
        'Refill Requested',
        `A refill request has been made for ${prescription.medication}`,
        refillResult.rows[0].id
      ]);
      
      await db.query('COMMIT');
      
      res.status(201).json({ 
        message: 'Refill request created successfully',
        id: refillResult.rows[0].id
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error requesting refill:', error);
    res.status(500).json({ error: 'Failed to request refill' });
  }
});

// Approve a refill request
router.put('/refill/:id/approve', authenticateToken, async (req, res) => {
  try {
    const refillId = req.params.id;
    
    // Get the doctor ID from the token and log all possible locations
    console.log('Token user details:', JSON.stringify(req.user, null, 2));
    console.log('Token headers:', req.headers.authorization?.substring(0, 20) + '...');
    
    const doctorId = req.user.id || req.user.userId || req.user.user_id;
    console.log(`Doctor ${doctorId} attempting to approve refill ${refillId}`);
    
    // Get ALL data about this refill request for detailed comparison
    const detailedRefillCheck = await db.query(`
      SELECT 
        r.*,
        p.*,
        doc.id as true_doctor_id,
        doc.name as doctor_name,
        pat.id as true_patient_id,
        pat.name as patient_name
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      JOIN users doc ON p.doctor_id = doc.id
      JOIN users pat ON r.patient_id = pat.id
      WHERE r.id = $1
    `, [refillId]);
    
    if (detailedRefillCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Refill request not found' });
    }
    
    const detailedRefill = detailedRefillCheck.rows[0];
    console.log('DETAILED REFILL REQUEST:', JSON.stringify(detailedRefill, null, 2));
    console.log(`COMPARISON - Token doctor ID ${doctorId} vs prescription doctor ID ${detailedRefill.doctor_id}`);
    console.log(`Types - Token: ${typeof doctorId}, DB: ${typeof detailedRefill.doctor_id}`);
    console.log('Strict equality:', doctorId === detailedRefill.doctor_id);
    console.log('Loose equality:', doctorId == detailedRefill.doctor_id);
    console.log('After parseInt:', parseInt(doctorId) === parseInt(detailedRefill.doctor_id));
    
    // Rest of your function...
    // First, get information about this refill request
    const refillCheck = await db.query(`
      SELECT 
        r.id, r.prescription_id, r.patient_id, r.status,
        p.doctor_id, p.medication
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      WHERE r.id = $1
    `, [refillId]);
    
    if (refillCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Refill request not found' });
    }
    
    const refill = refillCheck.rows[0];
    console.log('Refill request found:', refill);
    
    // Make sure this doctor is authorized to approve this refill
    // Use loose equality (==) for comparison to handle string/number type differences
    if (parseInt(doctorId) != parseInt(refill.doctor_id)) {
      console.log(`Authorization failed: Doctor ID ${doctorId} doesn't match prescription's doctor ID ${refill.doctor_id}`);
      return res.status(403).json({ error: 'Not authorized to approve this refill' });
    }
    
    // Make sure the refill is still pending
    if (refill.status !== 'pending') {
      return res.status(400).json({ error: 'This refill request has already been processed' });
    }
    
    // Begin transaction
    await db.query('BEGIN');
    
    try {
      // Update the refill request status
      await db.query(`
        UPDATE refill_requests
        SET status = 'approved', processed_by = $1, updated_at = NOW()
        WHERE id = $2
      `, [doctorId, refillId]);
      
      // Update the prescription last_fill_date and decrement refills_remaining
      await db.query(`
        UPDATE prescriptions
        SET 
          last_filled = NOW(),
          refills_remaining = refills_remaining - 1,
          status = 'Active',
          updated_at = NOW()
        WHERE id = $1
      `, [refill.prescription_id]);
      
      // Create a notification for the patient
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        refill.patient_id,
        'REFILL_APPROVED',
        'Prescription Refill Approved',
        `Your refill request for ${refill.medication} has been approved`,
        refillId
      ]);
      
      await db.query('COMMIT');
      
      res.json({ message: 'Refill request approved successfully' });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error approving refill:', error);
    res.status(500).json({ error: 'Failed to approve refill' });
  }
});

// Reject a refill request (doctor only)
router.put('/refill/:id/reject', authenticateToken, async (req, res) => {
  try {
    if (req.user.userType !== 'doctor') {
      return res.status(403).json({ error: 'Only doctors can reject refills' });
    }
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Get the refill request and prescription
    const requestResult = await db.query(`
      SELECT r.*, p.doctor_id, p.medication
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      WHERE r.id = $1
    `, [id]);
    
    if (requestResult.rows.length === 0) {
      return res.status(404).json({ error: 'Refill request not found' });
    }
    
    const refillRequest = requestResult.rows[0];
    
    // Verify this doctor is the one who created the prescription
    if (refillRequest.doctor_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to reject this refill' });
    }
    
    // Start a transaction
    await db.query('BEGIN');
    
    try {
      // Update refill request
      await db.query(`
        UPDATE refill_requests
        SET status = 'rejected', notes = $1, processed_by = $2, updated_at = NOW()
        WHERE id = $3
      `, [reason, req.user.id, id]);
      
      // Update prescription status back to Active
      await db.query(`
        UPDATE prescriptions
        SET status = 'Active', updated_at = NOW()
        WHERE id = $1
      `, [refillRequest.prescription_id]);
      
      // Create notification for patient
      await db.query(`
        INSERT INTO notifications (user_id, type, title, message, related_id)
        VALUES ($1, $2, $3, $4, $5)
      `, [
        refillRequest.patient_id,
        'REFILL_REJECTED',
        'Refill Rejected',
        `Your refill request for ${refillRequest.medication} has been rejected`,
        id
      ]);
      
      await db.query('COMMIT');
      
      res.json({ message: 'Refill request rejected successfully' });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error rejecting refill:', error);
    res.status(500).json({ error: 'Failed to reject refill' });
  }
});

// Get pending refill requests for a doctor
router.get('/refill/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Check authorization
    if (req.user.userType !== 'doctor' || req.user.id !== parseInt(doctorId)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const result = await db.query(`
      SELECT r.*, 
             p.medication, p.dosage, p.instructions,
             u.name as patient_name, 
             TO_CHAR(r.created_at, 'Mon DD, YYYY') as requested_date
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      JOIN users u ON r.patient_id = u.id
      WHERE p.doctor_id = $1 AND r.status = 'pending'
      ORDER BY r.created_at DESC
    `, [doctorId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching refill requests:', error);
    res.status(500).json({ error: 'Failed to fetch refill requests' });
  }
});

// Get all refill requests for a patient
router.get('/refill/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check authorization
    if (req.user.userType === 'patient' && req.user.id !== parseInt(patientId)) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    
    const result = await db.query(`
      SELECT r.*, 
             p.medication, p.dosage,
             TO_CHAR(r.created_at, 'Mon DD, YYYY') as requested_date,
             TO_CHAR(r.updated_at, 'Mon DD, YYYY') as processed_date,
             u.name as doctor_name
      FROM refill_requests r
      JOIN prescriptions p ON r.prescription_id = p.id
      JOIN users u ON p.doctor_id = u.id
      WHERE r.patient_id = $1
      ORDER BY r.created_at DESC
    `, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient refill history:', error);
    res.status(500).json({ error: 'Failed to fetch refill history' });
  }
});

module.exports = router;