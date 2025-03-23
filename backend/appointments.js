const express = require('express');
const router = express.Router();
const moment = require('moment');
const { sendAppointmentNotification } = require('./notifications');
const db = require('./database'); // This is the shared database configuration!

// Initialize tables
// const initTables = async () => {
//   await db.query(`
//     CREATE TABLE IF NOT EXISTS appointments (
//       id SERIAL PRIMARY KEY,
//       patient_id INTEGER REFERENCES users(id),
//       doctor_id INTEGER REFERENCES users(id),
//       date DATE NOT NULL,
//       time TIME NOT NULL,
//       duration INTEGER NOT NULL, -- in minutes
//       type VARCHAR(50),
//       status VARCHAR(20) DEFAULT 'scheduled',
//       notes TEXT,
//       created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//       updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     );

//     CREATE TABLE IF NOT EXISTS doctor_availability (
//       id SERIAL PRIMARY KEY,
//       doctor_id INTEGER REFERENCES users(id),
//       day_of_week INTEGER, -- 0 = Sunday, 6 = Saturday
//       start_time TIME,
//       end_time TIME
//     );
//   `);
  
//   // Add column if it doesn't exist
//   try {
//     await db.query(`
//       ALTER TABLE appointments 
//       ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//     `);
//   } catch (error) {
//     console.error('Error adding updated_at column:', error);
//   }
// };

// initTables();

// Update checkAvailability function
const checkAvailability = async (doctorId, date, time) => {
  console.log('Checking availability for:', { doctorId, date, time });
  
  // Ensure consistent time format - trim to HH:MM
  const formattedTime = time.toString().substring(0, 5);
  
  console.log('Formatted time for check:', formattedTime);
  
  const result = await db.query(
    `SELECT id, status 
     FROM appointments 
     WHERE doctor_id = $1 
     AND date = $2 
     AND time::text LIKE $3 || '%'
     AND status NOT IN ('rejected', 'cancelled')`,
    [doctorId, date, formattedTime]
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
    
    console.log('Creating appointment with:', { date, time });
    
    // Use the date exactly as provided without any conversion
    const formattedDate = date;
    
    // Ensure time is in the standard HH:MM format
    const formattedTime = time.toString().substring(0, 5);
    
    console.log('Formatted for database:', { formattedDate, formattedTime });

    // Check availability
    const isAvailable = await checkAvailability(doctorId, formattedDate, formattedTime);
    if (!isAvailable) {
      return res.status(400).json({ error: 'Time slot not available' });
    }

    const result = await db.query(
      `INSERT INTO appointments 
       (patient_id, doctor_id, date, time, duration, type, notes, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
       RETURNING id`,
      [patientId, doctorId, formattedDate, formattedTime, duration, type, notes]
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
    const { date, time, doctorId } = req.body;
    
    // Ensure time is in the standard HH:MM format
    const formattedTime = time.toString().substring(0, 5);

    // Check new time availability
    const isAvailable = await checkAvailability(doctorId, date, formattedTime);
    if (!isAvailable) {
      return res.status(400).json({ error: 'New time slot not available' });
    }

    await db.query(
      `UPDATE appointments 
       SET date = $1, time = $2, status = 'rescheduled'
       WHERE id = $3`,
      [date, formattedTime, id]
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
    await db.query(
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

// Get available time slots
router.get('/available-slots', async (req, res) => {
  try {
    const { doctorId, date } = req.query;
    
    if (!doctorId || !date) {
      return res.status(400).json({ error: 'Doctor ID and date are required' });
    }
    
    console.log('Checking available slots for date:', date);
    
    // Get day of week (0-6, Sunday-Saturday)
    const dayOfWeek = new Date(date + 'T00:00:00Z').getUTCDay();
    
    console.log('Day of week for requested date:', dayOfWeek);
    
    // Get the doctor's schedule for this day
    const scheduleResult = await db.query(
      `SELECT * FROM doctor_schedules 
       WHERE doctor_id = $1 AND day_of_week = $2`,
      [doctorId, dayOfWeek]
    );
    
    if (scheduleResult.rows.length === 0) {
      console.log('No schedule found for this day');
      return res.json([]);  // No schedule for this day
    }
    
    const schedule = scheduleResult.rows[0];
    console.log('Found schedule:', schedule);
    
    // Get all existing appointments for this doctor on this date
    const appointmentsResult = await db.query(
      `SELECT time 
       FROM appointments 
       WHERE doctor_id = $1 
       AND date = $2 
       AND status NOT IN ('rejected', 'cancelled')`,
      [doctorId, date]
    );
    
    // Format booked times consistently in HH:MM format
    const bookedTimes = appointmentsResult.rows.map(row => {
      const timeStr = row.time.toString();
      return timeStr.substring(0, 5);
    });
    
    console.log('Booked times:', bookedTimes);
    
    // Generate available time slots
    const availableSlots = [];
    
    // Parse start and end times consistently
    let startTimeParts = schedule.start_time.toString().split(':');
    let endTimeParts = schedule.end_time.toString().split(':');
    
    const startHour = parseInt(startTimeParts[0], 10);
    const endHour = parseInt(endTimeParts[0], 10);
    
    // Handle break times if they exist
    let breakStartHour = -1;
    let breakEndHour = -1;
    
    if (schedule.break_start) {
      let breakStartParts = schedule.break_start.toString().split(':');
      breakStartHour = parseInt(breakStartParts[0], 10);
    }
    
    if (schedule.break_end) {
      let breakEndParts = schedule.break_end.toString().split(':');
      breakEndHour = parseInt(breakEndParts[0], 10);
    }
    
    // Calculate slots per hour based on max_patients
    const slotsPerHour = Math.min(schedule.max_patients || 4, 4); // Cap at 4 slots per hour
    const minutesPerSlot = 60 / slotsPerHour;
    
    console.log('Generating slots with:', {
      startHour,
      endHour,
      breakStartHour,
      breakEndHour,
      slotsPerHour,
      minutesPerSlot
    });
    
    for (let hour = startHour; hour < endHour; hour++) {
      // Skip break time
      if (hour >= breakStartHour && hour < breakEndHour) continue;
      
      for (let slot = 0; slot < slotsPerHour; slot++) {
        const minutes = Math.floor(slot * minutesPerSlot);
        const timeString = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        
        // Check if this time is already booked
        const isBooked = bookedTimes.includes(timeString);
        
        if (!isBooked) {
          availableSlots.push({
            time: timeString,
            available: true
          });
        }
      }
    }
    
    console.log(`Generated ${availableSlots.length} available slots`);
    res.json(availableSlots);
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;