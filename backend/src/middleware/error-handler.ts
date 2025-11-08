import { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorCode } from '../types';
import { logger } from '../utils/logger';
import { MulterError } from 'multer';
import { config } from '../config';
import { errorTracking, sanitizeStackTrace, getErrorSeverity } from '../services/error-tracking';

/**
 * Custom API Error class
 */
export class ApiException extends Error {
  constructor(
    public code: ErrorCode,
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiException';
  }
}

/**
 * Creates an API error response
 */
export function createErrorResponse(
  code: ErrorCode,
  message: string,
  details?: any,
  supportedTypes?: string[]
): ApiError {
  return {
    code,
    message,
    details,
    supportedTypes,
    timestamp: new Date().toISOString()
  };
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const requestId = (req as any).requestId;
  const context = {
    requestId,
    endpoint: req.path,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip
  };

  // Log error with sanitized stack trace
  const sanitized = sanitizeStackTrace(err, config.env !== 'production');
  logger.error({
    ...sanitized,
    url: req.url,
    method: req.method,
    requestId,
    severity: getErrorSeverity(500)
  }, 'Request error');

  // Handle Multer errors
  if (err instanceof MulterError) {
    const errorCode = err.code === 'LIMIT_FILE_SIZE'
      ? ErrorCode.FILE_TOO_LARGE
      : ErrorCode.INVALID_PARAMETERS;
    const statusCode = err.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `File size exceeds maximum limit of ${config.maxFileSizeMB}MB`
      : err.message;

    // Track error
    errorTracking.trackError(errorCode, message, { ...context, statusCode });

    return res.status(statusCode).json({
      success: false,
      error: createErrorResponse(errorCode, message),
      requestId
    });
  }

  // Handle custom API exceptions
  if (err instanceof ApiException) {
    // Track error
    errorTracking.trackError(err.code, err.message, {
      ...context,
      statusCode: err.statusCode
    });

    return res.status(err.statusCode).json({
      success: false,
      error: createErrorResponse(
        err.code,
        err.message,
        err.details
      ),
      requestId
    });
  }

  // Handle unknown errors
  const statusCode = 500;
  const message = config.env === 'production' ? 'Internal server error' : err.message;

  // Track error
  errorTracking.trackError(ErrorCode.INTERNAL_ERROR, message, {
    ...context,
    statusCode
  });

  return res.status(statusCode).json({
    success: false,
    error: createErrorResponse(ErrorCode.INTERNAL_ERROR, message),
    requestId
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    error: createErrorResponse(
      ErrorCode.INVALID_PARAMETERS,
      `Route ${req.method} ${req.path} not found`
    ),
    requestId: (req as any).requestId
  });
}
