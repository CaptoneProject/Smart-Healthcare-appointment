const express = require('express');
const router = express.Router();
const multer = require('multer'); // Add this import
const multerS3 = require('multer-s3'); // Add this import
const db = require('./database');
const { authenticateToken } = require('./middleware/auth');
const { upload, s3Client } = require('./s3Config'); // Import both upload middleware and s3Client

// Get all insurance claims for a patient
router.get('/patient/:patientId', authenticateToken, async (req, res) => {
  try {
    const { patientId } = req.params;
    
    // Check if user is requesting their own data
    if (req.user.userId !== parseInt(patientId) && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    const result = await db.query(`
      SELECT ic.*, i.description as invoice_description, i.amount as invoice_amount, i.status as invoice_status
      FROM insurance_claims ic
      JOIN invoices i ON ic.invoice_id = i.id
      WHERE ic.patient_id = $1
      ORDER BY ic.created_at DESC
    `, [patientId]);
    
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching insurance claims:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claims' });
  }
});

// Get a specific insurance claim
router.get('/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    
    const result = await db.query(`
      SELECT ic.*, i.description as invoice_description, i.amount as invoice_amount, i.status as invoice_status
      FROM insurance_claims ic
      JOIN invoices i ON ic.invoice_id = i.id
      WHERE ic.id = $1
    `, [claimId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }
    
    const claim = result.rows[0];
    
    // Check if user is authorized to view this claim
    if (req.user.userId !== claim.patient_id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    res.json(claim);
  } catch (error) {
    console.error('Error fetching insurance claim:', error);
    res.status(500).json({ error: 'Failed to fetch insurance claim' });
  }
});

// Create a new insurance claim (03.06)
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { 
      invoiceId, 
      insuranceProvider, 
      policyNumber, 
      claimAmount, 
      notes 
    } = req.body;
    
    // Validate required fields with specific error messages
    if (!invoiceId) {
      return res.status(400).json({ error: 'Missing required field', message: 'Invoice ID is required' });
    }
    
    if (!insuranceProvider) {
      return res.status(400).json({ error: 'Missing required field', message: 'Insurance provider is required' });
    }
    
    // Add insurance provider length validation
    if (insuranceProvider.length > 100) {
      return res.status(400).json({ 
        error: 'Invalid insurance provider', 
        message: 'Insurance provider name cannot exceed 100 characters'
      });
    }
    
    if (!policyNumber) {
      return res.status(400).json({ error: 'Missing required field', message: 'Policy number is required' });
    }
    
    if (!claimAmount && claimAmount !== 0) {
      return res.status(400).json({ error: 'Missing required field', message: 'Claim amount is required' });
    }
    
    // Validate policy number length (maximum 50 characters)
    if (policyNumber.length > 50) {
      return res.status(400).json({ 
        error: 'Invalid policy number', 
        message: 'Policy number cannot exceed 50 characters'
      });
    }
    
    // Validate claim amount is positive
    if (claimAmount <= 0) {
      return res.status(400).json({ 
        error: 'Invalid claim amount',
        message: 'Claim amount must be greater than zero'
      });
    }
    
    // Validate claim amount has max 2 decimal places
    const decimalPlaces = claimAmount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      return res.status(400).json({
        error: 'Invalid claim amount',
        message: 'Claim amount cannot have more than 2 decimal places'
      });
    }
    
    // Validate maximum claim amount
    const MAX_CLAIM_AMOUNT = 999999.99;
    if (claimAmount > MAX_CLAIM_AMOUNT) {
      return res.status(400).json({
        error: 'Invalid claim amount',
        message: `Claim amount cannot exceed $${MAX_CLAIM_AMOUNT.toLocaleString()}`
      });
    }
    
    // Check if invoice exists and belongs to the patient
    const invoiceCheck = await db.query(`
      SELECT id, patient_id, status, amount FROM invoices WHERE id = $1
    `, [invoiceId]);
    
    if (invoiceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Invoice not found' });
    }
    
    const invoice = invoiceCheck.rows[0];
    
    // Check if user is the owner of the invoice
    if (req.user.userId !== invoice.patient_id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Check if claim already exists for this invoice
    const existingClaimCheck = await db.query(`
      SELECT id FROM insurance_claims WHERE invoice_id = $1
    `, [invoiceId]);
    
    if (existingClaimCheck.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Duplicate claim', 
        message: 'A claim for this invoice already exists' 
      });
    }
    
    // Validate claim amount against invoice total
    if (claimAmount > invoice.amount) {
      return res.status(400).json({
        error: 'Invalid claim amount',
        message: 'Claim amount cannot exceed invoice total'
      });
    }
    
    // Create the claim
    const result = await db.query(`
      INSERT INTO insurance_claims 
      (invoice_id, patient_id, insurance_provider, policy_number, claim_amount, status, notes)
      VALUES ($1, $2, $3, $4, $5, 'draft', $6)
      RETURNING *
    `, [invoiceId, req.user.userId, insuranceProvider, policyNumber, claimAmount, notes]);
    
    // Log the activity in system_activities table
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INSURANCE_CLAIM_CREATED',
        `Insurance claim created by ${req.user.name || 'Patient'} for ${insuranceProvider} with amount $${claimAmount}`,
        result.rows[0].id
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating insurance claim:', error);
    res.status(500).json({ error: 'Failed to create insurance claim' });
  }
});

