import multer from 'multer';
import path from 'path';
import fs from 'fs';

/* eslint no-undef: off */

// Define the storage directory
const PROFILE_PIC_DIR = process.env.PROFILE_PIC_DIR;

// Ensure upload directory exists
if (!fs.existsSync(PROFILE_PIC_DIR)) {
  fs.mkdirSync(PROFILE_PIC_DIR, { recursive: true });
}

// Configure storage for multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PROFILE_PIC_DIR);
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
  limits: { fileSize: 5 * 1024 * 1024 },
});
