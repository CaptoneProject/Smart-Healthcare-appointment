const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const db = require('./database'); // Add this line to use the shared database module
const { formatDate, formatTime } = require('./utils/dateTime');

// Update the initNotificationsTable function
const initNotificationsTable = async () => {
  try {
    // Drop the existing table first to avoid conflicts
    await db.query('DROP TABLE IF EXISTS notifications CASCADE');
    
    // Create the table with all required columns
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Notifications table initialized successfully');
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }
};

// Add this to ensure the table is recreated with the correct schema
initNotificationsTable();

// Initialize tables
const initTables = async () => {
  try {
    await db.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        type VARCHAR(50) NOT NULL,
        title VARCHAR(100) NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
  } catch (error) {
    console.error('Error creating notifications table:', error);
  }
};

// Call this when your server starts
initTables();

// Email configuration
const emailTransporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Send notification
const sendNotification = async ({ userId, type, message }) => {
  try {
    // Save to database
    await db.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
      [userId, type, message]
    );

    // Get user email
    const userResult = await db.query(
      'SELECT email, name FROM users WHERE id = $1',
      [userId]
    );
    const user = userResult.rows[0];

    // Send email
    await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: user.email,
      subject: `Healthcare Appointment ${type}`,
      text: message
    });

  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

// Send appointment reminder
const sendAppointmentReminder = async (appointment) => {
  const message = `
    Reminder: You have an appointment on ${appointment.date} at ${appointment.time}.
    Location: ${appointment.location}
    Doctor: ${appointment.doctor_name}
  `;

  await sendNotification({
    userId: appointment.patient_id,
    type: 'APPOINTMENT_REMINDER',
    message
  });
};

// Schedule reminders for tomorrow's appointments
const scheduleReminders = async () => {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const result = await db.query(
      `SELECT a.*, d.name as doctor_name
       FROM appointments a
       JOIN users d ON a.doctor_id = d.id
       WHERE date = $1 AND status = 'scheduled'`,
      [tomorrow]
    );

    for (const appointment of result.rows) {
      await sendAppointmentReminder(appointment);
    }
  } catch (error) {
    console.error('Error scheduling reminders:', error);
  }
};

// Run reminder scheduler every day at midnight
setInterval(scheduleReminders, 24 * 60 * 60 * 1000);

// Get user notifications
router.get('/', async (req, res) => {
  try {
    const { userId } = req.query;
    console.log('Fetching notifications for userId:', userId);

    if (!userId) {
      return res.status(400).json({ error: 'userId is required' });
    }

    const result = await db.query(
      `SELECT 
        id, 
        type, 
        title, 
        message, 
        is_read, 
        created_at, 
        related_id
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 50`,
      [userId]
    );

    console.log(`Found ${result.rows.length} notifications`);
    return res.json(result.rows);

  } catch (error) {
    console.error('Error fetching notifications:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message 
    });
  }
});

