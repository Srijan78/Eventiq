/**
 * @fileoverview Express rate limiters for general and LLM-backed endpoints.
 */

import rateLimit from 'express-rate-limit';
import { ENV } from '../config/env.js';
import { CONSTANTS } from '../config/constants.js';

const standardErrorResponse = (req, res) => {
  res.status(429).json({
    error: {
      code: 'RATE_LIMITED',
      message: 'Too many requests from this IP. Please wait a minute before trying again.',
      details: [],
      requestId: req.id || '',
    },
  });
};

/**
 * General API rate limiter (default: 60 req/min/IP).
 */
export const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: ENV.RATE_LIMIT_PER_MIN || CONSTANTS.RATE_LIMIT.DEFAULT_GENERAL_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardErrorResponse,
});

/**
 * Strict limiter for generative AI endpoints (default: 10 req/min/IP).
 */
export const llmLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: CONSTANTS.RATE_LIMIT.DEFAULT_LLM_PER_MIN,
  standardHeaders: true,
  legacyHeaders: false,
  handler: standardErrorResponse,
});
