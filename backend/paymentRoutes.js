const express = require('express');
const router = express.Router();
const db = require('./database');
const { authenticateToken, isAdmin } = require('./middleware/auth');

// Initialize the payment tables
const initPaymentTables = async () => {
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

    console.log('Payment tables initialized successfully');
  } catch (error) {
    console.error('Error initializing payment tables:', error);
  }
};

// Call initialization
initPaymentTables();

// Create Invoice
router.post('/invoices', authenticateToken, async (req, res) => {
  try {
    const { patientId, appointmentId, amount, dueDate, description } = req.body;

    // Validate required fields
    if (!patientId || !amount || !dueDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create the invoice
    const result = await db.query(
      `INSERT INTO invoices 
       (patient_id, appointment_id, amount, due_date, description, status)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [patientId, appointmentId, amount, dueDate, description, 'pending']
    );

    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INVOICE_CREATED', 
        `Invoice for $${amount} created for patient ID: ${patientId}`, 
        result.rows[0].id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// Update Invoice
router.put('/invoices/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, dueDate, description, status } = req.body;

    // Validate status if provided
    if (status && !['pending', 'paid', 'overdue', 'cancelled'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Build the update query dynamically based on provided fields
    let updateFields = [];
    let queryParams = [];
    let paramIndex = 1;

    if (amount !== undefined) {
      updateFields.push(`amount = $${paramIndex}`);
      queryParams.push(amount);
      paramIndex++;
    }

    if (dueDate !== undefined) {
      updateFields.push(`due_date = $${paramIndex}`);
      queryParams.push(dueDate);
      paramIndex++;
    }

    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      queryParams.push(description);
      paramIndex++;
    }

    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;
    }

    // Add updated_at timestamp
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    // If no fields to update, return error
    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    // Add the invoice ID to the parameters
    queryParams.push(id);

    // Execute the update query
    const query = `
      UPDATE invoices 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await db.query(query, queryParams);

    // Check if invoice exists
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INVOICE_UPDATED', 
        `Invoice ID ${id} updated`, 
        id
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// Process Payment
router.post('/payments', authenticateToken, async (req, res) => {
  try {
    const { invoiceId, amount, paymentMethod } = req.body;

    // Validate required fields
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

    // Update the invoice status if the full amount is paid
    if (amount >= invoice.amount) {
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
        status: amount >= invoice.amount ? 'paid' : invoice.status
      }
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({ error: 'Failed to process payment' });
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

    // Get invoice details
    const invoiceResult = await db.query(
      `SELECT i.*, 
              u.name as patient_name
       FROM invoices i
       JOIN users u ON i.patient_id = u.id
       WHERE i.id = $1`,
      [id]
    );

    if (invoiceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    // Get associated payments
    const paymentsResult = await db.query(
      `SELECT * FROM payments WHERE invoice_id = $1 ORDER BY payment_date DESC`,
      [id]
    );

    // Calculate totals
    const totalPaid = paymentsResult.rows.reduce((sum, payment) => sum + parseFloat(payment.amount), 0);
    const remainingAmount = parseFloat(invoiceResult.rows[0].amount) - totalPaid;

    res.json({
      invoice: invoiceResult.rows[0],
      payments: paymentsResult.rows,
      totalPaid,
      remainingAmount
    });
  } catch (error) {
    console.error('Error fetching invoice details:', error);
    res.status(500).json({ error: 'Failed to fetch invoice details' });
  }
});

module.exports = router;