/**
 * @fileoverview Central API routes definition.
 */

import { Router } from 'express';
import { validate } from '../middleware/validate.js';
import { generalLimiter, llmLimiter } from '../middleware/rateLimiter.js';
import { requestSchema } from '../schemas/requestSchema.js';
import { planController } from '../controllers/planController.js';
import { whatifController } from '../controllers/whatifController.js';
import { exportController } from '../controllers/exportController.js';

export const router = Router();

// Liveness probe
router.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

// Plan generation (AI with offline fallback)
router.post('/api/plan', llmLimiter, validate(requestSchema), planController.create);

// Deterministic What-if scenario recalculation
router.post('/api/plan/whatif', generalLimiter, validate(requestSchema), whatifController.recalculate);

// iCalendar (.ics) export
router.post('/api/export/ics', generalLimiter, exportController.exportIcs);

