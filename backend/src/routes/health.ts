import { Router, Request, Response } from 'express';
import { healthService } from '../services/health-service';

const router = Router();

/**
 * GET /health
 * Basic health check endpoint
 */
router.get('/', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      status: health.status,
      timestamp: health.timestamp,
      uptime: health.uptime,
      version: health.version,
      environment: health.environment
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
});

/**
 * GET /health/detailed
 * Detailed health check with service status
 */
router.get('/detailed', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getHealthStatus();

    const statusCode = health.status === 'healthy' ? 200 :
                       health.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      success: true,
      data: health
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'HEALTH_CHECK_FAILED',
        message: 'Health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /health/ready
 * Kubernetes-style readiness probe
 */
router.get('/ready', async (_req: Request, res: Response) => {
  try {
    const isReady = await healthService.isReady();

    if (isReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(503).json({
        status: 'not ready',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: 'Readiness check failed'
    });
  }
});

/**
 * GET /health/live
 * Kubernetes-style liveness probe
 */
router.get('/live', (_req: Request, res: Response) => {
  const isAlive = healthService.isAlive();

  if (isAlive) {
    res.status(200).json({
      status: 'alive',
      timestamp: new Date().toISOString()
    });
  } else {
    res.status(503).json({
      status: 'dead',
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /health/stats
 * Get service statistics
 */
router.get('/stats', (_req: Request, res: Response) => {
  const stats = healthService.getStats();

  res.status(200).json({
    success: true,
    data: stats
  });
});

/**
 * GET /health/services
 * Check individual service health
 */
router.get('/services', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getHealthStatus();

    res.status(200).json({
      success: true,
      data: {
        services: health.services,
        timestamp: health.timestamp
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      error: {
        code: 'SERVICE_CHECK_FAILED',
        message: 'Service health check failed',
        timestamp: new Date().toISOString()
      }
    });
  }
});

/**
 * GET /health/system
 * Get system metrics
 */
router.get('/system', async (_req: Request, res: Response) => {
  try {
    const health = await healthService.getHealthStatus();

    res.status(200).json({
      success: true,
      data: {
        system: health.system,
        timestamp: health.timestamp
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: {
        code: 'SYSTEM_METRICS_FAILED',
        message: 'Failed to retrieve system metrics',
        timestamp: new Date().toISOString()
      }
    });
  }
});

export default router;
