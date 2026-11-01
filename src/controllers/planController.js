/**
 * @fileoverview Thin controller for plan generation.
 */

import { generatePlan } from '../services/planService.js';

export const planController = Object.freeze({
  /**
   * Handles POST /api/plan
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  async create(req, res, next) {
    try {
      const services = req.app.locals.services || {};
      const plan = await generatePlan(req.body, services);
      return res.status(200).json(plan);
    } catch (err) {
      return next(err);
    }
  },
});

