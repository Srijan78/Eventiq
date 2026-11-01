/**
 * @fileoverview Centralized error handling and 404 middleware.
 */

import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';
import { AppError } from '../utils/AppError.js';

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
 * Formats Zod validation issues into an HTTP 400 response.
 *
 * @param {ZodError} err
 * @param {string} requestId
 * @returns {{ status: number, body: object }}
 */
function formatZodResponse(err, requestId) {
  const message = formatZodMessage(err.issues);
  logger.warn({ requestId, issues: err.issues }, 'Validation error');
  return {
    status: 400,
    body: {
      error: {
        code: 'VALIDATION_ERROR',
        message,
        details: err.issues.map((i) => ({ path: i.path.join('.'), message: i.message })),
        requestId,
      },
    },
  };
}

/**
 * Handles JSON parsing syntax errors and oversized payload errors.
 *
 * @param {any} err
 * @param {string} requestId
 * @returns {{ status: number, body: object } | null}
 */
function resolvePayloadError(err, requestId) {
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    logger.warn({ requestId, err: err.message }, 'Malformed JSON body');
    return {
      status: 400,
      body: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Malformed JSON payload in request body',
          details: [],
          requestId,
        },
      },
    };
  }
  if (err.type === 'entity.too.large') {
    logger.warn({ requestId }, 'Request entity too large');
    return {
      status: 413,
      body: {
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Request payload exceeds maximum permitted size (20 KB)',
          details: [],
          requestId,
        },
      },
    };
  }
  return null;
}

/**
 * Formats client application errors (< 500 status).
 *
 * @param {any} err
 * @param {string} requestId
 * @returns {{ status: number, body: object } | null}
 */
function resolveAppClientError(err, requestId) {
  if (err instanceof AppError && err.status < 500) {
    logger.warn({ requestId, code: err.code, err: err.message }, 'Client application error');
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      },
    };
  }
  return null;
}

/**
 * Formats client-attributable errors (Zod, SyntaxError, PayloadTooLarge, AppError).
 *
 * @param {any} err
 * @param {string} requestId
 * @returns {{ status: number, body: object } | null}
 */
function resolveClientError(err, requestId) {
  if (err instanceof ZodError) {
    return formatZodResponse(err, requestId);
  }
  const payloadErr = resolvePayloadError(err, requestId);
  if (payloadErr) {
    return payloadErr;
  }
  return resolveAppClientError(err, requestId);
}

/**
 * Resolves upstream service outage errors.
 *
 * @param {any} err
 * @param {string} requestId
 * @returns {{ status: number, body: object } | null}
 */
function resolveUpstreamError(err, requestId) {
  if (err.status === 503 || err.code === 'UPSTREAM_UNAVAILABLE') {
    logger.error({ requestId, err: err.message }, 'Upstream service unavailable');
    return {
      status: 503,
      body: {
        error: {
          code: 'UPSTREAM_UNAVAILABLE',
          message:
            'The AI planning service is temporarily unavailable. Please retry or use offline mode.',
          details: [],
          requestId,
        },
      },
    };
  }
  return null;
}

/**
 * Resolves gateway or rate limit errors.
 *
 * @param {any} err
 * @param {string} requestId
 * @returns {{ status: number, body: object } | null}
 */
function resolveSpecialServerStatus(err, requestId) {
  if (err instanceof AppError && err.status >= 500) {
    logger.error({ requestId, code: err.code, err: err.message }, 'Server application error');
    return {
      status: err.status,
      body: {
        error: {
          code: err.code,
          message: err.message,
          details: err.details,
          requestId,
        },
      },
    };
  }
  if (err.status === 429) {
    return {
      status: 429,
      body: {
        error: {
          code: 'RATE_LIMITED',
          message: err.message || 'Rate limit exceeded',
          details: [],
          requestId,
        },
      },
    };
  }
  return resolveUpstreamError(err, requestId);
}

/**
 * Formats rate limit, upstream, or generic 500 errors.
 *
 * @param {Error} err
 * @param {string} requestId
 * @returns {{ status: number, body: object }}
 */
function resolveServerError(err, requestId) {
  const special = resolveSpecialServerStatus(err, requestId);
  if (special) {
    return special;
  }

  logger.error(
    { requestId, err: err.message, stack: err.stack },
    'Unhandled internal server error',
  );
  return {
    status: 500,
    body: {
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An internal server error occurred while processing your request.',
        details: [],
        requestId,
      },
    },
  };
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
  const clientResponse = resolveClientError(err, requestId);
  if (clientResponse) {
    return res.status(clientResponse.status).json(clientResponse.body);
  }

  const serverResponse = resolveServerError(err, requestId);
  return res.status(serverResponse.status).json(serverResponse.body);
}
