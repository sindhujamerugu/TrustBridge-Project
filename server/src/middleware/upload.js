import multer from 'multer';
import { AppError } from '../utils/AppError.js';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPEG, PNG, WebP, and PDF allowed.', 400), false);
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize:          5 * 1024 * 1024, // 5 MB per file
    files:             10,               // max 10 files per request
    fields:            20,               // max 20 non-file fields
    fieldNameSize:     100,              // prevent huge field names
    fieldSize:         64 * 1024,        // 64 KB per text field
    fieldNestingDepth: 3,                // prevent deeply-nested field DoS (CVE-2026-5079)
  },
  fileFilter,
});

export const uploadFields = upload.fields([
  { name: 'aadhaar',          maxCount: 1 },
  { name: 'selfie',           maxCount: 1 },
  { name: 'pan',              maxCount: 1 },
  { name: 'gst',              maxCount: 1 },
  { name: 'gstCertificate',   maxCount: 1 },
  { name: 'businessLicense',  maxCount: 1 },
  { name: 'registrationCert', maxCount: 1 },
  { name: 'images',           maxCount: 5 },
  { name: 'file',             maxCount: 1 },
]);

// Alias used by the service documents endpoint
export const uploadDocFields = uploadFields;
