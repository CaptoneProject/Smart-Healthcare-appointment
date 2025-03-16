const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Initialize tables
const initTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS doctor_schedules (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER REFERENCES users(id),
      day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
      start_time TIME,
      end_time TIME,
      break_start TIME,
      break_end TIME,
      max_patients INTEGER,
      is_available BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patient_visits (
      id SERIAL PRIMARY KEY,
      patient_id INTEGER REFERENCES users(id),
      doctor_id INTEGER REFERENCES users(id),
      appointment_id INTEGER REFERENCES appointments(id),
      visit_date DATE,
      visit_time TIME,
      status VARCHAR(50),
      symptoms TEXT,
      diagnosis TEXT,
      prescription TEXT,
      notes TEXT,
      follow_up_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS doctor_leaves (
      id SERIAL PRIMARY KEY,
      doctor_id INTEGER REFERENCES users(id),
      start_date DATE,
      end_date DATE,
      leave_type VARCHAR(50),
      reason TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

initTables();

// Set doctor's weekly schedule
router.post('/doctors/schedule', async (req, res) => {
  try {
    const { doctorId, schedules } = req.body;

    // Delete existing schedules
    await pool.query(
      'DELETE FROM doctor_schedules WHERE doctor_id = $1',
      [doctorId]
    );

    // Insert new schedules
    for (const schedule of schedules) {
      await pool.query(
        `INSERT INTO doctor_schedules 
         (doctor_id, day_of_week, start_time, end_time, break_start, break_end, max_patients)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          doctorId,
          schedule.dayOfWeek,
          schedule.startTime,
          schedule.endTime,
          schedule.breakStart,
          schedule.breakEnd,
          schedule.maxPatients
        ]
      );
    }

    res.json({ message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get doctor's schedule
router.get('/doctors/:id/schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Record patient visit
router.post('/visits', async (req, res) => {
  try {
    const {
      patientId,
      doctorId,
      appointmentId,
      symptoms,
      diagnosis,
      prescription,
      notes,
      followUpDate
    } = req.body;

    const result = await pool.query(
      `INSERT INTO patient_visits 
       (patient_id, doctor_id, appointment_id, visit_date, visit_time,
        status, symptoms, diagnosis, prescription, notes, follow_up_date)
       VALUES ($1, $2, $3, CURRENT_DATE, CURRENT_TIME,
        'completed', $4, $5, $6, $7, $8)
       RETURNING id`,
      [
        patientId,
        doctorId,
        appointmentId,
        symptoms,
        diagnosis,
        prescription,
        notes,
        followUpDate
      ]
    );

    // Update appointment status
    await pool.query(
      'UPDATE appointments SET status = $1 WHERE id = $2',
      ['completed', appointmentId]
    );

    res.status(201).json({
      message: 'Visit recorded successfully',
      visitId: result.rows[0].id
    });
  } catch (error) {
    console.error('Error recording visit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get patient visits history
router.get('/patients/:id/visits', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      `SELECT v.*, d.name as doctor_name 
       FROM patient_visits v
       JOIN users d ON v.doctor_id = d.id
       WHERE v.patient_id = $1
       ORDER BY v.visit_date DESC, v.visit_time DESC`,
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching visits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Request leave
router.post('/doctors/leave', async (req, res) => {
  try {
    const { doctorId, startDate, endDate, leaveType, reason } = req.body;

    // Check for conflicting appointments
    const conflictingAppointments = await pool.query(
      `SELECT COUNT(*) FROM appointments
       WHERE doctor_id = $1
       AND date BETWEEN $2 AND $3
       AND status = 'scheduled'`,
      [doctorId, startDate, endDate]
    );

    if (conflictingAppointments.rows[0].count > 0) {
      return res.status(400).json({
        error: 'Cannot request leave. You have scheduled appointments during this period.'
      });
    }

    await pool.query(
      `INSERT INTO doctor_leaves 
       (doctor_id, start_date, end_date, leave_type, reason)
       VALUES ($1, $2, $3, $4, $5)`,
      [doctorId, startDate, endDate, leaveType, reason]
    );

    res.status(201).json({ message: 'Leave request submitted successfully' });
  } catch (error) {
    console.error('Error requesting leave:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get doctor's daily schedule with patients
router.get('/doctors/:id/daily-schedule', async (req, res) => {
  try {
    const { id } = req.params;
    const { date } = req.query;

    const result = await pool.query(
      `SELECT a.*, p.name as patient_name, p.phone as patient_phone
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       WHERE a.doctor_id = $1 AND a.date = $2
       ORDER BY a.time`,
      [id, date]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching daily schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;