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

    // Check if parsing is supported for this file type
    if (!isParsingSupported(document.fileExtension)) {
      throw new ApiException(
        ErrorCode.PROCESSING_FAILED,
        400,
        `Text extraction not yet supported for ${document.fileExtension} files. Currently supported: .pdf, .docx, .doc, .txt, .xlsx, .xls, .csv`
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
 * Get extracted text from processed document (with pagination for large documents)
 * GET /api/v1/documents/:id/text
 */
export async function getExtractedText(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10000; // 10k characters per page
    const full = req.query.full === 'true'; // Get full text without pagination

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

    const textLength = document.extractedText.length;

    // Return full text if requested or if text is small
    if (full || textLength <= pageSize) {
      res.status(200).json({
        success: true,
        documentId: id,
        text: document.extractedText,
        wordCount: document.wordCount,
        pageCount: document.pageCount,
        extractedAt: document.extractedAt,
        pagination: {
          totalLength: textLength,
          currentPage: 1,
          totalPages: 1,
          pageSize: textLength
        }
      });
      return;
    }

    // Paginate large text
    const totalPages = Math.ceil(textLength / pageSize);
    const startIndex = (page - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, textLength);

    if (page < 1 || page > totalPages) {
      throw new ApiException(
        ErrorCode.INVALID_PARAMETERS,
        400,
        `Invalid page number. Valid range: 1-${totalPages}`
      );
    }

    const pageText = document.extractedText.substring(startIndex, endIndex);

    res.status(200).json({
      success: true,
      documentId: id,
      text: pageText,
      wordCount: document.wordCount,
      pageCount: document.pageCount,
      extractedAt: document.extractedAt,
      pagination: {
        totalLength: textLength,
        currentPage: page,
        totalPages,
        pageSize,
        startIndex,
        endIndex,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });

  } catch (error) {
    next(error);
  }
}
