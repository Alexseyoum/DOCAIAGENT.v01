import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';
import { logger } from './utils/logger';
import { requestIdMiddleware } from './middleware/request-id';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { healthService } from './services/health-service';
import { config } from './config';

// Routes
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import generationRoutes from './routes/generation';
import monitoringRoutes from './routes/monitoring';
import jobsRoutes from './routes/jobs';
import healthRoutes from './routes/health';
import webhooksRoutes from './routes/webhooks';

export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet());

  // CORS
  app.use(cors({
    origin: config.corsOrigins,
    credentials: true
  }));

  // Body parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request ID
  app.use(requestIdMiddleware);

  // Request tracking middleware
  app.use((_req: Request, res: Response, next: NextFunction) => {
    healthService.recordRequest();

    // Track errors
    const originalSend = res.send;
    res.send = function (data) {
      if (res.statusCode >= 500) {
        healthService.recordError();
      }
      return originalSend.call(this, data);
    };

    next();
  });

  // HTTP logging
  app.use(pinoHttp({
    logger,
    autoLogging: true,
    customLogLevel: (_req, res, err) => {
      if (res.statusCode >= 400 && res.statusCode < 500) {
        return 'warn';
      } else if (res.statusCode >= 500 || err) {
        return 'error';
      }
      return 'info';
    }
  }));

  // Health check routes
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api/v1/auth', authRoutes);
  app.use('/api/v1/documents', documentRoutes);
  app.use('/api/v1/generate', generationRoutes);
  app.use('/api/v1/jobs', jobsRoutes);
  app.use('/api/v1/monitoring', monitoringRoutes);
  app.use('/api/v1/webhooks', webhooksRoutes);

  // 404 handler
  app.use(notFoundHandler);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
