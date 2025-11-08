import { parsePDF, PDFParseResult } from './pdf-parser';
import { parseDOCX, DOCXParseResult } from './docx-parser';
import { parseExcel, ExcelParseResult } from './excel-parser';
import { parseCSV, CSVParseResult } from './csv-parser';
import { logger } from '../../utils/logger';
import path from 'path';

export interface ParseResult {
  text: string;
  pageCount?: number;
  wordCount: number;
  metadata?: any;
}

/**
 * Parse document based on file type
 */
export async function parseDocument(filePath: string, mimeType: string): Promise<ParseResult> {
  logger.info({ filePath, mimeType }, 'Parsing document');

  const ext = path.extname(filePath).toLowerCase();

  try {
    switch (ext) {
      case '.pdf':
        return await parsePDFDocument(filePath);

      case '.txt':
        return await parseTXTDocument(filePath);

      case '.docx':
      case '.doc':
        return await parseDOCXDocument(filePath);

      case '.xlsx':
      case '.xls':
        return await parseExcelDocument(filePath);

      case '.csv':
        return await parseCSVDocument(filePath);

      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  } catch (error) {
    logger.error({ filePath, mimeType, error }, 'Document parsing failed');
    throw error;
  }
}

/**
 * Parse PDF document
 */
async function parsePDFDocument(filePath: string): Promise<ParseResult> {
  const result: PDFParseResult = await parsePDF(filePath);

  return {
    text: result.text,
    pageCount: result.pageCount,
    wordCount: result.wordCount,
    metadata: result.metadata
  };
}

/**
 * Parse TXT document (simple text file)
 */
async function parseTXTDocument(filePath: string): Promise<ParseResult> {
  const fs = await import('fs/promises');

  try {
    const text = await fs.readFile(filePath, 'utf-8');

    // Count words
    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

    logger.info({ filePath, wordCount }, 'TXT parsing completed');

    return {
      text: text.trim(),
      wordCount,
      metadata: {}
    };
  } catch (error) {
    logger.error({ filePath, error }, 'TXT parsing failed');
    throw new Error(`Failed to parse TXT file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Parse DOCX/DOC document
 */
async function parseDOCXDocument(filePath: string): Promise<ParseResult> {
  const result: DOCXParseResult = await parseDOCX(filePath);

  return {
    text: result.text,
    pageCount: result.metadata.estimatedPages,
    wordCount: result.wordCount,
    metadata: result.metadata
  };
}

/**
 * Parse Excel document (XLSX/XLS)
 */
async function parseExcelDocument(filePath: string): Promise<ParseResult> {
  const result: ExcelParseResult = await parseExcel(filePath);

  return {
    text: result.text,
    wordCount: result.wordCount,
    metadata: result.metadata
  };
}

/**
 * Parse CSV document
 */
async function parseCSVDocument(filePath: string): Promise<ParseResult> {
  const result: CSVParseResult = await parseCSV(filePath);

  return {
    text: result.text,
    wordCount: result.wordCount,
    metadata: result.metadata
  };
}

/**
 * Check if document type is supported for parsing
 */
export function isParsingSupported(fileExtension: string): boolean {
  const supportedExtensions = ['.pdf', '.txt', '.docx', '.doc', '.xlsx', '.xls', '.csv'];
  return supportedExtensions.includes(fileExtension.toLowerCase());
}
