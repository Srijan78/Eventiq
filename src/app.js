/**
 * @fileoverview Express application assembly with security middleware, compression, and routes.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.resolve(__dirname, '../public');

export const app = express();

// Trust reverse proxy if configured (e.g. behind load balancer or serverless gateway)
app.set('trust proxy', ENV.TRUST_PROXY);

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
        styleSrc: ["'self'"],
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

// Request ID tracking (runs before body parsing so all errors include requestId)
app.use(requestIdMiddleware);

// Body size cap: strictly 20 KB per PRD
app.use(express.json({ limit: CONSTANTS.VALIDATION.MAX_BODY_SIZE_BYTES }));

// Serve static frontend assets with absolute path for serverless bundling
app.use(express.static(publicPath));

// Serverless and reverse-proxy root fallback: In local Express runs express.static automatically
// delivers index.html from public/. In certain serverless hosts and edge environments where static
// folder routing is bypassed or abstracted, this explicit route guarantees GET / always serves the index page.
app.get('/', (_req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Mount API routes
app.use(router);

// 404 Fallback for unmatched API routes
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

export default app;
