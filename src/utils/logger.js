/**
 * @fileoverview Centralized Pino logger instance with privacy redaction.
 */

import pino from 'pino';
import { ENV } from '../config/env.js';

export const logger = pino({
  level: ENV.LOG_LEVEL || 'info',
  redact: {
    paths: [
      'req.body.notes',
      'body.notes',
      'notes',
      'req.headers.authorization',
      'req.headers.cookie',
    ],
    censor: '[REDACTED]',
  },
  timestamp: pino.stdTimeFunctions.isoTime,
});
