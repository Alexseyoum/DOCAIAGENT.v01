import pdfParse from 'pdf-parse';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';

export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
}

export interface PDFParseResult {
  text: string;
  pageCount: number;
  metadata: PDFMetadata;
  wordCount: number;
}

/**
 * Parse PDF file and extract text with metadata
 */
export async function parsePDF(filePath: string): Promise<PDFParseResult> {
  const startTime = Date.now();

  try {
    logger.info({ filePath }, 'Starting PDF parsing');

    // Read the PDF file
    const dataBuffer = await fs.readFile(filePath);

    // Parse PDF
    const data = await pdfParse(dataBuffer, {
      // Limit to reasonable page count for performance
      max: 500,
    });

    // Extract metadata
    const metadata: PDFMetadata = {
      title: data.info?.Title,
      author: data.info?.Author,
      subject: data.info?.Subject,
      keywords: data.info?.Keywords,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      creationDate: data.info?.CreationDate ? new Date(data.info.CreationDate) : undefined,
      modificationDate: data.info?.ModDate ? new Date(data.info.ModDate) : undefined,
    };

    // Clean and normalize text
    const cleanedText = normalizeText(data.text);

    // Count words
    const wordCount = countWords(cleanedText);

    const duration = Date.now() - startTime;

    logger.info({
      filePath,
      pageCount: data.numpages,
      wordCount,
      duration
    }, 'PDF parsing completed successfully');

    return {
      text: cleanedText,
      pageCount: data.numpages,
      metadata,
      wordCount
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      filePath,
      duration,
      error
    }, 'PDF parsing failed');

    // Handle specific PDF errors
    if (error instanceof Error) {
      if (error.message.includes('encrypted') || error.message.includes('password')) {
        throw new Error('PDF is password-protected or encrypted. Please provide an unencrypted PDF.');
      }
      if (error.message.includes('Invalid PDF')) {
        throw new Error('Invalid or corrupted PDF file. Please upload a valid PDF.');
      }
    }

    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Normalize and clean extracted text
 */
function normalizeText(text: string): string {
  return text
    // Normalize whitespace
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove excessive blank lines (more than 2)
    .replace(/\n{3,}/g, '\n\n')
    // Trim whitespace from each line
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    // Trim overall
    .trim();
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  // Split by whitespace and filter empty strings
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Check if a file is a valid PDF (basic check)
 */
export async function isPDF(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filePath);
    // PDF files start with %PDF-
    return buffer.toString('utf-8', 0, 5) === '%PDF-';
  } catch {
    return false;
  }
}

/**
 * Get quick PDF info without full parsing (for large files)
 */
export async function getPDFInfo(filePath: string): Promise<{ pageCount: number }> {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdfParse(dataBuffer, {
      pagerender: () => '', // Don't render pages, just get info
      max: 0 // Don't parse content
    });

    return {
      pageCount: data.numpages
    };
  } catch (error) {
    logger.error({ filePath, error }, 'Failed to get PDF info');
    throw new Error('Failed to read PDF information');
  }
}
