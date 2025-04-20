const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken, requireRole } = require('./middleware/auth');

// Initialize tables if they don't exist
const initTables = async () => {
  try {
    // Create invoices table
    await db.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        appointment_id INTEGER REFERENCES appointments(id),
        amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        due_date DATE NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payments table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        patient_id INTEGER REFERENCES users(id),
        amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(50),
        transaction_id VARCHAR(100),
        status VARCHAR(50),
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Create payment methods table
    await db.query(`
      CREATE TABLE IF NOT EXISTS payment_methods (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        card_number VARCHAR(255) NOT NULL,
        last_four VARCHAR(4) NOT NULL,
        expiry_date VARCHAR(10) NOT NULL,
        cardholder_name VARCHAR(255) NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Payment tables initialized successfully');
  } catch (error) {
    console.error('Error initializing payment tables:', error);
  }
};

// Uncomment this line when running for the first time
// initTables();

// CREATE invoice (admin/doctor)
router.post('/invoices', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { patient_id, appointment_id, amount, due_date, description } = req.body;
    const result = await db.query(
      `INSERT INTO invoices (patient_id, appointment_id, amount, due_date, description, status)
       VALUES ($1, $2, $3, $4, $5, 'pending') RETURNING *`,
      [patient_id, appointment_id, amount, due_date, description]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// UPDATE invoice (admin/doctor)
router.put('/invoices/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const { amount, due_date, description, status } = req.body;
    const result = await db.query(
      `UPDATE invoices SET amount=$1, due_date=$2, description=$3, status=$4 WHERE id=$5 RETURNING *`,
      [amount, due_date, description, status, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// DELETE invoice (admin/doctor)
router.delete('/invoices/:id', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    // First check invoice status
    const checkResult = await db.query(
      'SELECT status FROM invoices WHERE id = $1',
      [req.params.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = checkResult.rows[0];
    
    // Only allow deletion of pending invoices
    if (invoice.status !== 'pending') {
      return res.status(400).json({ 
        error: 'Cannot delete invoice', 
        message: `This invoice is already ${invoice.status}. Only pending invoices can be deleted.`
      });
    }
    
    // If pending, proceed with deletion
    await db.query(`DELETE FROM invoices WHERE id=$1`, [req.params.id]);
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

// APPROVE invoice (admin/doctor)
router.put('/invoices/:id/approve', authenticateToken, requireRole(['admin', 'doctor']), async (req, res) => {
  try {
    const result = await db.query(
      `UPDATE invoices SET status='approved' WHERE id=$1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to approve invoice' });
  }
});

