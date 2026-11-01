/**
 * @fileoverview Controller for deterministic what-if scenario recalculations.
 */

import { runEngine } from '../services/decisionEngine.js';

export const whatifController = Object.freeze({
  /**
   * Handles POST /api/plan/whatif
   * Recalculates budget, health, and rules without calling LLM.
   *
   * @param {import('express').Request} req
   * @param {import('express').Response} res
   * @param {import('express').NextFunction} next
   */
  recalculate(req, res, next) {
    try {
      const engine = runEngine(req.body);
      return res.status(200).json({
        budget: engine.budget,
        warnings: engine.warnings,
        risks: engine.risks,
        firedRules: engine.firedRules,
      });
    } catch (err) {
      return next(err);
    }
  },
});

