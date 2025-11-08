import { Request, Response, NextFunction } from 'express';
import { documentStore } from '../storage/document-store';
import { parseDocument, isParsingSupported } from '../services/parsers';
import { ApiException } from '../middleware/error-handler';
import { ErrorCode } from '../types';
import { logger } from '../utils/logger';

/**
 * Process document (extract text)
 * POST /api/v1/documents/:id/process
 */
export async function processDocument(req: Request, res: Response, next: NextFunction) {
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

    // Check if parsing is supported for this file type
    if (!isParsingSupported(document.fileExtension)) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        `Text extraction not yet supported for ${document.fileExtension} files. Currently supported: .pdf, .txt`
      );
    }

    // Update status to processing
    documentStore.update(id, { status: 'processing' });

    logger.info({ documentId: id, fileType: document.fileExtension }, 'Starting document processing');

    try {
      // Parse the document
      const parseResult = await parseDocument(document.filePath, document.mimeType);

      // Update document with extracted text
      documentStore.update(id, {
        status: 'completed',
        extractedText: parseResult.text,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount || document.pageCount,
        extractedAt: new Date().toISOString()
      });

      logger.info({
        documentId: id,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount
      }, 'Document processing completed successfully');

      res.status(200).json({
        success: true,
        documentId: id,
        status: 'completed',
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount,
        extractedAt: new Date().toISOString()
      });

    } catch (parseError) {
      // Update status to failed
      const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error';

      documentStore.update(id, {
        status: 'failed',
        extractionError: errorMessage
      });

      logger.error({
        documentId: id,
        error: parseError
      }, 'Document processing failed');

      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        500,
        `Failed to process document: ${errorMessage}`
      );
    }

  } catch (error) {
    next(error);
  }
}

/**
 * Get extracted text from processed document
 * GET /api/v1/documents/:id/text
 */
export async function getExtractedText(req: Request, res: Response, next: NextFunction) {
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

    if (!document.extractedText) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        'Document has not been processed yet. Call POST /api/v1/documents/:id/process first.'
      );
    }

    res.status(200).json({
      success: true,
      documentId: id,
      text: document.extractedText,
      wordCount: document.wordCount,
      pageCount: document.pageCount,
      extractedAt: document.extractedAt
    });

  } catch (error) {
    next(error);
  }
}
