export interface DocumentMetadata {
  documentId: string;
  filename: string;
  originalFilename: string;
  fileSize: number;
  mimeType: string;
  fileExtension: string;
  uploadedAt: string;
  status: DocumentStatus;
  pageCount?: number;
  filePath: string;
  // Text extraction results
  extractedText?: string;
  wordCount?: number;
  extractedAt?: string;
  extractionError?: string;
}

export type DocumentStatus = 'uploaded' | 'processing' | 'completed' | 'failed';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
  supportedTypes?: string[];
  timestamp: string;
}

export interface UploadResponse {
  success: boolean;
  documentId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
  pageCount?: number;
}

export interface DocumentRetrievalResponse {
  success: boolean;
  documentId: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string;
  status: DocumentStatus;
  pageCount?: number;
}

// Error codes
export enum ErrorCode {
  INVALID_FILE_TYPE = 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  NO_FILE_PROVIDED = 'NO_FILE_PROVIDED',
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  INVALID_PARAMETERS = 'INVALID_PARAMETERS',
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR = 'INTERNAL_ERROR'
}