// Get Patient Invoices
router.get('/invoices/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;

    const result = await db.query(
      `SELECT i.*, 
              COALESCE(SUM(p.amount), 0) as paid_amount,
              (i.amount - COALESCE(SUM(p.amount), 0)) as remaining_amount
       FROM invoices i
       LEFT JOIN payments p ON i.id = p.invoice_id
       WHERE i.patient_id = $1
       GROUP BY i.id
       ORDER BY i.created_at DESC`,
      [patientId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patient invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get Invoice Detail with Payments
router.get('/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await db.query(`
      SELECT i.*, 
             u.name as patient_name,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount,
             (i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)) as remaining_amount
      FROM invoices i
      JOIN users u ON i.patient_id = u.id
      WHERE i.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

// Process Payment
router.post('/payments', authenticateToken, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod } = req.body;
    
    if (!invoiceId || !amount || !paymentMethod) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get the invoice to check if it exists and get patient ID
    const invoiceResult = await db.query(
      'SELECT * FROM invoices WHERE id = $1',
      [invoiceId]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];
    
    // Add this check
    if (invoice.status !== 'approved') {
      return res.status(400).json({ 
        error: 'Payment rejected', 
        message: 'This invoice has not been approved for payment yet.'
      });
    }
    
    // Create a simple transaction ID
    const transactionId = `TXN-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create the payment record
    const paymentResult = await db.query(
      `INSERT INTO payments 
       (invoice_id, patient_id, amount, payment_method, transaction_id, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [invoiceId, invoice.patient_id, amount, paymentMethod, transactionId, 'completed']
    );

    // Check how much has been paid for this invoice
    const paymentsSum = await db.query(
      'SELECT SUM(amount) FROM payments WHERE invoice_id = $1',
      [invoiceId]
    );
    
    const totalPaid = parseFloat(paymentsSum.rows[0].sum || 0);
    
    // Update the invoice status if the full amount is paid
    if (totalPaid >= invoice.amount) {
      await db.query(
        `UPDATE invoices SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [invoiceId]
      );
    }

    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'PAYMENT_PROCESSED', 
        `Payment of $${amount} processed for invoice ID: ${invoiceId}`, 
        paymentResult.rows[0].id
      ]
    );

    res.status(201).json({
      message: 'Payment processed successfully',
      payment: paymentResult.rows[0],
      invoice: {
        ...invoice,
        status: totalPaid >= invoice.amount ? 'paid' : invoice.status
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
  }
});

// Get payment methods for current user
router.get('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, card_number, last_four, expiry_date, cardholder_name, is_default, created_at
       FROM payment_methods
       WHERE user_id = $1
       ORDER BY is_default DESC, created_at DESC`,
      [req.user.userId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    res.status(500).json({ error: 'Failed to fetch payment methods' });
  }
});

// Add payment method
router.post('/payment-methods', authenticateToken, async (req, res) => {
  try {
    const { cardNumber, expiryDate, cvv, cardholderName, isDefault } = req.body;
    
    // Basic validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return res.status(400).json({ error: 'All fields are required' });
    }
    
    // Mask the card number for storage (keep only last 4 digits)
    const last4 = cardNumber.slice(-4);
    const maskedCardNumber = '•'.repeat(12) + last4;
    
    // Check if this is the first card (make it default)
    let makeDefault = isDefault;
    if (!makeDefault) {
      const existingCards = await db.query(
        'SELECT COUNT(*) FROM payment_methods WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (parseInt(existingCards.rows[0].count) === 0) {
        makeDefault = true;
      }
    }
    
    // If setting as default, unset any existing default
    if (makeDefault) {
      await db.query(
        'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
        [req.user.userId]
      );
    }
    
    // Insert the payment method
    const result = await db.query(
      `INSERT INTO payment_methods 
       (user_id, card_number, last_four, expiry_date, cardholder_name, is_default)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, card_number, last_four, expiry_date, cardholder_name, is_default, created_at`,
      [req.user.userId, maskedCardNumber, last4, expiryDate, cardholderName, makeDefault]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding payment method:', error);
    res.status(500).json({ error: 'Failed to add payment method' });
  }
});

// Delete payment method
router.delete('/payment-methods/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the payment method exists and belongs to the user
    const checkResult = await db.query(
      'SELECT id, is_default FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    const paymentMethod = checkResult.rows[0];
    
    // Don't allow deletion of the default payment method if there are others
    if (paymentMethod.is_default) {
      const countResult = await db.query(
        'SELECT COUNT(*) FROM payment_methods WHERE user_id = $1',
        [req.user.userId]
      );
      
      if (parseInt(countResult.rows[0].count) > 1) {
        return res.status(400).json({ 
          error: 'Cannot delete default payment method. Set another card as default first.' 
        });
      }
    }
    
    // Delete the payment method
    await db.query('DELETE FROM payment_methods WHERE id = $1', [id]);
    
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
});

// Set default payment method
router.put('/payment-methods/:id/default', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if the payment method exists and belongs to the user
    const checkResult = await db.query(
      'SELECT id FROM payment_methods WHERE id = $1 AND user_id = $2',
      [id, req.user.userId]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment method not found' });
    }
    
    // Update all payment methods (unset default)
    await db.query(
      'UPDATE payment_methods SET is_default = false WHERE user_id = $1',
      [req.user.userId]
    );
    
    // Set the selected one as default
    await db.query(
      'UPDATE payment_methods SET is_default = true WHERE id = $1',
      [id]
    );
    
    res.json({ message: 'Default payment method updated successfully' });
  } catch (error) {
    console.error('Error updating default payment method:', error);
    res.status(500).json({ error: 'Failed to update default payment method' });
  }
});

// Get all invoices for a specific doctor's patients
router.get('/invoices/doctor/:doctorId', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
    // This query gets invoices for patients who have appointments with this doctor
    const result = await db.query(`
      SELECT i.*, 
             u.name as patient_name,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount,
             (i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)) as remaining_amount
      FROM invoices i
      JOIN users u ON i.patient_id = u.id
      WHERE i.patient_id IN (
        SELECT DISTINCT patient_id FROM appointments WHERE doctor_id = $1
      )
      ORDER BY i.created_at DESC
    `, [doctorId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching doctor patient invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// Get all appointments for a doctor
router.get('/appointments/doctor/:doctorId', authenticateToken, requireRole(['doctor', 'admin']), async (req, res) => {
  try {
    const { doctorId } = req.params;
    
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

// Get all patients (for admin)
router.get('/admin/patients', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT id, name, email
      FROM users
      WHERE role = 'patient'
      ORDER BY name ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ error: 'Failed to fetch patients' });
  }
});

// Get all appointments (for admin)
router.get('/admin/appointments', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT a.*, 
             p.name as patient_name,
             d.name as doctor_name
      FROM appointments a
      JOIN users p ON a.patient_id = p.id
      JOIN users d ON a.doctor_id = d.id
      ORDER BY a.date DESC, a.time ASC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ error: 'Failed to fetch appointments' });
  }
});

// Get all invoices (admin only)
router.get('/invoices', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const result = await db.query(`
      SELECT i.*, 
             u.name as patient_name,
             COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0) as paid_amount,
             (i.amount - COALESCE((SELECT SUM(p.amount) FROM payments p WHERE p.invoice_id = i.id), 0)) as remaining_amount
      FROM invoices i
      JOIN users u ON i.patient_id = u.id
      ORDER BY i.created_at DESC
    `);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching all invoices:', error);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

module.exports = router;