import { createApp } from './app';
import { config, validateConfig } from './config';
import { logger } from './utils/logger';

// Validate configuration
try {
  validateConfig();
} catch (error) {
  logger.error(error, 'Configuration validation failed');
  process.exit(1);
}

// Create Express app
const app = createApp();

// Start server
const server = app.listen(config.port, () => {
  logger.info({
    port: config.port,
    env: config.env,
    nodeVersion: process.version
  }, 'Server started successfully');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
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
