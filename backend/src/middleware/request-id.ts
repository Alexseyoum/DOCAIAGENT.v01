import { Request, Response, NextFunction } from 'express';
import { generateRequestId } from '../utils/id-generator';

/**
 * Middleware to add unique request ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  (req as any).requestId = generateRequestId();
  res.setHeader('X-Request-Id', (req as any).requestId);
  next();
}