// Update an insurance claim (03.07)
router.put('/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { 
      insuranceProvider, 
      policyNumber, 
      claimAmount, 
      notes 
    } = req.body;
    
    // Check if claim exists and belongs to the patient
    const claimCheck = await db.query(`
      SELECT ic.id, ic.patient_id, ic.status, ic.invoice_id, i.amount as invoice_amount
      FROM insurance_claims ic
      JOIN invoices i ON ic.invoice_id = i.id
      WHERE ic.id = $1
    `, [claimId]);
    
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }
    
    const claim = claimCheck.rows[0];
    
    // Check if user is the owner of the claim
    if (req.user.userId !== claim.patient_id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Only allow updates for claims in draft status
    if (claim.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot update claim', 
        message: 'Only claims in draft status can be updated' 
      });
    }
    
    // Validate policy number if provided
    if (policyNumber !== undefined) {
      if (!policyNumber.trim()) {
        return res.status(400).json({ 
          error: 'Invalid policy number', 
          message: 'Policy number is required'
        });
      }
      
      if (policyNumber.length > 50) {
        return res.status(400).json({ 
          error: 'Invalid policy number', 
          message: 'Policy number cannot exceed 50 characters'
        });
      }
    }
    
    // Validate claim amount if provided
    if (claimAmount !== undefined) {
      // Validate claim amount is positive
      if (claimAmount <= 0) {
        return res.status(400).json({ 
          error: 'Invalid claim amount',
          message: 'Claim amount must be greater than zero'
        });
      }
      
      // Validate claim amount has max 2 decimal places
      const decimalPlaces = claimAmount.toString().split('.')[1]?.length || 0;
      if (decimalPlaces > 2) {
        return res.status(400).json({
          error: 'Invalid claim amount',
          message: 'Claim amount cannot have more than 2 decimal places'
        });
      }
      
      // Validate maximum claim amount
      const MAX_CLAIM_AMOUNT = 999999.99;
      if (claimAmount > MAX_CLAIM_AMOUNT) {
        return res.status(400).json({
          error: 'Invalid claim amount',
          message: `Claim amount cannot exceed $${MAX_CLAIM_AMOUNT.toLocaleString()}`
        });
      }
      
      // Validate claim amount against invoice total
      if (claimAmount > claim.invoice_amount) {
        return res.status(400).json({
          error: 'Invalid claim amount',
          message: 'Claim amount cannot exceed invoice total'
        });
      }
    }
    
    // Update the claim
    const result = await db.query(`
      UPDATE insurance_claims
      SET insurance_provider = COALESCE($1, insurance_provider),
          policy_number = COALESCE($2, policy_number),
          claim_amount = COALESCE($3, claim_amount),
          notes = COALESCE($4, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING *
    `, [insuranceProvider, policyNumber, claimAmount, notes, claimId]);
    
    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INSURANCE_CLAIM_UPDATED',
        `Insurance claim #${claimId} updated by ${req.user.name || 'Patient'}`,
        claimId
      ]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating insurance claim:', error);
    res.status(500).json({ error: 'Failed to update insurance claim' });
  }
});

