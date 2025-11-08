import { Request, Response, NextFunction } from 'express';
import { ApiError, ErrorCode } from '../types';
import { logger } from '../utils/logger';
import { MulterError } from 'multer';
import { config } from '../config';

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
  // Log error
  logger.error({
    err,
    url: req.url,
    method: req.method,
    requestId: (req as any).requestId
  }, 'Request error');

  // Handle Multer errors
  if (err instanceof MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: createErrorResponse(
          ErrorCode.FILE_TOO_LARGE,
          `File size exceeds maximum limit of ${config.maxFileSizeMB}MB`
        ),
        requestId: (req as any).requestId
      });
    }

    return res.status(400).json({
      success: false,
      error: createErrorResponse(
        ErrorCode.INVALID_PARAMETERS,
        err.message
      ),
      requestId: (req as any).requestId
    });
  }

  // Handle custom API exceptions
  if (err instanceof ApiException) {
    return res.status(err.statusCode).json({
      success: false,
      error: createErrorResponse(
        err.code,
        err.message,
        err.details
      ),
      requestId: (req as any).requestId
    });
  }

  // Handle unknown errors
  const statusCode = 500;
  return res.status(statusCode).json({
    success: false,
    error: createErrorResponse(
      ErrorCode.INTERNAL_ERROR,
      config.env === 'production' ? 'Internal server error' : err.message
    ),
    requestId: (req as any).requestId
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
