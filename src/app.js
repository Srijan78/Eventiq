/**
 * @fileoverview Express application assembly with security middleware, compression, and routes.
 */

import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import { CONSTANTS } from './config/constants.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { router } from './routes/index.js';
import { ENV } from './config/env.js';
import { createGeminiService } from './services/geminiService.js';
import { logger } from './utils/logger.js';

export const app = express();

// Initialize AI services if API key is present
if (ENV.GEMINI_API_KEY) {
  logger.info({ model: ENV.GEMINI_MODEL }, 'Gemini API key detected; enabling AI mode');
  app.locals.services = {
    geminiService: createGeminiService(ENV.GEMINI_API_KEY, ENV.GEMINI_MODEL),
  };
} else {
  logger.info('No GEMINI_API_KEY provided; app running in 100% offline fallback mode');
  app.locals.services = {};
}

// Security headers with strict CSP
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }),
);

// Gzip compression
app.use(compression());

// Body size cap: strictly 20 KB per PRD
app.use(express.json({ limit: CONSTANTS.VALIDATION.MAX_BODY_SIZE_BYTES }));

// Request ID tracking
app.use(requestIdMiddleware);

// Serve static frontend assets
app.use(express.static('public'));

// Mount API routes
app.use(router);

// 404 Fallback for unmatched API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);
