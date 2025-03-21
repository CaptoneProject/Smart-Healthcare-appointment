const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const nodemailer = require('nodemailer');

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
    CREATE TABLE IF NOT EXISTS notifications (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id),
      type VARCHAR(50),
      message TEXT,
      is_read BOOLEAN DEFAULT false,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
};

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
    await pool.query(
      `INSERT INTO notifications (user_id, type, message)
       VALUES ($1, $2, $3)`,
      [userId, type, message]
    );

    // Get user email
    const userResult = await pool.query(
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

    const result = await pool.query(
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
router.get('/notifications', async (req, res) => {
  try {
    const { userId } = req.query;

    const result = await pool.query(
      `SELECT * FROM notifications
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.put('/notifications/:id/read', async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
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
    const result = await pool.query(
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

// Create a notification in database
const createNotification = async (notification) => {
  try {
    await pool.query(
      `INSERT INTO notifications
       (user_id, type, title, message, related_id, is_read)
       VALUES ($1, $2, $3, $4, $5, false)`,
      [
        notification.userId,
        notification.type,
        notification.title,
        notification.message,
        notification.relatedId
      ]
    );
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};

// Get notification title based on type
const getNotificationTitle = (type) => {
  switch (type) {
    case 'APPOINTMENT_CREATED':
      return 'New Appointment';
    case 'APPOINTMENT_RESCHEDULED':
      return 'Appointment Rescheduled';
    case 'APPOINTMENT_CANCELLED':
      return 'Appointment Cancelled';
    default:
      return 'Appointment Update';
  }
};

// Get notification message based on type and appointment
const getNotificationMessage = (type, appointment) => {
  const dateStr = new Date(appointment.date).toLocaleDateString();
  switch (type) {
    case 'APPOINTMENT_CREATED':
      return `Appointment scheduled with Dr. ${appointment.doctor_name} on ${dateStr} at ${appointment.time}`;
    case 'APPOINTMENT_RESCHEDULED':
      return `Your appointment with Dr. ${appointment.doctor_name} has been rescheduled to ${dateStr} at ${appointment.time}`;
    case 'APPOINTMENT_CANCELLED':
      return `Your appointment with Dr. ${appointment.doctor_name} on ${dateStr} has been cancelled`;
    default:
      return `Your appointment with Dr. ${appointment.doctor_name} has been updated`;
  }
};

module.exports = router;
module.exports.sendAppointmentNotification = async (data) => {
  try {
    // Get appointment details
    const appointment = await getAppointmentDetails(data.appointmentId);
    if (!appointment) return;
    
    // Create notification for patient
    await createNotification({
      userId: appointment.patient_id,
      type: data.type,
      title: getNotificationTitle(data.type),
      message: getNotificationMessage(data.type, appointment),
      relatedId: data.appointmentId
    });
    
    // Create notification for doctor
    await createNotification({
      userId: appointment.doctor_id,
      type: data.type,
      title: getNotificationTitle(data.type),
      message: getNotificationMessage(data.type, appointment),
      relatedId: data.appointmentId
    });
  } catch (error) {
    console.error('Error sending appointment notification:', error);
  }
};