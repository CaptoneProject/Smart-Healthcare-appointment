const express = require('express');
const router = express.Router();
const moment = require('moment');
const notifications = require('./notifications');
const { sendAppointmentNotification } = notifications;
const db = require('./database'); // This is the shared database configuration!
const { normalizeDate, normalizeTime } = require('./utils/dateTime');

// Initialize tables
const initTables = async () => {
  await db.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES users(id),
      doctor_id INTEGER REFERENCES users(id),

      time TIME NOT NULL,
      duration INTEGER NOT NULL, -- in minutes
      type VARCHAR(50),
      status VARCHAR(20) DEFAULT 'scheduled',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctor_availability (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER REFERENCES users(id),
      day_of_week INTEGER, -- 0 = Sunday, 6 = Saturday
      start_time TIME,
      end_time TIME
    );
  `);
  
  // Add column if it doesn't exist
  try {
    await db.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
    await db.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0
    `);
  } catch (error) {
    console.error('Error adding updated_at column:', error);
  }
};

initTables();

// Update checkAvailability function
const checkAvailability = async (doctorId, date, time) => {
  console.log('Checking availability for:', { doctorId, date, time });
  
  const result = await db.query(
    `SELECT id, status 
     FROM appointments 
     WHERE doctor_id = $1 
     AND date = $2 
     AND time = $3
     AND status NOT IN ('rejected', 'cancelled')`, // Modified this line to exclude rejected and cancelled
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
             dc.specialization as specialty,  -- Use SQL comment style
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

    console.log('Final query:', query); // Debug log
    console.log('Query params:', queryParams); // Debug log

    const result = await db.query(query, queryParams);
    console.log(`Found ${result.rows.length} appointments`);
    res.json(result.rows);

  } catch (error) {
    console.error('Error details:', error); // Add detailed error logging
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// POST /api/appointments
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

    const result = await db.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, date, time, duration, type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING *`,
      [patientId, doctorId, normalizedDate, normalizedTime, duration, type, notes]
    );

    // Add this after successful creation
    await sendAppointmentNotification({
      type: 'APPOINTMENT_SCHEDULED',
      appointmentId: result.rows[0].id
    });

    // Add notification for both patient and doctor
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES 
       ($1, 'APPOINTMENT_CREATED', 'New Appointment', $2, $3),
       ($4, 'APPOINTMENT_CREATED', 'New Appointment', $5, $3)`,
      [
        req.body.patient_id,
        `Appointment scheduled with Dr. ${req.body.doctor_name} for ${req.body.date} at ${req.body.time}`,
        result.rows[0].id,
        req.body.doctor_id,
        `New appointment with patient ${req.body.patient_name} for ${req.body.date} at ${req.body.time}`
      ]
    );

    // After creating a new appointment
    const appointmentDetails = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [result.rows[0].id]
    );

    const appt = appointmentDetails.rows[0];

    // Format the date properly
    const formattedDate = appt.date ? new Date(appt.date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) : 'unknown date';

    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'APPOINTMENT_CREATED', 
        `New appointment scheduled: ${appt.patient_name} with Dr. ${appt.doctor_name} on ${formattedDate}`, 
        result.rows[0].id
      ]
    );

    res.status(201).json(result.rows[0]);
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
       AND status NOT IN ('rejected', 'cancelled')`, // Modified this line to exclude rejected and cancelled
      [doctorId, date]
    );

    console.log('Checking slots for date:', date); // Add for debugging
    console.log('Booked slots:', bookedSlots.rows); // Add for debugging

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

module.exports = router;