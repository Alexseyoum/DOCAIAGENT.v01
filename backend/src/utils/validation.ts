import { config } from '../config';
import path from 'path';

export interface FileValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates uploaded file based on size and type
 */
export function validateFile(file: Express.Multer.File): FileValidationResult {
  // Check file size
  if (file.size > config.maxFileSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of ${config.maxFileSizeMB}MB`
    };
  }

  // Check MIME type
  if (!config.allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not supported. Supported types: ${config.allowedExtensions.join(', ')}`
    };
  }

  // Check file extension as additional validation
  const ext = path.extname(file.originalname).toLowerCase();
  if (!config.allowedExtensions.includes(ext)) {
    return {
      valid: false,
      error: `File extension ${ext} is not supported. Supported types: ${config.allowedExtensions.join(', ')}`
    };
  }

  return { valid: true };
}

/**
 * Sanitizes filename to prevent path traversal and other issues
 */
export function sanitizeFilename(filename: string): string {
  // Remove path components
  const basename = path.basename(filename);

  // Replace dangerous characters with underscore
  // Keep alphanumeric, dots, hyphens, and underscores
  const sanitized = basename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.+/g, '.') // Replace multiple dots with single dot
    .substring(0, 255); // Limit length

  return sanitized;
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  return path.extname(filename).toLowerCase();
}

/**
 * Validates that a string is a valid document ID format
 */
export function isValidDocumentId(id: string): boolean {
  return /^doc_[a-zA-Z0-9]{16}$/.test(id);
}