// Submit an insurance claim
router.post('/:claimId/submit', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    const { documentUrls } = req.body;
    
    // Validate document URLs
    if (!documentUrls || !Array.isArray(documentUrls) || documentUrls.length === 0) {
      return res.status(400).json({ 
        error: 'Document uploads required',
        message: 'Please upload at least one document for your claim'
      });
    }
    
    // Ensure all URLs are from your S3 bucket (security check)
    const bucketName = process.env.AWS_BUCKET_NAME || 'smartcare-medical-records-2025';
    const validUrls = documentUrls.filter(url => 
      url.includes(bucketName) || url.includes('amazonaws.com')
    );
    
    if (validUrls.length < documentUrls.length) {
      return res.status(400).json({ 
        error: 'Invalid document URLs',
        message: 'Some document URLs are invalid' 
      });
    }
    
    // Check if claim exists and belongs to the patient
    const claimCheck = await db.query(
      'SELECT id, patient_id, status FROM insurance_claims WHERE id = $1',
      [claimId]
    );
    
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }
    
    const claim = claimCheck.rows[0];
    
    // Check if user is the owner of the claim
    if (req.user.userId !== claim.patient_id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Only allow submission for claims in draft status
    if (claim.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot submit claim', 
        message: 'Only claims in draft status can be submitted' 
      });
    }
    
    // Generate a claim reference (simple implementation)
    const claimReference = `CLM-${Date.now().toString().substring(6)}-${Math.floor(Math.random() * 1000)}`;
    
    // Submit the claim with document URLs properly stored in PostgreSQL TEXT[] column
    const result = await db.query(
      `UPDATE insurance_claims
       SET status = 'submitted',
           submission_date = CURRENT_TIMESTAMP,
           documents_urls = $1,
           claim_reference = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [documentUrls, claimReference, claimId]
    );

    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INSURANCE_CLAIM_SUBMITTED',
        `Insurance claim #${claimId} (ref: ${claimReference}) submitted by ${req.user.name || 'Patient'} with ${documentUrls.length} documents`,
        claimId
      ]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error submitting insurance claim:', error);
    res.status(500).json({ error: 'Failed to submit insurance claim' });
  }
});

// Delete a draft insurance claim
router.delete('/:claimId', authenticateToken, async (req, res) => {
  try {
    const { claimId } = req.params;
    
    // Check if claim exists and belongs to the patient
    const claimCheck = await db.query(`
      SELECT id, patient_id, status FROM insurance_claims WHERE id = $1
    `, [claimId]);
    
    if (claimCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Insurance claim not found' });
    }
    
    const claim = claimCheck.rows[0];
    
    // Check if user is the owner of the claim
    if (req.user.userId !== claim.patient_id && req.user.userType !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Only allow deletion for claims in draft status
    if (claim.status !== 'draft') {
      return res.status(400).json({ 
        error: 'Cannot delete claim', 
        message: 'Only claims in draft status can be deleted' 
      });
    }
    
    // Delete the claim
    await db.query('DELETE FROM insurance_claims WHERE id = $1', [claimId]);

    // Log the activity
    await db.query(
      `INSERT INTO system_activities (type, message, related_id) 
       VALUES ($1, $2, $3)`,
      [
        'INSURANCE_CLAIM_DELETED',
        `Insurance claim #${claimId} deleted by ${req.user.name || 'Patient'}`,
        claimId
      ]
    );
    
    res.json({ success: true, message: 'Insurance claim deleted successfully' });
  } catch (error) {
    console.error('Error deleting insurance claim:', error);
    res.status(500).json({ error: 'Failed to delete insurance claim' });
  }
});

// Add this endpoint for document uploads
router.post('/documents/upload', authenticateToken, (req, res, next) => {
  // Custom multer-s3 configuration specifically for insurance claims
  const insuranceUpload = multer({
    storage: multerS3({
      s3: s3Client,
      bucket: process.env.AWS_BUCKET_NAME || 'smartcare-medical-records-2025',
      metadata: (req, file, cb) => {
        cb(null, { fieldName: file.fieldname });
      },
      key: (req, file, cb) => {
        // Use a dedicated folder for insurance claim documents
        const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;
        cb(null, `insurance-claims/${filename}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/^(application\/pdf|image\/(jpeg|png|jpg))$/)) {
        return cb(new Error('Only PDF, JPG, and PNG files are allowed!'), false);
      }
      cb(null, true);
    },
    limits: {
      fileSize: 10 * 1024 * 1024 // 10MB limit
    }
  }).single('file');
  
  // Execute the custom upload middleware
  insuranceUpload(req, res, (err) => {
    if (err) {
      console.error('Error uploading file:', err);
      return res.status(400).json({ 
        error: 'Upload failed',
        message: err.message
      });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Get the URL from S3
    const fileUrl = req.file.location;
    if (!fileUrl) {
      return res.status(500).json({ error: 'Failed to get file URL from S3' });
    }

    // Return the file URL
    res.status(201).json({
      message: 'File uploaded successfully',
      fileUrl: fileUrl,
      fileName: req.file.originalname
    });
  });
});

module.exports = router;