// Mark notification as read
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE id = $1`,
      [id]
    );

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Error updating notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add these helper functions

// Get appointment details by ID
const getAppointmentDetails = async (appointmentId) => {
  try {
    const result = await db.query(
      `SELECT a.*, p.name as patient_name, d.name as doctor_name
       FROM appointments a
       JOIN users p ON a.patient_id = p.id
       JOIN users d ON a.doctor_id = d.id
       WHERE a.id = $1`,
      [appointmentId]
    );
    return result.rows[0];
  } catch (error) {
    console.error('Error getting appointment details:', error);
    return null;
  }
};

// Update the createNotification function
const createNotification = async (notification) => {
  try {
    const result = await db.query(
      `INSERT INTO notifications
       (user_id, type, title, message, related_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)
       RETURNING *`,
      [
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.relatedId || null
      ]
    );
    console.log('Notification created:', result.rows[0]);
    return result.rows[0];
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

// Update the getNotificationTitle function to handle different recipients
const getNotificationTitle = (type, isForDoctor = false) => {
  switch (type) {
    case 'APPOINTMENT_SCHEDULED':
      return isForDoctor 
        ? 'New Appointment Request' 
        : 'Appointment Request Sent';
      
    case 'APPOINTMENT_CONFIRMED':
      return isForDoctor 
        ? 'Appointment Confirmed' 
        : 'Appointment Confirmed';
      
    case 'APPOINTMENT_REJECTED':
      return isForDoctor 
        ? 'Appointment Rejected' 
        : 'Appointment Rejected';
      
    case 'APPOINTMENT_CANCELLED':
      return isForDoctor 
        ? 'Appointment Cancelled' 
        : 'Appointment Cancelled';
      
    case 'APPOINTMENT_COMPLETED':
      return isForDoctor 
        ? 'Appointment Completed' 
        : 'Appointment Completed';
      
    case 'APPOINTMENT_RESCHEDULED':
      return isForDoctor 
        ? 'Appointment Rescheduled' 
        : 'Appointment Rescheduled';
      
    default:
      return 'Appointment Update';
  }
};

// Update the getNotificationMessage function to handle different recipients
const getNotificationMessage = (type, appointment, isForDoctor = false) => {
  const dateStr = formatDate(new Date(appointment.date));
  const timeStr = formatTime(appointment.time);
  
  switch (type) {
    case 'APPOINTMENT_SCHEDULED':
      return isForDoctor
        ? `New appointment request from ${appointment.patient_name} for ${dateStr} at ${timeStr}`
        : `Your appointment request with Dr. ${appointment.doctor_name} for ${dateStr} at ${timeStr} has been sent. Waiting for confirmation.`;
      
    case 'APPOINTMENT_CONFIRMED':
      return isForDoctor
        ? `You have confirmed the appointment with ${appointment.patient_name} for ${dateStr} at ${timeStr}`
        : `Your appointment with Dr. ${appointment.doctor_name} on ${dateStr} at ${timeStr} has been confirmed. You're all set!`;
      
    case 'APPOINTMENT_REJECTED':
      return isForDoctor
        ? `You have rejected the appointment request from ${appointment.patient_name} for ${dateStr} at ${timeStr}`
        : `Your appointment request with Dr. ${appointment.doctor_name} for ${dateStr} at ${timeStr} was not approved. Please schedule another time.`;
      
    case 'APPOINTMENT_CANCELLED':
      // Add who cancelled the appointment
      if (appointment.cancelled_by === 'doctor') {
        return isForDoctor
          ? `You have cancelled the appointment with ${appointment.patient_name} for ${dateStr} at ${timeStr}`
          : `Dr. ${appointment.doctor_name} has cancelled your appointment scheduled for ${dateStr} at ${timeStr}`;
      } else {
        return isForDoctor
          ? `${appointment.patient_name} has cancelled their appointment scheduled for ${dateStr} at ${timeStr}`
          : `You have cancelled your appointment with Dr. ${appointment.doctor_name} scheduled for ${dateStr} at ${timeStr}`;
      }
      
    case 'APPOINTMENT_COMPLETED':
      return isForDoctor
        ? `You have marked the appointment with ${appointment.patient_name} on ${dateStr} as completed`
        : `Your appointment with Dr. ${appointment.doctor_name} on ${dateStr} has been completed. Thank you for visiting!`;
      
    case 'APPOINTMENT_RESCHEDULED': {
      // Get clean date strings without timezone issues
      let oldDateStr, newDateStr;
      
      if (typeof appointment.oldDate === 'string' && appointment.oldDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If already in YYYY-MM-DD format, use directly
        oldDateStr = appointment.oldDate;
      } else {
        oldDateStr = formatDate(new Date(appointment.oldDate));
      }
      
      if (typeof appointment.newDate === 'string' && appointment.newDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        // If already in YYYY-MM-DD format, use directly
        newDateStr = appointment.newDate;
      } else {
        newDateStr = formatDate(new Date(appointment.newDate));
      }
      
      // Format times
      const oldTimeStr = appointment.oldTime || '00:00';
      const newTimeStr = appointment.newTime || '00:00';
      
      const rescheduler = appointment.rescheduledBy === 'doctor' ? 
        `Dr. ${appointment.doctor_name}` : 
        appointment.rescheduledBy === 'admin' ? 
          'an administrator' : 
          'you';

      return isForDoctor ?
        `Appointment with ${appointment.patient_name} has been rescheduled from ${oldDateStr} at ${oldTimeStr} to ${newDateStr} at ${newTimeStr}` :
        `Your appointment with Dr. ${appointment.doctor_name} has been rescheduled from ${oldDateStr} at ${oldTimeStr} to ${newDateStr} at ${newTimeStr}`;
    }
      
    default:
      return `Appointment status has been updated`;
  }
};

// Add this endpoint to mark all notifications as read
router.put('/read-all', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    await db.query(
      `UPDATE notifications
       SET is_read = true
       WHERE user_id = $1 AND is_read = false`,
      [userId]
    );

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = {
  router,
  sendAppointmentNotification: async (data) => {
    try {
      // Get appointment details
      const appointment = await getAppointmentDetails(data.appointmentId);
      if (!appointment) return;
      
      // Add necessary data for specific notification types
      if (data.type === 'APPOINTMENT_CANCELLED') {
        appointment.cancelled_by = data.cancelledBy || 'patient';
      }
      
      if (data.type === 'APPOINTMENT_RESCHEDULED') {
        // Add rescheduling details
        appointment.oldDate = data.oldDate || appointment.date;
        appointment.newDate = data.newDate || appointment.date;
        appointment.oldTime = data.oldTime || appointment.time;
        appointment.newTime = data.newTime || appointment.time;
        appointment.rescheduledBy = data.rescheduledBy || 'patient';
      }
      
      // Create notification for patient
      await createNotification({
        userId: appointment.patient_id,
        type: data.type,
        title: getNotificationTitle(data.type, false), // For patient
        message: getNotificationMessage(data.type, appointment, false),
        relatedId: data.appointmentId
      });
      
      // Create notification for doctor
      await createNotification({
        userId: appointment.doctor_id,
        type: data.type,
        title: getNotificationTitle(data.type, true), // For doctor
        message: getNotificationMessage(data.type, appointment, true),
        relatedId: data.appointmentId
      });
    } catch (error) {
      console.error('Error sending appointment notification:', error);
    }
  }
};