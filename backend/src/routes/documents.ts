import { Router } from 'express';
import { upload } from '../middleware/upload';
import {
  uploadDocument,
  getDocument,
  getDocumentStatus,
  deleteDocument
} from '../controllers/document-controller';
import {
  processDocument,
  getExtractedText
} from '../controllers/processing-controller';
import { uploadLimiter } from '../middleware/rate-limit';

const router = Router();

/**
 * POST /api/v1/documents/upload
 * Upload a document (rate limited)
 */
router.post('/upload', uploadLimiter, upload.single('file'), uploadDocument);

/**
 * GET /api/v1/documents/:id
 * Get document metadata
 */
router.get('/:id', getDocument);

/**
 * GET /api/v1/documents/:id/status
 * Get document processing status
 */
router.get('/:id/status', getDocumentStatus);

/**
 * POST /api/v1/documents/:id/process
 * Process document (extract text)
 */
router.post('/:id/process', processDocument);

/**
 * GET /api/v1/documents/:id/text
 * Get extracted text from processed document
 */
router.get('/:id/text', getExtractedText);

/**
 * DELETE /api/v1/documents/:id
 * Delete a document
 */
router.delete('/:id', deleteDocument);

export default router;
