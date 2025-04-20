const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const multer = require('multer');
const multerS3 = require('multer-s3');

// Configure AWS S3 Client
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY,
    secretAccessKey: process.env.AWS_SECRET_KEY
  }
});

// Create multer upload middleware - REMOVE the ACL property
const upload = multer({
  storage: multerS3({
    s3: s3Client,
    bucket: process.env.AWS_BUCKET_NAME || 'smartcare-medical-records-2025',
    // Remove "acl: 'public-read'" line completely
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.fieldname });
    },
    key: (req, file, cb) => {
      const prefix = req.isInsuranceClaim ? 'insurance-claims/' : 'medical-records/';
      const filename = `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9.]/g, '')}`;
      cb(null, `${prefix}${filename}`);
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
});

// Create an S3 utility object without ACL operations
const s3 = {
  getSignedUrl: async (key, isPreview = true) => {
    try {
      console.log('Generating signed URL for key:', key);
      console.log('Preview mode:', isPreview);
      
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_BUCKET_NAME || 'smartcare-medical-records-2025',
        Key: key,
        // Add response parameters for proper browser display
        ResponseContentDisposition: isPreview ? 'inline' : 'attachment',
        ResponseContentType: getContentType(key)
      });
      
      return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    } catch (error) {
      console.error('Error generating signed URL:', error);
      throw error;
    }
  },
  
  getContentType: getContentType // Export the function
};

// Add this helper function to determine content type
function getContentType(key) {
  const extension = key.split('.').pop().toLowerCase();
  const contentTypeMap = {
    'pdf': 'application/pdf',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'gif': 'image/gif',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  };
  
  return contentTypeMap[extension] || 'application/octet-stream';
}

module.exports = { upload, s3Client, s3 };