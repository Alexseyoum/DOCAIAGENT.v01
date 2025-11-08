import { Router, Request, Response } from 'express';
import { errorTracking } from '../services/error-tracking';

const router = Router();

/**
 * GET /api/v1/monitoring/errors
 * Get error metrics and statistics
 */
router.get('/errors', (_req: Request, res: Response) => {
  const metrics = errorTracking.getMetrics();

  res.json({
    success: true,
    data: {
      ...metrics,
      timestamp: new Date().toISOString()
    }
  });
});

/**
 * GET /api/v1/monitoring/errors/history
 * Get recent error history
 */
router.get('/errors/history', (req: Request, res: Response) => {
  const limit = parseInt(req.query.limit as string) || 50;
  const history = errorTracking.getHistory(limit);

  res.json({
    success: true,
    data: {
      errors: history,
      count: history.length
    }
  });
});

/**
 * GET /api/v1/monitoring/errors/endpoints
 * Get error breakdown by endpoint
 */
router.get('/errors/endpoints', (_req: Request, res: Response) => {
  const endpointErrors = errorTracking.getEndpointErrors(20);

  res.json({
    success: true,
    data: {
      endpoints: endpointErrors
    }
  });
});

export default router;
