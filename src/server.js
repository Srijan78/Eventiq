/**
 * @fileoverview Server entry point and graceful process lifecycle management.
 */

import { app } from './app.js';
import { ENV } from './config/env.js';
import { logger } from './utils/logger.js';

const server = app.listen(ENV.PORT, () => {
  logger.info({ port: ENV.PORT, env: ENV.NODE_ENV }, `Eventiq server listening on http://localhost:${ENV.PORT}`);
});

function gracefulShutdown(signal) {
  logger.info({ signal }, 'Initiating graceful server shutdown');
  server.close(() => {
    logger.info('HTTP server closed cleanly. Process exiting.');
    process.exit(0);
  });

  // Force shutdown if connections do not close within 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout waiting for active connections to close.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
