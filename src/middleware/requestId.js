/**
 * @fileoverview Request ID injection middleware.
 */

import { randomUUID } from 'node:crypto';

/**
 * Middleware that assigns a unique UUID to each incoming request
 * and sets the X-Request-ID response header.
 *
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function requestIdMiddleware(req, res, next) {
  const reqId = req.headers['x-request-id'] || randomUUID();
  req.id = reqId;
  res.setHeader('X-Request-ID', reqId);
  next();
}
