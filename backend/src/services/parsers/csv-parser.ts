import { parse } from 'csv-parse/sync';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';

export interface CSVMetadata {
  rowCount: number;
  columnCount: number;
  hasHeader: boolean;
  headers?: string[];
  delimiter: string;
}

export interface CSVParseResult {
  text: string;
  wordCount: number;
  metadata: CSVMetadata;
  data: any[];
}

/**
 * Parse CSV file and extract text
 */
export async function parseCSV(filePath: string): Promise<CSVParseResult> {
  const startTime = Date.now();

  try {
    logger.info({ filePath }, 'Starting CSV parsing');

    // Read the CSV file
    const fileContent = await fs.readFile(filePath, 'utf-8');

    // Detect delimiter
    const delimiter = detectDelimiter(fileContent);

    // Parse CSV
    const records = parse(fileContent, {
      delimiter,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Handle inconsistent column counts
      columns: false // Don't use first row as headers initially
    });

    if (records.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Detect if first row is headers
    const hasHeader = detectHeaders(records);
    let headers: string[] | undefined;
    let dataRows = records;

    if (hasHeader && records.length > 1) {
      headers = records[0];
      dataRows = records.slice(1);
    }

    const rowCount = dataRows.length;
    const columnCount = records[0]?.length || 0;

    // Convert to readable text format
    const textLines: string[] = [];

    if (headers) {
      textLines.push(`Headers: ${headers.join(', ')}`);
      textLines.push('---');
    }

    // Add data rows
    dataRows.forEach((row, index) => {
      if (headers) {
        const rowData = headers.map((header, i) => `${header}: ${row[i] || ''}`).join(', ');
        textLines.push(`Row ${index + 1}: ${rowData}`);
      } else {
        textLines.push(`Row ${index + 1}: ${row.join(', ')}`);
      }
    });

    const combinedText = textLines.join('\n');
    const wordCount = countWords(combinedText);

    const metadata: CSVMetadata = {
      rowCount,
      columnCount,
      hasHeader,
      headers,
      delimiter
    };

    const duration = Date.now() - startTime;

    logger.info({
      filePath,
      rowCount,
      columnCount,
      wordCount,
      delimiter,
      duration
    }, 'CSV parsing completed successfully');

    return {
      text: combinedText,
      wordCount,
      metadata,
      data: dataRows
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      filePath,
      duration,
      error
    }, 'CSV parsing failed');

    throw new Error(`Failed to parse CSV file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect CSV delimiter (comma, semicolon, tab, pipe)
 */
function detectDelimiter(content: string): string {
  const delimiters = [',', ';', '\t', '|'];
  const firstLine = content.split('\n')[0] || '';

  let bestDelimiter = ',';
  let maxCount = 0;

  for (const delimiter of delimiters) {
    const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
    if (count > maxCount) {
      maxCount = count;
      bestDelimiter = delimiter;
    }
  }

  return bestDelimiter;
}

/**
 * Detect if first row contains headers (heuristic approach)
 */
function detectHeaders(records: any[][]): boolean {
  if (records.length < 2) {
    return false;
  }

  const firstRow = records[0];
  const secondRow = records[1];

  // Check if first row has string values and second row has different types
  let firstRowStrings = 0;
  let secondRowNumbers = 0;

  firstRow.forEach((val: any) => {
    if (typeof val === 'string' && isNaN(Number(val))) {
      firstRowStrings++;
    }
  });

  secondRow.forEach((val: any) => {
    if (!isNaN(Number(val))) {
      secondRowNumbers++;
    }
  });

  // If first row is mostly strings and second row has numbers, likely has headers
  return firstRowStrings > firstRow.length / 2 && secondRowNumbers > 0;
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}
