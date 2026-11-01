/**
 * @fileoverview Controller for calendar file exports.
 */

import { generateIcs } from '../utils/ics.js';

export const exportController = Object.freeze({
  /**
   * Handles POST /api/export/ics
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  exportIcs(req, res, next) {
    try {
      const { timeline, eventName } = req.body || {};
      if (!Array.isArray(timeline) || timeline.length === 0) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Timeline array with at least one milestone is required for ICS export',
            details: [],
            requestId: req.id || '',
          },
        });
      }

      const icsData = generateIcs(timeline, eventName || 'Eventiq Plan');
      res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="event-timeline.ics"');
      return res.status(200).send(icsData);
    } catch (err) {
      return next(err);
    }
  },
});
