const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ordin_pos', // Folder name in Cloudinary
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp'], // Only allow images
    // resource_type: 'image', // Explicitly set to image (default)
    transformation: [{ width: 500, height: 500, crop: 'limit' }], // Optional: resize on upload
  },
});

const upload = multer({ storage: storage });

module.exports = { upload, cloudinary };
