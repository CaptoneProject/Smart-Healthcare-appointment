const express = require('express');
const router = express.Router();
const db = require('./database'); // Add this line to use the shared database module

// Initialize tables
const initTables = async () => {
  try {
    // First check if the table exists with the old structure
    const tableCheck = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'doctor_schedules' 
      AND column_name = 'break_start'
    `);
    
    // If the break_start column doesn't exist, drop and recreate the table
    if (tableCheck.rows.length === 0) {
      console.log('Recreating doctor_schedules table with updated structure...');
      
      // Drop the old table if it exists (cascade to handle references)
      await db.query(`DROP TABLE IF EXISTS doctor_schedules CASCADE`);
      
      // Create the table with the correct structure
      await db.query(`
        CREATE TABLE doctor_schedules (
          id SERIAL PRIMARY KEY,
          doctor_id INTEGER REFERENCES users(id),
          day_of_week INTEGER, -- 0-6 (Sunday-Saturday)
          start_time TIME,
          end_time TIME,
          break_start TIME,
          break_end TIME,
          max_patients INTEGER DEFAULT 4,
          is_available BOOLEAN DEFAULT true,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      console.log('Table doctor_schedules recreated successfully.');
    }
    
    // Continue with other table creation...
    await db.query(`
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

      CREATE TABLE IF NOT EXISTS doctor_credentials (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id) UNIQUE,
        degree VARCHAR(100),
        license_number VARCHAR(100),
        specialization VARCHAR(100),
        subspecialization VARCHAR(100),
        years_of_experience INTEGER,
        biography TEXT,
        education_history TEXT,
        verification_status VARCHAR(20) DEFAULT 'pending',
        verified_by INTEGER,
        verification_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Error initializing tables:', error);
  }
};

initTables();

// Set doctor's weekly schedule
router.post('/doctors/schedule', async (req, res) => {
  try {
    const { doctorId, schedules } = req.body;

    // Delete existing schedules
    await db.query(
      'DELETE FROM doctor_schedules WHERE doctor_id = $1',
      [doctorId]
    );

    // Insert new schedules
    for (const schedule of schedules) {
      await db.query(
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
    const result = await db.query(
      'SELECT * FROM doctor_schedules WHERE doctor_id = $1 ORDER BY day_of_week',
      [id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get doctor's schedule
router.get('/schedule/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query(
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

    const result = await db.query(
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
    await db.query(
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
    const result = await db.query(
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
    const conflictingAppointments = await db.query(
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

    await db.query(
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

    const result = await db.query(
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

// Get list of doctors
router.get('/doctors', async (req, res) => {
  try {
    // Join with doctor_credentials to get the verification status
    const result = await db.query(`
      SELECT u.id, u.name, 
             COALESCE(d.specialization, 'General Practitioner') as specialty, 
             d.verification_status
      FROM users u
      LEFT JOIN doctor_credentials d ON u.id = d.doctor_id
      WHERE u.user_type = 'doctor'
      AND (d.verification_status = 'approved' OR d.verification_status IS NULL)
      ORDER BY u.name
    `);
    
    // Only return approved doctors
    const approvedDoctors = result.rows.filter(doctor => 
      doctor.verification_status === 'approved'
    );
    
    res.json(approvedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to handle doctor credentials submission
router.post('/credentials', async (req, res) => {
  try {
    const { 
      doctorId, 
      degree, 
      licenseNumber, 
      specialization, 
      yearsOfExperience,
      biography,
      educationHistory
    } = req.body;

    // Store in database with pending status
    await db.query(
      `INSERT INTO doctor_credentials 
       (doctor_id, degree, license_number, specialization, years_of_experience, 
        biography, education_history, verification_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (doctor_id) 
       DO UPDATE SET
         degree = $2,
         license_number = $3,
         specialization = $4,
         years_of_experience = $5,
         biography = $6,
         education_history = $7,
         verification_status = $8,
         updated_at = NOW()`,
      [doctorId, degree, licenseNumber, specialization, yearsOfExperience, 
       biography, educationHistory, 'pending']
    );

    res.status(201).json({ 
      message: 'Credentials submitted successfully for verification' 
    });
  } catch (error) {
    console.error('Error submitting credentials:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to check doctor credentials status
router.get('/doctors/:id/credentials-status', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      'SELECT id FROM doctor_credentials WHERE doctor_id = $1',
      [id]
    );
    
    res.json({ 
      hasSubmittedCredentials: result.rows.length > 0 
    });
  } catch (error) {
    console.error('Error checking credentials status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this endpoint near the credentials endpoint
router.get('/credentials-status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if doctor has submitted credentials
    const result = await db.query(
      `SELECT * FROM doctor_credentials 
       WHERE doctor_id = $1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ 
        hasSubmittedCredentials: false 
      });
    }
    
    const credentials = result.rows[0];
    
    res.json({
      hasSubmittedCredentials: true,
      status: credentials.verification_status,
      isApproved: credentials.verification_status === 'approved'
    });
  } catch (error) {
    console.error('Error checking credentials status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add this route to your doctor routes
router.get('/status/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await db.query(
      `SELECT verification_status as status
       FROM doctor_credentials 
       WHERE doctor_id = $1 
       ORDER BY updated_at DESC 
       LIMIT 1`,
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.json({ status: 'pending' });
    }
    
    res.json({
      status: result.rows[0].status,
      hasSubmittedCredentials: true
    });
  } catch (error) {
    console.error('Error checking doctor status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add schedule slot
router.post('/schedule-slots', async (req, res) => {
  try {
    const {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      maxPatients
    } = req.body;

    const result = await db.query(
      `INSERT INTO doctor_schedules 
       (doctor_id, day_of_week, start_time, end_time, break_start, break_end, max_patients)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [
        doctorId,
        dayOfWeek,
        startTime,
        endTime,
        breakStart || null,
        breakEnd || null,
        maxPatients || 4
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding schedule slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update schedule slot
router.put('/schedule-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      doctorId,
      dayOfWeek,
      startTime,
      endTime,
      breakStart,
      breakEnd,
      maxPatients
    } = req.body;

    const result = await db.query(
      `UPDATE doctor_schedules 
       SET day_of_week = $1, 
           start_time = $2, 
           end_time = $3, 
           break_start = $4, 
           break_end = $5, 
           max_patients = $6
       WHERE id = $7 AND doctor_id = $8
       RETURNING *`,
      [
        dayOfWeek,
        startTime,
        endTime,
        breakStart || null,
        breakEnd || null,
        maxPatients || 4,
        id,
        doctorId
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule slot not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating schedule slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete schedule slot
router.delete('/schedule-slots/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { doctorId } = req.query;

    const result = await db.query(
      'DELETE FROM doctor_schedules WHERE id = $1 AND doctor_id = $2 RETURNING *',
      [id, doctorId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Schedule slot not found' });
    }

    res.json({ message: 'Schedule slot deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule slot:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get available time slots for a doctor on a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date are required' });
    }
    
    // Get day of week (0-6, Sunday-Saturday)
    const dayOfWeek = new Date(date).getDay();
    
    // Get the doctor's schedule for this day
    const scheduleResult = await db.query(
      `SELECT * FROM doctor_schedules 
       WHERE doctor_id = $1 AND day_of_week = $2`,
      [doctorId, dayOfWeek]
    );
    
    if (scheduleResult.rows.length === 0) {
      return res.json([]);  // No schedule for this day
    }
    
    const schedule = scheduleResult.rows[0];
    
    // Get all existing appointments for this doctor on this date
    const appointmentsResult = await db.query(
      `SELECT time FROM appointments 
       WHERE doctor_id = $1 
       AND date = $2 
       AND status NOT IN ('rejected', 'cancelled')`, // Modified to exclude rejected and cancelled
      [doctorId, date]
    );
    
    const bookedTimes = appointmentsResult.rows.map(row => row.time);
    
    // Generate available time slots
    const availableSlots = [];
    const startHour = parseInt(schedule.start_time.split(':')[0], 10);
    const endHour = parseInt(schedule.end_time.split(':')[0], 10);
    const breakStartHour = schedule.break_start ? parseInt(schedule.break_start.split(':')[0], 10) : -1;
    const breakEndHour = schedule.break_end ? parseInt(schedule.break_end.split(':')[0], 10) : -1;
    
    // Calculate slots per hour based on max_patients
    const slotsPerHour = Math.min(schedule.max_patients || 4, 4); // Cap at 4 slots per hour
    const minutesPerSlot = 60 / slotsPerHour;
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip break time
      if (hour >= breakStartHour && hour < breakEndHour) continue;
      
      for (let slot = 0; slot < slotsPerHour; slot++) {
        const minutes = slot * minutesPerSlot;
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Check if this time is already booked
        const isBooked = bookedTimes.some(bookedTime => 
          bookedTime.substring(0, 5) === timeString
        );
        
        if (!isBooked) {
          availableSlots.push({
            time: timeString,
            available: true
          });
        }
      }
    }
    
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;