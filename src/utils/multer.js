import multer from 'multer';

// Store file in memory
const storage = multer.memoryStorage();

// Allow only images
function fileFilter(req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only images are allowed'), false);
  }
}

function fileFilterCV(req, file, cb) {
  if (file.mimetype.startsWith('application/pdf')) {
    cb(null, true);
  } else {
    cb(new Error('Only PDF are allowed'), false);
  }
}

export const uploadImage = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});

export const uploadCV = multer({
  storage,
  fileFilter: fileFilterCV,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
});
