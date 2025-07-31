const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');

const uploadPdfToCloudinary = (pdfBuffer, publicId) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        type: 'upload',
        public_id: publicId,
        folder: 'invoices',
        use_filename: true,
        unique_filename: false,
        overwrite: true
      },
      (error, result) => {
        if (error) {
          // console.error('Cloudinary upload error:', error);
          reject(new Error('Failed to upload PDF to Cloudinary'));
        } else {
          resolve({
            url: result.secure_url,
            publicId: result.public_id
          });
        }
      }
    );

    streamifier.createReadStream(pdfBuffer).pipe(uploadStream);
  });
};

module.exports = { uploadPdfToCloudinary };
