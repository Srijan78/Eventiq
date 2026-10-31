/**
 * @fileoverview Plan orchestration service: runs decision engine and manages offline fallback.
 */

import { randomUUID } from 'node:crypto';
import { runEngine } from './decisionEngine.js';
import { sanitizeRequest } from '../utils/sanitize.js';
import { validatePlan } from '../schemas/planSchema.js';
import { logger } from '../utils/logger.js';

/**
 * Builds a natural-language contextual summary string.
 *
 * @param {object} req - Sanitized request
 * @param {object} engine - Decision engine output
 * @returns {string} Single-paragraph summary
 */
function buildSummary(req, engine) {
  const name = req.eventName || engine.profile.label;
  const location = req.city ? ` in ${req.city}` : '';
  const dateStr = req.eventDate;
  const budgetStr = `₹${req.budget.toLocaleString('en-IN')}`;
  const healthLabel = engine.budget.health.level.toUpperCase();

  return `${name} scheduled for ${dateStr}${location} for ${req.guests} guests with a budget of ${budgetStr} (${healthLabel} feasibility). Includes an optimized ${engine.budget.categories.length}-category budget breakdown, a ${engine.timeline.length}-milestone timeline, ${engine.vendors.length} vendor checklists, and curated creative concepts.`;
}

/**
 * Generates an event plan. Executes decision engine and merges content.
 * Gracefully defaults to deterministic offline templates if AI service is not provided or fails.
 *
 * @param {object} validatedRequest - Input validated by requestSchema
 * @param {object} [options={}] - Optional services (e.g. { geminiService })
 * @returns {Promise<object>} Complete validated Plan object conforming to planSchema
 */
export async function generatePlan(validatedRequest, options = {}) {
  const sanitized = sanitizeRequest(validatedRequest);
  logger.info({ eventType: sanitized.eventType, guests: sanitized.guests }, 'Executing decision engine');

  // Step 1: Execute deterministic decision engine
  const engine = runEngine(sanitized);

  const planId = randomUUID();
  const summary = buildSummary(sanitized, engine);

  // Default mode: offline deterministic template plan
  let mode = 'offline';
  let budgetCategories = engine.budget.categories;
  let timeline = engine.timeline;
  let vendors = engine.vendors;
  let ideas = engine.ideas;

  // Step 2: If geminiService is provided, attempt AI-mode enhancement (Step 8 wiring hook)
  if (options.geminiService && typeof options.geminiService.generateContent === 'function') {
    try {
      const aiContent = await options.geminiService.generateContent(engine, sanitized);
      if (aiContent) {
        mode = 'ai';
        if (aiContent.categories) {
          budgetCategories = budgetCategories.map((c) => {
            const match = aiContent.categories.find((ac) => ac.id === c.id);
            return match
              ? {
                  ...c,
                  rationale: match.rationale || c.rationale,
                  tips: match.tips && match.tips.length > 0 ? match.tips : c.tips,
                }
              : c;
          });
        }
        if (aiContent.timelineTasks) {
          timeline = timeline.map((m) => {
            const match = aiContent.timelineTasks.find((at) => at.milestoneId === m.id);
            return match && match.tasks && match.tasks.length > 0 ? { ...m, tasks: match.tasks } : m;
          });
        }
        if (aiContent.vendorGuidance) {
          vendors = vendors.map((v) => {
            const match = aiContent.vendorGuidance.find((av) => av.categoryId === v.categoryId);
            return match
              ? {
                  ...v,
                  questions: match.questions && match.questions.length > 0 ? match.questions : v.questions,
                  redFlags: match.redFlags && match.redFlags.length > 0 ? match.redFlags : v.redFlags,
                }
              : v;
          });
        }
        if (aiContent.ideas) {
          ideas = aiContent.ideas;
        }
      }
    } catch (err) {
      logger.warn({ err: err.message }, 'AI content generation failed, falling back to deterministic offline templates');
      mode = 'offline';
    }
  }

  // Step 3: Assemble complete Plan object
  const rawPlan = {
    id: planId,
    mode,
    request: sanitized,
    summary,
    budget: {
      total: engine.budget.total,
      perGuest: engine.budget.perGuest,
      health: engine.budget.health,
      categories: budgetCategories,
    },
    timeline,
    vendors,
    ideas,
    warnings: engine.warnings,
    risks: engine.risks,
    firedRules: engine.firedRules,
  };

  // Step 4: Validate plan against strict planSchema
  return validatePlan(rawPlan);
}
