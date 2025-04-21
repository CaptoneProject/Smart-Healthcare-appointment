require('dotenv').config();
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const db = require('./database');
const doctorRoutes = require('./doctorRoutes');
const prescriptionRoutes = require('./prescriptionRoutes');
const patientRoutes = require('./routes/patientRoutes');

const app = express();

// Middleware
app.use(express.json());
app.use(cors());

// Initialize database tables - with proper sequence
async function initDatabase() {
  try {
    console.log('Starting database initialization...');
    
    // 1. Create users table first (this is the foundation)
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        user_type VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Users table initialized');

    // 2. Create refresh_tokens table (references users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS refresh_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Refresh tokens table initialized');

    // 3. Initialize system_activities table
    await db.query(`
      CREATE TABLE IF NOT EXISTS system_activities (
        id SERIAL PRIMARY KEY,
        type VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        related_id INTEGER,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('System activities table initialized');

    // 4. Initialize notifications table (references users)
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
    console.log('Notifications table initialized');

    // 5. Initialize appointments table (references users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS appointments (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES users(id),
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        time TIME NOT NULL,
        duration INTEGER NOT NULL,
        type VARCHAR(50),
        status VARCHAR(20) DEFAULT 'scheduled',
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reschedule_count INTEGER DEFAULT 0
      );
    `);
    console.log('Appointments table initialized');

    // 6. Initialize doctor-related tables (references users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES users(id),
        day_of_week INTEGER,
        start_time TIME,
        end_time TIME,
        break_start TIME,
        break_end TIME,
        max_patients INTEGER DEFAULT 4,
        is_available BOOLEAN DEFAULT true,
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
    console.log('Doctor-related tables initialized');

    // 7. Initialize medical records tables (references users)
    await db.query(`
      CREATE TABLE IF NOT EXISTS medical_records (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id),
        doctor_id INTEGER REFERENCES users(id) NOT NULL,
        title VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        file_url TEXT NOT NULL,
        sensitivity_level VARCHAR(50) DEFAULT 'normal',
        content TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS patient_consent (
        patient_id INTEGER PRIMARY KEY REFERENCES users(id),
        consent_given BOOLEAN DEFAULT false,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Medical records tables initialized');

    // 8. Create access logs table (references both users and medical_records)
    await db.query(`
      CREATE TABLE IF NOT EXISTS medical_record_access_logs (
        id SERIAL PRIMARY KEY,
        record_id INTEGER REFERENCES medical_records(id) ON DELETE CASCADE,
        accessed_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
        access_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        reason TEXT,
        is_emergency BOOLEAN DEFAULT false
      );
    `);
    console.log('Medical record access logs table initialized');

    // 9. Initialize patient visits table (references users and appointments)
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
    `);
    console.log('Patient visits table initialized');

    // 10. Initialize payment and invoice tables
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
    console.log('Payment and invoice tables initialized');

    // 11. Initialize insurance claims table
    await db.query(`
      CREATE TABLE IF NOT EXISTS insurance_claims (
        id SERIAL PRIMARY KEY,
        invoice_id INTEGER REFERENCES invoices(id),
        patient_id INTEGER REFERENCES users(id),
        insurance_provider VARCHAR(255) NOT NULL,
        policy_number VARCHAR(100) NOT NULL,
        claim_amount DECIMAL(10,2) NOT NULL,
        status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, approved, rejected, reimbursed
        submission_date TIMESTAMP,
        approval_date TIMESTAMP,
        rejection_reason TEXT,
        reimbursement_amount DECIMAL(10,2),
        reimbursement_date TIMESTAMP,
        claim_reference VARCHAR(100),
        documents_urls TEXT[], -- This is the critical field for storing S3 URLs
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Insurance claims table initialized');

    // 12. Initialize messaging system
    await db.query(`
      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        is_read BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages (sender_id, receiver_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at);
    `);
    console.log('Messaging system tables initialized');

    // 13. Initialize prescription and refill tables
    await db.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        medication VARCHAR(255) NOT NULL,
        dosage VARCHAR(255) NOT NULL,
        instructions TEXT,
        refills_remaining INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(50) DEFAULT 'Active', -- Active, Expired, Refill Requested
        prescribed_date DATE NOT NULL DEFAULT CURRENT_DATE,
        expiry_date DATE NOT NULL,
        pharmacy VARCHAR(255),
        warnings TEXT,
        last_filled TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS refill_requests (
        id SERIAL PRIMARY KEY,
        prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        pharmacy VARCHAR(255) NOT NULL,
        status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected, completed
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        processed_by INTEGER REFERENCES users(id)
      );
    `);
    console.log('Prescription tables initialized');

    console.log('All database tables initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error; // Re-throw to handle in the caller
  }
}

// Initialize database and start server only after initialization completes
(async function startServer() {
  try {
    // First initialize the database
    await initDatabase();
    
    // Then import modules that depend on database tables
    const notificationsRouter = require('./notifications').router;
    const medicalRoutes = require('./medicalRoutes');
    const authRouter = require('./auth');
    const appointmentsRoutes = require('./appointments');
    const doctorSchedulingRoutes = require('./doctorScheduling');
    const adminRoutes = require('./adminRoutes');
    const paymentRoutes = require('./paymentRoutes');
    const insuranceRoutes = require('./insuranceRoutes');
    const messagingRoutes = require('./messagingRoutes');
    const { authenticateToken, isAdmin, requireRole } = require('./middleware/auth');
    
    // Configure routes
    app.use('/api/auth', authRouter);
    app.use('/api/appointments', appointmentsRoutes); 
    app.use('/api/doctors', authenticateToken, doctorRoutes);
    app.use('/api/medical', authenticateToken, medicalRoutes);
    app.use('/api/admin', authenticateToken, adminRoutes);
    app.use('/api/payments', paymentRoutes);
    app.use('/api/notifications', authenticateToken, notificationsRouter);
    app.use('/api/doctor', authenticateToken, doctorSchedulingRoutes);
    app.use('/api/insurance', insuranceRoutes);
    app.use('/api/messaging', authenticateToken, messagingRoutes);
    app.use('/api/prescriptions', prescriptionRoutes);
    app.use('/api/patients', authenticateToken, patientRoutes);
    
    // Error handling middleware
    app.use((err, req, res, next) => {
      console.error('Error:', err);
      res.status(500).json({ 
        error: 'Internal server error', 
        details: err.message 
      });
    });
    
    // Start server only after everything is ready
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to initialize application:', error);
    process.exit(1); // Exit with error code
  }
})();

module.exports = app;