import * as XLSX from 'xlsx';
import fs from 'fs/promises';
import { logger } from '../../utils/logger';

export interface ExcelMetadata {
  sheetNames: string[];
  sheetCount: number;
  totalRows: number;
  totalColumns: number;
  hasFormulas: boolean;
}

export interface ExcelParseResult {
  text: string;
  wordCount: number;
  metadata: ExcelMetadata;
  sheets: Array<{
    name: string;
    data: string;
    rowCount: number;
  }>;
}

/**
 * Parse Excel file (XLSX, XLS) and extract text
 */
export async function parseExcel(filePath: string): Promise<ExcelParseResult> {
  const startTime = Date.now();

  try {
    logger.info({ filePath }, 'Starting Excel parsing');

    // Read the Excel file
    const buffer = await fs.readFile(filePath);
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const sheets: Array<{ name: string; data: string; rowCount: number }> = [];
    let totalRows = 0;
    let totalColumns = 0;
    let hasFormulas = false;
    const allText: string[] = [];

    // Process each sheet
    for (const sheetName of workbook.SheetNames) {
      const worksheet = workbook.Sheets[sheetName];

      // Convert to CSV format for easy text extraction
      const csvData = XLSX.utils.sheet_to_csv(worksheet);

      // Get sheet statistics
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const rowCount = range.e.r - range.s.r + 1;
      const colCount = range.e.c - range.s.c + 1;

      totalRows += rowCount;
      totalColumns = Math.max(totalColumns, colCount);

      // Check for formulas
      if (!hasFormulas) {
        Object.keys(worksheet).forEach(cell => {
          if (cell[0] !== '!' && worksheet[cell].f) {
            hasFormulas = true;
          }
        });
      }

      // Format sheet data with header
      const sheetText = `Sheet: ${sheetName}\n${csvData}`;
      sheets.push({
        name: sheetName,
        data: csvData,
        rowCount
      });

      allText.push(sheetText);
    }

    // Combine all text
    const combinedText = allText.join('\n\n');
    const wordCount = countWords(combinedText);

    const metadata: ExcelMetadata = {
      sheetNames: workbook.SheetNames,
      sheetCount: workbook.SheetNames.length,
      totalRows,
      totalColumns,
      hasFormulas
    };

    const duration = Date.now() - startTime;

    logger.info({
      filePath,
      sheetCount: metadata.sheetCount,
      totalRows,
      wordCount,
      duration
    }, 'Excel parsing completed successfully');

    return {
      text: combinedText,
      wordCount,
      metadata,
      sheets
    };

  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error({
      filePath,
      duration,
      error
    }, 'Excel parsing failed');

    throw new Error(`Failed to parse Excel file: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  const words = text.split(/\s+/).filter(word => word.length > 0);
  return words.length;
}

/**
 * Check if a file is a valid Excel file
 */
export async function isExcel(filePath: string): Promise<boolean> {
  try {
    const buffer = await fs.readFile(filePath);
    // Check for Excel magic numbers
    // XLSX: PK (ZIP format)
    // XLS: D0 CF 11 E0 (OLE2 format)
    const header = buffer.toString('hex', 0, 4);
    return header === '504b0304' || header === 'd0cf11e0';
  } catch {
    return false;
  }
}
