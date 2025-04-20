const { authenticateToken } = require('./middleware/auth');

const express = require('express');
const router = express.Router();
const moment = require('moment');
const notifications = require('./notifications');
const { sendAppointmentNotification } = notifications;
const db = require('./database');
const { normalizeDate, normalizeTime } = require('./utils/dateTime');

// Update checkAvailability function
const checkAvailability = async (doctorId, date, time) => {
  console.log('Checking availability for:', { doctorId, date, time });
  
  const result = await db.query(
    `SELECT id, status 
     FROM appointments 
     WHERE doctor_id = $1 
     AND date = $2 
     AND time = $3
     AND status NOT IN ('rejected', 'cancelled')`,
    [doctorId, date, time]
  );
  
  console.log('Availability check result:', result.rows);
  return result.rows.length === 0;
};

// Fix the GET appointments query
router.get('/', async (req, res) => {
  try {
    const { userId, userType, status, startDate, endDate } = req.query;

    let query = `
      SELECT a.*, 
             p.name as patient_name, 
             d.name as doctor_name,
             dc.specialization as specialty,
             a.status as current_status,
             to_char(a.date, 'YYYY-MM-DD') as date
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_credentials dc ON dc.doctor_id = a.doctor_id
      WHERE a.date BETWEEN $1 AND $2
    `;

    const queryParams = [startDate, endDate];
    let paramIndex = 3;

    if (userType === 'patient') {
      query += ` AND a.patient_id = $${paramIndex}`;
      queryParams.push(userId);
    } else if (userType === 'doctor') {
      query += ` AND a.doctor_id = $${paramIndex}`;
      queryParams.push(userId);
    }

    if (status) {
      paramIndex++;
      query += ` AND a.status = $${paramIndex}`;
      queryParams.push(status);
    }

    query += ' ORDER BY a.date, a.time';

    console.log('Final query:', query);
    console.log('Query params:', queryParams);

    const result = await db.query(query, queryParams);
    console.log(`Found ${result.rows.length} appointments`);
    res.json(result.rows);

  } catch (error) {
    console.error('Error details:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/appointments - UPDATED to create invoice
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, time, duration, type, notes } = req.body;
    
    const normalizedDate = normalizeDate(date);
    const normalizedTime = normalizeTime(time);

    // Check availability first
    const isAvailable = await checkAvailability(doctorId, normalizedDate, normalizedTime);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    // Start a transaction
    await db.query('BEGIN');

    try {
      // Create the appointment
      const appointmentResult = await db.query(
        `INSERT INTO appointments 
         (patient_id, doctor_id, date, time, duration, type, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
         RETURNING *`,
        [patientId, doctorId, normalizedDate, normalizedTime, duration, type, notes]
      );

      const appointment = appointmentResult.rows[0];
      
      // Get doctor information for invoice
      const doctorResult = await db.query(
        'SELECT name FROM users WHERE id = $1',
        [doctorId]
      );
      
      // Get patient information
      const patientResult = await db.query(
        'SELECT name FROM users WHERE id = $1',
        [patientId]
      );
      
      // Set fee based on appointment type
      let appointmentFee = 50; // Default consultation fee
      if (type.toLowerCase().includes('specialist')) {
        appointmentFee = 100;
      } else if (type.toLowerCase().includes('follow')) {
        appointmentFee = 30;
      } else if (type.toLowerCase().includes('urgent')) {
        appointmentFee = 80;
      }
      
      // Create due date (3 days before appointment date)
      const dueDate = new Date(normalizedDate);
      dueDate.setDate(dueDate.getDate() - 3);
      
      // Create invoice for the appointment
      const invoiceResult = await db.query(
        `INSERT INTO invoices 
         (patient_id, appointment_id, amount, status, due_date, description)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          patientId, 
          appointment.id, 
          appointmentFee, 
          'pending', 
          dueDate.toISOString().split('T')[0],
          `Appointment with Dr. ${doctorResult.rows[0].name} on ${normalizedDate} at ${normalizedTime}`
        ]
      );
      
      const invoice = invoiceResult.rows[0];

      // Add notification for both patient and doctor
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES 
         ($1, 'APPOINTMENT_CREATED', 'New Appointment', $2, $3),
         ($4, 'APPOINTMENT_CREATED', 'New Appointment', $5, $3)`,
        [
          patientId,
          `Appointment scheduled with Dr. ${doctorResult.rows[0].name} for ${normalizedDate} at ${normalizedTime}`,
          appointment.id,
          doctorId,
          `New appointment with patient ${patientResult.rows[0].name} for ${normalizedDate} at ${normalizedTime}`
        ]
      );

      // Add invoice notification for patient
      await db.query(
        `INSERT INTO notifications (user_id, type, title, message, related_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          patientId,
          'INVOICE_CREATED',
          'New Invoice',
          `Invoice created for your appointment with Dr. ${doctorResult.rows[0].name}. Amount: $${appointmentFee.toFixed(2)}`,
          invoice.id
        ]
      );

      // Add to system activities
      await db.query(
        `INSERT INTO system_activities (type, message, related_id) 
         VALUES ($1, $2, $3)`,
        [
          'APPOINTMENT_CREATED', 
          `New appointment scheduled: ${patientResult.rows[0].name} with Dr. ${doctorResult.rows[0].name} on ${normalizedDate}`, 
          appointment.id
        ]
      );

      // Add another activity for invoice
      await db.query(
        `INSERT INTO system_activities (type, message, related_id) 
         VALUES ($1, $2, $3)`,
        [
          'INVOICE_CREATED', 
          `Invoice created for appointment #${appointment.id}, amount: $${appointmentFee.toFixed(2)}`, 
          invoice.id
        ]
      );

      // Send appointment notification
      await sendAppointmentNotification({
        type: 'APPOINTMENT_SCHEDULED',
        appointmentId: appointment.id
      });

      // Commit the transaction
      await db.query('COMMIT');

      // Return appointment with invoice details
      res.status(201).json({
        appointment: appointment,
        invoice: invoice
      });
    } catch (err) {
      // Rollback on error
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reschedule appointment
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time } = req.body;

    // Check new time availability
    const isAvailable = await checkAvailability(req.body.doctorId, date, time);
    if (!isAvailable) {
      return res.status(400).json({ error: 'New time slot not available' });
    }

    await db.query(
      `UPDATE appointments 
       SET date = $1, time = $2, status = 'rescheduled'
       WHERE id = $3`,
      [date, time, id]
    );

    // Send notification
    sendAppointmentNotification({
      type: 'APPOINTMENT_RESCHEDULED',
      appointmentId: id
    });

    const appointmentDetails = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    const appt = appointmentDetails.rows[0];

    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'APPOINTMENT_RESCHEDULED', 
        `Appointment rescheduled: ${appt.patient_name} with Dr. ${appt.doctor_name} on ${appt.date}`, 
        id
      ]
    );

    res.json({ message: 'Appointment rescheduled successfully' });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel appointment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE appointments 
       SET status = 'cancelled'
       WHERE id = $1`,
      [id]
    );

    // Send notification
    sendAppointmentNotification({
      type: 'APPOINTMENT_CANCELLED',
      appointmentId: id
    });

    const appointmentDetails = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    const appt = appointmentDetails.rows[0];

    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'APPOINTMENT_CANCELLED', 
        `Appointment cancelled: ${appt.patient_name} with Dr. ${appt.doctor_name} on ${appt.date}`, 
        id
      ]
    );

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update appointment status
router.put('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'confirmed', 'completed', 'cancelled', 'rejected', 'scheduled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // First retrieve the appointment details to ensure we have all information
    const appointmentQuery = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (appointmentQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    const appt = appointmentQuery.rows[0];
    
    // Then update the status
    await db.query(
      `UPDATE appointments 
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    // Format the date properly for the activity message
    const formattedDate = appt.date ? new Date(appt.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'unknown date';
    
    // Send notification with the retrieved details
    await sendAppointmentNotification({
      type: `APPOINTMENT_${status.toUpperCase()}`,
      appointmentId: id
    });

    // Create the activity record with the nicely formatted date
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        `APPOINTMENT_${status.toUpperCase()}`, 
        `Appointment ${status}: ${appt.patient_name} with Dr. ${appt.doctor_name} on ${formattedDate}`, 
        id
      ]
    );

    res.json({ message: 'Appointment status updated successfully' });
  } catch (error) {
    console.error('Error updating appointment status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update GET /available-slots endpoint
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    // First get all booked appointments for that date
    const bookedSlots = await db.query(
      `SELECT time 
       FROM appointments 
       WHERE doctor_id = $1 
       AND date = $2 
       AND status NOT IN ('rejected', 'cancelled')`,
      [doctorId, date]
    );

    console.log('Checking slots for date:', date);
    console.log('Booked slots:', bookedSlots.rows);

    // Rest of your available slots logic...
  } catch (error) {
    console.error('Error getting available slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// In your cancellation route
router.put('/:id/cancel', async (req, res) => {
  try {
    // ... existing cancellation code ...

    await sendAppointmentNotification({
      type: 'APPOINTMENT_CANCELLED',
      appointmentId: id,
      cancelledBy: req.user.userType // 'patient' or 'doctor'
    });

    const appointmentDetails = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    const appt = appointmentDetails.rows[0];

    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'APPOINTMENT_CANCELLED', 
        `Appointment cancelled: ${appt.patient_name} with Dr. ${appt.doctor_name} on ${appt.date}`, 
        id
      ]
    );

    res.json({ message: 'Appointment cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// In appointments.js
router.put('/:id/reschedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, time, rescheduledBy, oldDate, oldTime } = req.body;

    // Get current appointment details
    const appointmentQuery = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name,
              reschedule_count, patient_id, doctor_id
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [id]
    );

    const appt = appointmentQuery.rows[0];

    // Add patient rescheduling limit check
    if (rescheduledBy === 'patient' && appt.reschedule_count >= 1) {
      return res.status(403).json({ 
        error: 'As a patient, you can only reschedule an appointment once'
      });
    }

    // Update appointment
    await db.query(
      `UPDATE appointments 
       SET date = $1, 
           time = $2, 
           reschedule_count = reschedule_count + 1,
           status = 'confirmed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [date, time, id]
    );

    // Send notifications with complete data
    await sendAppointmentNotification({
      type: 'APPOINTMENT_RESCHEDULED',
      appointmentId: id,
      rescheduledBy,
      oldDate: oldDate, 
      oldTime: oldTime,
      newDate: date,
      newTime: time,
      patient_name: appt.patient_name,
      doctor_name: appt.doctor_name,
      patient_id: appt.patient_id,
      doctor_id: appt.doctor_id
    });

    // Create system activity log
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'APPOINTMENT_RESCHEDULED',
        `Appointment rescheduled: ${appt.patient_name} with Dr. ${appt.doctor_name} from ${oldDate}, ${oldTime}, to ${date}, ${time}`,
        id
      ]
    );

    res.json({ 
      message: 'Appointment rescheduled successfully',
      appointment: {
        ...appt,
        date,
        time,
        status: 'confirmed'
      }
    });

  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get invoice for appointment
router.get('/:id/invoice', async (req, res) => {
  try {
    const { id } = req.params;
    
    const invoiceResult = await db.query(
      `SELECT i.* 
       FROM invoices i
       WHERE i.appointment_id = $1`,
      [id]
    );
    
    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'No invoice found for this appointment' });
    }
    
    res.json(invoiceResult.rows[0]);
  } catch (error) {
    console.error('Error fetching invoice for appointment:', error);
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// Get confirmed appointments with pending payments for a patient
router.get('/patient/:patientId/confirmed-unpaid', async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Ensure the requesting user is accessing their own data
    if (req.user && (req.user.id !== parseInt(patientId) && req.user.userType !== 'admin')) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Query appointments that are confirmed but have an APPROVED invoice
    // (not a pending invoice) - this is the key change
    const result = await db.query(`
      SELECT a.id, a.date, a.time, a.status, 
             u.name as doctor_name,
             i.id as invoice_id, i.amount, 
             (i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)) as remaining_amount,
             i.status as invoice_status
      FROM appointments a
      JOIN users u ON a.doctor_id = u.id
      JOIN invoices i ON a.id = i.appointment_id
      WHERE a.patient_id = $1 
      AND a.status = 'confirmed' 
      AND i.status = 'approved'  -- Changed from 'pending' to 'approved'
      ORDER BY a.date ASC, a.time ASC
    `, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error getting confirmed unpaid appointments:', error);
    res.status(500).json({ error: 'Failed to get appointments' });
  }
});

// Add this route to get a single appointment by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(`
      SELECT a.*, 
             p.name as patient_name, 
             d.name as doctor_name,
             dc.specialization as specialty,
             to_char(a.date, 'YYYY-MM-DD') as date
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      LEFT JOIN doctor_credentials dc ON dc.doctor_id = a.doctor_id
      WHERE a.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Appointment not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error getting appointment by ID:', error);
    res.status(500).json({ error: 'Failed to get appointment' });
  }
});

// Add this route to get appointments for a specific doctor

// Get all appointments for a specific doctor
router.get('/doctor/:doctorId', authenticateToken, async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // Ensure the requesting user is accessing their own data
    if (req.user.userId !== parseInt(doctorId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(`
      SELECT a.*, 
             u.name as patient_name
      FROM appointments a
      JOIN users u ON a.patient_id = u.id
      WHERE a.doctor_id = $1
      ORDER BY a.date DESC, a.time ASC
    `, [doctorId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

module.exports = router;