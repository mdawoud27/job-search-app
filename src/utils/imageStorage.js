import multer from 'multer';
import path from 'path';
import fs from 'fs';

/* eslint no-undef: off */

// Define the storage directory
const UPLOAD_DIR = process.env.UPLOAD_DIR;

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // Create unique filename using user ID (if available) and timestamp
    const userId = req.user ? req.user.id : 'unknown';
    const uniqueFilename = `${userId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  },
});

// File filter to ensure only images are uploaded
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer upload
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit
});
