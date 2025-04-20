const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken } = require('./middleware/auth');

// Middleware to validate message access
const validateMessageAccess = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const messageId = req.params.id;
    
    // Check if user is sender or receiver of the message
    const message = await db.query(
      `SELECT * FROM messages 
       WHERE id = $1 AND (sender_id = $2 OR receiver_id = $2)`,
      [messageId, userId]
    );
    
    if (message.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this message' });
    }
    
    req.message = message.rows[0];
    next();
  } catch (error) {
    console.error('Error validating message access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get conversation partners for a user (doctors for patients, patients for doctors)
router.get('/contacts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const userType = req.user.userType;
    
    let query;
    if (userType === 'patient') {
      // Get all doctors with whom the patient has had appointments
      query = `
        SELECT DISTINCT 
          u.id, 
          u.name, 
          u.user_type,
          dc.specialization,
          EXISTS(
            SELECT 1 FROM messages 
            WHERE 
              ((sender_id = $1 AND receiver_id = u.id) OR 
               (sender_id = u.id AND receiver_id = $1)) AND 
              is_read = false AND 
              receiver_id = $1
          ) as has_unread,
          (
            SELECT created_at FROM messages
            WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message_time
        FROM users u
        JOIN appointments a ON a.doctor_id = u.id
        LEFT JOIN doctor_credentials dc ON dc.doctor_id = u.id
        WHERE a.patient_id = $1 AND u.user_type = 'doctor'
        ORDER BY last_message_time DESC NULLS LAST, u.name
      `;
    } else if (userType === 'doctor') {
      // Get all patients with whom the doctor has had appointments
      query = `
        SELECT DISTINCT 
          u.id, 
          u.name, 
          u.user_type,
          EXISTS(
            SELECT 1 FROM messages 
            WHERE 
              ((sender_id = $1 AND receiver_id = u.id) OR 
               (sender_id = u.id AND receiver_id = $1)) AND 
              is_read = false AND 
              receiver_id = $1
          ) as has_unread,
          (
            SELECT created_at FROM messages
            WHERE (sender_id = $1 AND receiver_id = u.id) OR (sender_id = u.id AND receiver_id = $1)
            ORDER BY created_at DESC
            LIMIT 1
          ) as last_message_time
        FROM users u
        JOIN appointments a ON a.patient_id = u.id
        WHERE a.doctor_id = $1 AND u.user_type = 'patient'
        ORDER BY last_message_time DESC NULLS LAST, u.name
      `;
    } else {
      return res.status(403).json({ error: 'Unauthorized user type' });
    }
    
    const result = await db.query(query, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get message history between two users
router.get('/conversations/:userId', authenticateToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;
    
    // First verify the users can communicate (doctor-patient relationship)
    const relationshipCheck = await db.query(
      `SELECT COUNT(*) FROM appointments
       WHERE (patient_id = $1 AND doctor_id = $2)
       OR (patient_id = $2 AND doctor_id = $1)`,
      [currentUserId, otherUserId]
    );
    
    if (relationshipCheck.rows[0].count === '0') {
      return res.status(403).json({ 
        error: 'Cannot access conversation with this user' 
      });
    }
    
    // Get messages
    const messages = await db.query(
      `SELECT m.*, 
              s.name as sender_name, 
              r.name as receiver_name,
              s.user_type as sender_type,
              r.user_type as receiver_type
       FROM messages m
       JOIN users s ON m.sender_id = s.id
       JOIN users r ON m.receiver_id = r.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2)
       OR (m.sender_id = $2 AND m.receiver_id = $1)
       ORDER BY m.created_at ASC`,
      [currentUserId, otherUserId]
    );
    
    // Mark messages as read if current user is receiver
    await db.query(
      `UPDATE messages 
       SET is_read = true
       WHERE sender_id = $1 AND receiver_id = $2 AND is_read = false`,
      [otherUserId, currentUserId]
    );
    
    res.json(messages.rows);
  } catch (error) {
    console.error('Error fetching conversation:', error);
    res.status(500).json({ error: 'Failed to fetch conversation' });
  }
});

// Send a new message
router.post('/messages', authenticateToken, async (req, res) => {
  try {
    const { receiverId, content } = req.body;
    const senderId = req.user.userId;
    
    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Message content cannot be empty' });
    }
    
    // Check if sender and receiver have a doctor-patient relationship
    const relationshipCheck = await db.query(
      `SELECT COUNT(*) FROM appointments
       WHERE (patient_id = $1 AND doctor_id = $2)
       OR (patient_id = $2 AND doctor_id = $1)`,
      [senderId, receiverId]
    );
    
    if (relationshipCheck.rows[0].count === '0') {
      return res.status(403).json({ 
        error: 'Cannot send message to this user' 
      });
    }
    
    // Create the message
    const result = await db.query(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [senderId, receiverId, content]
    );
    
    // Add system activity for monitoring
    await db.query(
      `INSERT INTO system_activities (type, message, related_id)
       VALUES ($1, $2, $3)`,
      [
        'MESSAGE_SENT',
        `Message sent from user #${senderId} to user #${receiverId}`,
        result.rows[0].id
      ]
    );
    
    // Create notification for receiver
    const senderInfo = await db.query(
      'SELECT name, user_type FROM users WHERE id = $1',
      [senderId]
    );
    
    // Format notification title and message based on user type
    let title = 'New Message';
    let notificationMessage = `You have a new message from ${senderInfo.rows[0].name}`;
    
    if (senderInfo.rows[0].user_type === 'doctor') {
      title = 'Message from Doctor';
      notificationMessage = `Dr. ${senderInfo.rows[0].name} sent you a message`;
    } else if (senderInfo.rows[0].user_type === 'patient') {
      title = 'Message from Patient';
      notificationMessage = `Patient ${senderInfo.rows[0].name} sent you a message`;
    }
    
    await db.query(
      `INSERT INTO notifications (user_id, type, title, message, related_id)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        receiverId,
        'NEW_MESSAGE',
        title,
        notificationMessage,
        result.rows[0].id
      ]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Mark a message as read
router.put('/messages/:id/read', authenticateToken, validateMessageAccess, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    
    // Only the receiver can mark a message as read
    if (req.message.receiver_id !== userId) {
      return res.status(403).json({ error: 'Only the receiver can mark a message as read' });
    }
    
    await db.query(
      `UPDATE messages SET is_read = true WHERE id = $1`,
      [id]
    );
    
    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Failed to mark message as read' });
  }
});

// Get unread message count
router.get('/messages/unread/count', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    
    const result = await db.query(
      `SELECT COUNT(*) FROM messages WHERE receiver_id = $1 AND is_read = false`,
      [userId]
    );
    
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (error) {
    console.error('Error getting unread message count:', error);
    res.status(500).json({ error: 'Failed to get unread message count' });
  }
});

module.exports = router;