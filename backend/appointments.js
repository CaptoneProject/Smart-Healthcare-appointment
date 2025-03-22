const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const moment = require('moment');
const { sendAppointmentNotification } = require('./notifications');

// Database connection - Match the format from server.js
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'smartcare',
  password: process.env.DB_PASSWORD || 'vedang18',
  port: process.env.DB_PORT || 5432,
});

// Initialize tables
const initTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES users(id),
      doctor_id INTEGER REFERENCES users(id),
      date DATE NOT NULL,
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
    await pool.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `);
  } catch (error) {
    console.error('Error adding updated_at column:', error);
  }
};

initTables();

// Update checkAvailability function
const checkAvailability = async (doctorId, date, time) => {
  console.log('Checking availability for:', { doctorId, date, time });
  
  const result = await pool.query(
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

    console.log('Fetching appointments with params:', { userId, userType, status, startDate, endDate });

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

    const result = await pool.query(query, queryParams);
    console.log(`Found ${result.rows.length} appointments`);
    res.json(result.rows);

  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
  try {
    const { patientId, doctorId, date, time, duration, type, notes } = req.body;
    
    // Keep the date as is, no timezone conversion needed
    const formattedDate = date;

    // Check availability
    const isAvailable = await checkAvailability(doctorId, formattedDate, time);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    const result = await pool.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, date, time, duration, type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING id`,
      [patientId, doctorId, formattedDate, time, duration, type, notes]
    );

    // Send notification (implement your notification system here)
    sendAppointmentNotification({
      type: 'APPOINTMENT_CREATED',
      appointmentId: result.rows[0].id
    });

    res.status(201).json({
      message: 'Appointment created successfully',
      appointmentId: result.rows[0].id
    });
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

    await pool.query(
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

    await pool.query(
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

    // Simplified query without updated_at for now
    await pool.query(
      `UPDATE appointments 
       SET status = $1
       WHERE id = $2`,
      [status, id]
    );

    // If appointment is cancelled or rejected, the slot becomes available again
    if (status === 'cancelled' || status === 'rejected') {
      sendAppointmentNotification({
        type: `APPOINTMENT_${status.toUpperCase()}`,
        appointmentId: id
      });
    }

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
    const bookedSlots = await pool.query(
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

module.exports = router;