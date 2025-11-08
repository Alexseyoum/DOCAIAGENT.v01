import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';
import { queueService } from './services/queue-service';
import { cacheService } from './services/cache-service';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error(error, 'Configuration validation failed');
  process.exit(1);
}

// Create Express app
const app = createApp();

// Initialize cache service
cacheService.initialize().then(() => {
  logger.info({
    cacheType: cacheService.isUsingRedis() ? 'Redis' : 'In-Memory'
  }, 'Cache service initialized');
}).catch((error) => {
  logger.error({ error }, 'Failed to initialize cache service');
  process.exit(1);
});

// Initialize queue service
queueService.initialize().then(() => {
  logger.info({
    queueType: queueService.isUsingRedis() ? 'Redis' : 'In-Memory'
  }, 'Queue service initialized');
}).catch((error) => {
  logger.error({ error }, 'Failed to initialize queue service');
  process.exit(1);
});

// Start server
const server = app.listen(config.port, () => {
  logger.info({
    port: config.port,
    env: config.env,
    nodeVersion: process.version
  }, 'Server started successfully');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  await cacheService.close();
  await queueService.close();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT signal received: closing HTTP server');
  await cacheService.close();
  await queueService.close();
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

export { app, server };
