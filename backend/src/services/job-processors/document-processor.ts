import { JobData, JobResult } from '../queue-service';
import { parseDocument } from '../parsers';
import { documentStore } from '../../storage/document-store';
import { logger } from '../../utils/logger';
import { webhookService } from '../webhook-service';

export async function processDocumentJob(jobData: JobData): Promise<JobResult> {
  try {
    const { documentId } = jobData;

    // Get document from store
    const document = documentStore.get(documentId);
    if (!document) {
      throw new Error(`Document not found: ${documentId}`);
    }

    logger.info({ documentId, filePath: document.filePath }, 'Processing document');

    // Parse document
    const parseResult = await parseDocument(document.filePath, document.mimeType);

    // Update document with extracted text
    documentStore.update(documentId, {
      extractedText: parseResult.text,
      wordCount: parseResult.wordCount,
      pageCount: parseResult.pageCount || document.pageCount,
      status: 'completed',
      extractedAt: new Date().toISOString()
    });

    logger.info({
      documentId,
      wordCount: parseResult.wordCount,
      pageCount: parseResult.pageCount
    }, 'Document processed successfully');

    // Trigger webhook
    webhookService.trigger('document.processed', {
      documentId,
      wordCount: parseResult.wordCount,
      pageCount: parseResult.pageCount,
      status: 'completed'
    }).catch(err => logger.error({ error: err }, 'Failed to trigger document.processed webhook'));

    return {
      success: true,
      data: {
        documentId,
        text: parseResult.text,
        wordCount: parseResult.wordCount,
        pageCount: parseResult.pageCount
      }
    };
  } catch (error) {
    logger.error({ error, documentId: jobData.documentId }, 'Document processing failed');

    // Update document status to failed
    try {
      documentStore.update(jobData.documentId, {
        status: 'failed',
        extractionError: error instanceof Error ? error.message : 'Unknown error'
      });
    } catch (updateError) {
      logger.error({ error: updateError }, 'Failed to update document status');
    }

    // Trigger webhook
    webhookService.trigger('document.failed', {
      documentId: jobData.documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 'failed'
    }).catch(err => logger.error({ error: err }, 'Failed to trigger document.failed webhook'));

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
