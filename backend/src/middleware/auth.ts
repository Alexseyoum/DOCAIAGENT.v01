import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import { logger } from '../utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role: 'user' | 'admin';
  };
}

/**
 * JWT Authentication Middleware
 * Verifies JWT token from Authorization header
 */
export function authenticate(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_AUTH_TOKEN',
          message: 'Authorization header is required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Expected format: "Bearer <token>"
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_AUTH_FORMAT',
          message: 'Authorization header must be in format: Bearer <token>',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const token = parts[1];
    const payload = authService.verifyToken(token);

    // Attach user info to request
    req.user = {
      userId: payload.userId,
      email: payload.email,
      role: payload.role
    };

    logger.debug({ userId: payload.userId }, 'User authenticated');
    next();
  } catch (error) {
    logger.warn({ error }, 'Authentication failed');
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication token',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * API Key Authentication Middleware
 * Verifies API key from X-API-Key header
 */
export function authenticateApiKey(req: AuthRequest, res: Response, next: NextFunction): void {
  try {
    const apiKey = req.headers['x-api-key'] as string;

    if (!apiKey) {
      res.status(401).json({
        success: false,
        error: {
          code: 'MISSING_API_KEY',
          message: 'X-API-Key header is required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    const result = authService.verifyApiKey(apiKey);

    if (!result.valid) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Attach user info to request
    req.user = {
      userId: result.userId,
      email: '',
      role: 'user'
    };

    logger.debug({ userId: result.userId }, 'API key authenticated');
    next();
  } catch (error) {
    logger.warn({ error }, 'API key authentication failed');
    res.status(401).json({
      success: false,
      error: {
        code: 'INVALID_API_KEY',
        message: 'Invalid or expired API key',
        timestamp: new Date().toISOString()
      }
    });
  }
}

/**
 * Role-based authorization middleware
 * Requires authenticate middleware to be applied first
 */
export function requireRole(...roles: Array<'user' | 'admin'>) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      logger.warn({
        userId: req.user.userId,
        role: req.user.role,
        requiredRoles: roles
      }, 'Insufficient permissions');

      res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Insufficient permissions',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware
 * Authenticates if token is provided, but doesn't require it
 */
export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // No auth header, proceed without user
    next();
    return;
  }

  try {
    const parts = authHeader.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      const token = parts[1];
      const payload = authService.verifyToken(token);

      req.user = {
        userId: payload.userId,
        email: payload.email,
        role: payload.role
      };

      logger.debug({ userId: payload.userId }, 'Optional auth succeeded');
    }
  } catch (error) {
    // Invalid token, but don't fail - just proceed without user
    logger.debug({ error }, 'Optional auth failed, proceeding without user');
  }

  next();
}
