import rateLimit from 'express-rate-limit';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * General API rate limiter
 * Limits requests per IP address
 */
export const generalLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.rateLimitMaxRequests,
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: `Too many requests from this IP, please try again after ${config.rateLimitWindowMs / 1000} seconds`,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      method: req.method
    }, 'Rate limit exceeded');

    res.status(429).json({
      success: false,
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests, please try again after ${config.rateLimitWindowMs / 1000} seconds`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Strict rate limiter for uploads
 * More restrictive for resource-intensive operations
 */
export const uploadLimiter = rateLimit({
  windowMs: config.rateLimitWindowMs,
  max: config.uploadRateLimitMax,
  message: {
    success: false,
    error: {
      code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
      message: `Too many upload requests, please try again after ${config.rateLimitWindowMs / 1000} seconds`,
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      userAgent: req.get('user-agent')
    }, 'Upload rate limit exceeded');

    res.status(429).json({
      success: false,
      error: {
        code: 'UPLOAD_RATE_LIMIT_EXCEEDED',
        message: `Too many upload requests, please try again later`,
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Rate limiter for LLM generation endpoints
 * Prevents abuse of expensive AI operations
 */
export const generationLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: {
    success: false,
    error: {
      code: 'GENERATION_RATE_LIMIT_EXCEEDED',
      message: 'Too many generation requests, please try again after 1 minute',
      timestamp: new Date().toISOString()
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn({
      ip: req.ip,
      path: req.path,
      endpoint: req.path
    }, 'Generation rate limit exceeded');

    res.status(429).json({
      success: false,
      error: {
        code: 'GENERATION_RATE_LIMIT_EXCEEDED',
        message: 'Too many generation requests. AI operations are rate-limited to prevent abuse. Please try again in 1 minute.',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * Lenient rate limiter for read operations
 */
export const readLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting for health check
    return req.path === '/health';
  }
});
