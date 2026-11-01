/**
 * @fileoverview Centralized error handling and 404 middleware.
 */

import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

/**
 * Maps Zod issues to a friendly readable summary message.
 * @param {Array<import('zod').ZodIssue>} issues
 * @returns {string}
 */
function formatZodMessage(issues) {
  if (!issues || issues.length === 0) {
    return 'Invalid request payload';
  }
  const first = issues[0];
  const field = first.path.length > 0 ? `${first.path.join('.')}: ` : '';
  return `${field}${first.message}`;
}

/**
 * 404 Not Found middleware.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.originalUrl} not found`,
      details: [],
      requestId: req.id || '',
    },
  });
}

/**
 * Global Express error handling middleware.
 * Formats all errors into standard JSON structure without exposing stack traces.
 *
 * @param {Error} err
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} _next
 */
export function errorHandler(err, req, res, _next) {
  const requestId = req.id || '';

  // 1. Zod Validation Errors
  if (err instanceof ZodError) {
    const message = formatZodMessage(err.issues);
    logger.warn({ requestId, issues: err.issues }, 'Validation error');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: err.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
        requestId,
      },
    });
  }

  // 2. SyntaxError (malformed JSON payload)
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ requestId, err: err.message }, 'Malformed JSON body');
    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON payload in request body',
        details: [],
        requestId,
      },
    });
  }

  // 3. Payload Too Large
  if (err.type === 'entity.too.large') {
    logger.warn({ requestId }, 'Request entity too large');
    return res.status(413).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request payload exceeds maximum permitted size (20 KB)',
        details: [],
        requestId,
      },
    });
  }

  // 4. Rate limiting (if forwarded as error)
  if (err.status === 429) {
    return res.status(429).json({
      error: {
        code: 'RATE_LIMITED',
        message: err.message || 'Rate limit exceeded',
        details: [],
        requestId,
      },
    });
  }

  // 5. Upstream Service Errors
  if (err.status === 503 || err.code === 'UPSTREAM_UNAVAILABLE') {
    logger.error({ requestId, err: err.message }, 'Upstream service unavailable');
    return res.status(503).json({
      error: {
        code: 'UPSTREAM_UNAVAILABLE',
        message: 'The AI planning service is temporarily unavailable. Please retry or use offline mode.',
        details: [],
        requestId,
      },
    });
  }

  // 6. Generic Internal Server Errors
  logger.error({ requestId, err: err.message, stack: err.stack }, 'Unhandled internal server error');
  return res.status(500).json({
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal server error occurred while processing your request.',
      details: [],
      requestId,
    },
  });
}

