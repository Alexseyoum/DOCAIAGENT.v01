import { Router, Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth-service';
import { authenticate, AuthRequest } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = Router();

// Simple in-memory user store for demo purposes
// In production, this would be a database
interface User {
  userId: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

const users = new Map<string, User>();

/**
 * POST /api/v1/auth/register
 * Register a new user (simplified demo version)
 */
router.post('/register', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Check if user already exists
    if (users.has(email)) {
      res.status(409).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: 'User with this email already exists',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Create user (simplified - in production, use bcrypt for password hashing)
    const bcrypt = await import('bcryptjs');
    const passwordHash = await bcrypt.hash(password, 10);
    const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const user: User = {
      userId,
      email,
      passwordHash,
      role: 'user',
      createdAt: new Date()
    };

    users.set(email, user);

    // Generate JWT token
    const token = authService.generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role
    });

    logger.info({ userId, email }, 'User registered');

    res.status(201).json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        token,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/login
 * Authenticate user and receive JWT token
 */
router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'Email and password are required',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Find user
    const user = users.get(email);
    if (!user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Verify password
    const bcrypt = await import('bcryptjs');
    const isValid = await bcrypt.compare(password, user.passwordHash);

    if (!isValid) {
      logger.warn({ email }, 'Invalid password attempt');
      res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          timestamp: new Date().toISOString()
        }
      });
      return;
    }

    // Generate JWT token
    const token = authService.generateToken({
      userId: user.userId,
      email: user.email,
      role: user.role
    });

    logger.info({ userId: user.userId, email }, 'User logged in');

    res.status(200).json({
      success: true,
      data: {
        userId: user.userId,
        email: user.email,
        role: user.role,
        token
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/auth/api-key
 * Generate an API key for the authenticated user
 */
router.post('/api-key', authenticate, (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
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

    const apiKey = authService.generateApiKey(req.user.userId);

    logger.info({ userId: req.user.userId }, 'API key generated');

    res.status(200).json({
      success: true,
      data: {
        apiKey,
        userId: req.user.userId,
        createdAt: new Date().toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/auth/me
 * Get current authenticated user info
 */
router.get('/me', authenticate, (req: AuthRequest, res: Response) => {
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

  res.status(200).json({
    success: true,
    data: {
      userId: req.user.userId,
      email: req.user.email,
      role: req.user.role
    }
  });
});

export default router;
