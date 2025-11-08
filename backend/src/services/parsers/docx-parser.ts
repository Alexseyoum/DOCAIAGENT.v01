import mammoth from 'mammoth';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';

export interface DOCXMetadata {
  hasImages: boolean;
  hasTables: boolean;
  estimatedPages?: number;
}

export interface DOCXParseResult {
  text: string;
  html?: string;
  wordCount: number;
  metadata: DOCXMetadata;
}

/**
 * Parse DOCX file and extract text
 */
export async function parseDOCX(filePath: string): Promise<DOCXParseResult> {
  const startTime = Date.now();

  try {
    logger.info({ filePath }, 'Starting DOCX parsing');

    // Read the DOCX file
    const buffer = await fs.readFile(filePath);

    // Extract text using mammoth
    const result = await mammoth.extractRawText({ buffer });

    // Also extract HTML for richer formatting if needed
    const htmlResult = await mammoth.convertToHtml({ buffer });

    // Clean and normalize text
    const cleanedText = normalizeText(result.value);

    // Count words
    const wordCount = countWords(cleanedText);

    // Basic metadata extraction
    const metadata: DOCXMetadata = {
      hasImages: htmlResult.value.includes('<img'),
      hasTables: htmlResult.value.includes('<table'),
      estimatedPages: Math.ceil(wordCount / 250) // Rough estimate: 250 words per page
    };

    const duration = Date.now() - startTime;

    logger.info({
      filePath,
      wordCount,
      duration,
      warnings: result.messages.length
    }, 'DOCX parsing completed successfully');

    // Log any warnings from mammoth
    if (result.messages.length > 0) {
      logger.warn({
        filePath,
        messages: result.messages.map(m => m.message)
      }, 'DOCX parsing warnings');
    }

    return {
      text: cleanedText,
      html: htmlResult.value,
      wordCount,
      metadata
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      filePath,
      duration,
      error
    }, 'DOCX parsing failed');

    // Handle specific DOCX errors
    if (error instanceof Error) {
      if (error.message.includes('not a valid')) {
        throw new Error('Invalid or corrupted DOCX file. Please upload a valid Microsoft Word document.');
      }
      if (error.message.includes('password') || error.message.includes('encrypted')) {
        throw new Error('DOCX is password-protected. Please provide an unencrypted document.');
      }
    }

    throw new Error(`Failed to parse DOCX: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
 * Check if a file is a valid DOCX (basic check)
 */
export async function isDOCX(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filePath);
    // DOCX files are ZIP archives starting with PK
    return buffer.toString('utf-8', 0, 2) === 'PK';
  } catch {
    return false;
  }
}
