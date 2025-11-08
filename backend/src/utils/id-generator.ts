import { randomBytes } from 'crypto';

/**
 * Generates a unique document ID in format: doc_[16 alphanumeric chars]
 * Example: doc_a1b2c3d4e5f6g7h8
 */
export function generateDocumentId(): string {
  const randomPart = randomBytes(8).toString('hex'); // 16 hex characters
  return `doc_${randomPart}`;
}

/**
 * Generates a unique job ID in format: job_[16 alphanumeric chars]
 * Example: job_x1y2z3a4b5c6d7e8
 */
export function generateJobId(): string {
  const randomPart = randomBytes(8).toString('hex');
  return `job_${randomPart}`;
}

/**
 * Generates a unique request ID for tracing
 */
export function generateRequestId(): string {
  return `req_${randomBytes(8).toString('hex')}`;
}
