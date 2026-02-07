// config/aws.js - AWS S3 Configuration
const AWS = require('aws-sdk');

// Configure AWS
AWS.config.update({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION || 'eu-north-1'
});

const s3 = new AWS.S3();

/**
 * Upload file to S3
 * @param {Buffer} fileBuffer - File buffer
 * @param {String} fileName - File name with extension
 * @param {String} folder - Folder path (e.g., 'CandidateResume/1/')
 * @param {String} contentType - MIME type
 * @returns {Promise<String>} - S3 file URL
 */
const uploadToS3 = async (fileBuffer, fileName, folder = '', contentType = 'application/pdf') => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `${folder}${fileName}`,
    Body: fileBuffer,
    ContentType: contentType,
    ACL: 'public-read'
  };

  try {
    const data = await s3.upload(params).promise();
    console.log('File uploaded successfully:', data.Location);
    return data.Location;
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};

/**
 * Delete file from S3
 * @param {String} fileKey - S3 file key/path
 * @returns {Promise<Boolean>}
 */
const deleteFromS3 = async (fileKey) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey
  };

  try {
    await s3.deleteObject(params).promise();
    console.log('File deleted successfully:', fileKey);
    return true;
  } catch (error) {
    console.error('S3 Delete Error:', error);
    throw error;
  }
};

/**
 * Get signed URL for private file
 * @param {String} fileKey - S3 file key/path
 * @param {Number} expiresIn - URL expiration in seconds (default: 3600)
 * @returns {String} - Signed URL
 */
const getSignedUrl = (fileKey, expiresIn = 3600) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: fileKey,
    Expires: expiresIn
  };

  return s3.getSignedUrl('getObject', params);
};

module.exports = {
  s3,
  uploadToS3,
  deleteFromS3,
  getSignedUrl
};
