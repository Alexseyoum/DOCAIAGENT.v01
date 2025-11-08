import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config';
import { sanitizeFilename } from '../utils/validation';
import { generateDocumentId } from '../utils/id-generator';

// Ensure upload directory exists
if (!fs.existsSync(config.uploadDir)) {
  fs.mkdirSync(config.uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: documentId + sanitized original name
    const documentId = generateDocumentId();
    const sanitized = sanitizeFilename(file.originalname);
    const ext = path.extname(sanitized);
    const nameWithoutExt = path.basename(sanitized, ext);
    const filename = `${documentId}_${nameWithoutExt}${ext}`;

    // Store documentId in request for later use
    (req as any).documentId = documentId;

    cb(null, filename);
  }
});

// File filter
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Check MIME type
  if (config.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not supported`));
  }
};

// Create multer instance
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSizeBytes,
    files: 1 // Only one file per upload
  }
});
