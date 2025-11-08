import { Request, Response, NextFunction } from 'express';
import { documentStore } from '../storage/document-store';
import { validateFile, getFileExtension } from '../utils/validation';
import { ApiException } from '../middleware/error-handler';
import { ErrorCode, DocumentMetadata, UploadResponse, DocumentRetrievalResponse } from '../types';
import { logger } from '../utils/logger';

/**
 * Upload a document
 * POST /api/v1/documents/upload
 */
export async function uploadDocument(req: Request, res: Response, next: NextFunction) {
  try {
    // Check if file was uploaded
    if (!req.file) {
      throw new ApiException(
        ErrorCode.NO_FILE_PROVIDED,
        400,
        'No file provided in request'
      );
    }

    // Validate file
    const validation = validateFile(req.file);
    if (!validation.valid) {
      throw new ApiException(
        ErrorCode.INVALID_FILE_TYPE,
        400,
        validation.error!,
        { supportedTypes: ['.pdf', '.docx', '.doc', '.txt', '.csv', '.xlsx'] }
      );
    }

    // Get documentId that was set by multer middleware
    const documentId = (req as any).documentId;

    // Create document metadata
    const metadata: DocumentMetadata = {
      documentId,
      filename: req.file.filename,
      originalFilename: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileExtension: getFileExtension(req.file.originalname),
      uploadedAt: new Date().toISOString(),
      status: 'uploaded',
      filePath: req.file.path
    };

    // Save to store
    documentStore.save(metadata);

    logger.info({
      documentId,
      filename: metadata.originalFilename,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType
    }, 'Document uploaded successfully');

    // Create response
    const response: UploadResponse = {
      success: true,
      documentId: metadata.documentId,
      filename: metadata.originalFilename,
      fileSize: metadata.fileSize,
      mimeType: metadata.mimeType,
      uploadedAt: metadata.uploadedAt,
      status: metadata.status,
      pageCount: metadata.pageCount
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get document metadata by ID
 * GET /api/v1/documents/:id
 */
export async function getDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    // Get document from store
    const document = documentStore.get(id);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${id} not found`
      );
    }

    // Create response
    const response: DocumentRetrievalResponse = {
      success: true,
      documentId: document.documentId,
      filename: document.originalFilename,
      fileSize: document.fileSize,
      mimeType: document.mimeType,
      uploadedAt: document.uploadedAt,
      status: document.status,
      pageCount: document.pageCount
    };

    res.status(200).json(response);
  } catch (error) {
    next(error);
  }
}

/**
 * Get document status
 * GET /api/v1/documents/:id/status
 */
export async function getDocumentStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const document = documentStore.get(id);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${id} not found`
      );
    }

    res.status(200).json({
      success: true,
      documentId: document.documentId,
      status: document.status,
      uploadedAt: document.uploadedAt
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a document
 * DELETE /api/v1/documents/:id
 */
export async function deleteDocument(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;

    const document = documentStore.get(id);

    if (!document) {
      throw new ApiException(
        ErrorCode.DOCUMENT_NOT_FOUND,
        404,
        `Document with ID ${id} not found`
      );
    }

    // Delete physical file from disk
    try {
      const fs = await import('fs/promises');
      await fs.unlink(document.filePath);
      logger.info({ documentId: id, filePath: document.filePath }, 'Physical file deleted');
    } catch (fileError) {
      // Log but don't fail if file is already deleted
      logger.warn({ documentId: id, error: fileError }, 'Could not delete physical file (may already be deleted)');
    }

    // Delete from store (this also removes generated content references)
    documentStore.delete(id);

    logger.info({ documentId: id }, 'Document deleted successfully');

    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
