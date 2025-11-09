import { Request, Response, NextFunction } from 'express';
import { documentStore } from '../storage/document-store';
import { validateFile, getFileExtension } from '../utils/validation';
import { ApiException } from '../middleware/error-handler';
import { ErrorCode, DocumentMetadata, UploadResponse, DocumentRetrievalResponse } from '../types';
import { logger } from '../utils/logger';
import { getChunkingStats } from '../utils/text-chunking';

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
    const userId = (req as any).user?.userId;

    // Create document metadata
    const metadata: DocumentMetadata = {
      documentId,
      userId, // Associate document with authenticated user
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
    const userId = (req as any).user?.userId;

    // Get document from store and verify ownership
    const document = documentStore.getByIdAndUserId(id, userId);

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
 * List all documents
 * GET /api/v1/documents
 */
export async function listDocuments(req: Request, res: Response, next: NextFunction) {
  try {
    const userId = (req as any).user?.userId;

    // Get all documents for this user
    const documents = documentStore.getByUserId(userId);

    // Map to response format (including wordCount)
    const documentList = documents.map(doc => ({
      documentId: doc.documentId,
      filename: doc.originalFilename,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.uploadedAt,
      status: doc.status,
      pageCount: doc.pageCount,
      wordCount: doc.wordCount
    }));

    res.status(200).json({
      success: true,
      count: documentList.length,
      data: documentList
    });
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

/**
 * Get document size analysis and processing recommendations
 * GET /api/v1/documents/:id/analysis
 */
export async function getDocumentAnalysis(req: Request, res: Response, next: NextFunction) {
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

    const analysis: any = {
      documentId: id,
      filename: document.originalFilename,
      fileSize: {
        bytes: document.fileSize,
        kilobytes: Math.round(document.fileSize / 1024),
        megabytes: (document.fileSize / (1024 * 1024)).toFixed(2)
      },
      status: document.status
    };

    // Add extracted text analysis if available
    if (document.extractedText) {
      const chunkingStats = getChunkingStats(document.extractedText);

      analysis.textAnalysis = {
        textLength: chunkingStats.textLength,
        wordCount: document.wordCount,
        estimatedTokens: chunkingStats.estimatedTokens,
        isLarge: chunkingStats.textLength > 20000, // 20k+ characters considered large
        chunking: {
          required: chunkingStats.textLength > 8000, // Chunking recommended for 8k+ chars
          estimatedChunks: chunkingStats.estimatedChunks,
          recommendedChunkSize: chunkingStats.recommendedMaxChunkSize
        },
        pagination: {
          recommended: chunkingStats.textLength > 10000,
          defaultPageSize: 10000,
          estimatedPages: Math.ceil(chunkingStats.textLength / 10000)
        }
      };

      // Add processing recommendations
      analysis.recommendations = [];

      if (chunkingStats.textLength > 8000) {
        analysis.recommendations.push({
          type: 'chunking',
          message: 'Document is large. Consider using chunked processing for LLM operations.',
          endpoint: 'Use async job processing for better handling'
        });
      }

      if (chunkingStats.textLength > 10000) {
        analysis.recommendations.push({
          type: 'pagination',
          message: 'Use pagination when retrieving text',
          example: `/api/v1/documents/${id}/text?page=1&pageSize=10000`
        });
      }

      if (chunkingStats.estimatedTokens > 4000) {
        analysis.recommendations.push({
          type: 'token_limit',
          message: 'Document may exceed typical LLM context windows',
          suggestion: 'Use async job processing or summarize in chunks'
        });
      }
    } else {
      analysis.textAnalysis = {
        message: 'Document not yet processed. Process to get text analysis.',
        processEndpoint: `/api/v1/documents/${id}/process`
      };
    }

    res.status(200).json({
      success: true,
      data: analysis
    });

  } catch (error) {
    next(error);
  }
}
