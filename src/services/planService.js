/**
 * @fileoverview Plan orchestration service: runs decision engine and manages offline fallback.
 */

import { randomUUID } from 'node:crypto';
import { runEngine } from './decisionEngine.js';
import { sanitizeRequest } from '../utils/sanitize.js';
import { validatePlan } from '../schemas/planSchema.js';
import { planCache, buildCacheKey } from '../utils/cache.js';
import { logger } from '../utils/logger.js';
import { ENV } from '../config/env.js';

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
 * Looks up an identical cached plan for AI mode.
 *
 * @param {object} sanitized - Sanitized request
 * @returns {{ cacheKey: string, cachedPlan: object|null }}
 */
function checkPlanCache(sanitized) {
  const cacheKey = buildCacheKey(sanitized, ENV.GEMINI_MODEL);
  const cachedPlan = planCache.get(cacheKey);
  return { cacheKey, cachedPlan };
}

/**
 * Requests structured AI enhancements from Gemini with graceful fallback.
 *
 * @param {object|undefined} geminiService - Gemini service instance
 * @param {object} engine - Decision engine output
 * @param {object} sanitized - Sanitized request
 * @returns {Promise<{ mode: 'ai'|'offline', aiContent: object|null }>}
 */
async function fetchAiContent(geminiService, engine, sanitized) {
  if (!geminiService || typeof geminiService.generateContent !== 'function') {
    return { mode: 'offline', aiContent: null };
  }

  try {
    const aiContent = await geminiService.generateContent(engine, sanitized);
    if (aiContent) {
      return { mode: 'ai', aiContent };
    }
  } catch (err) {
    logger.warn({ err: err.message }, 'AI content generation failed, falling back to deterministic offline templates');
  }

  return { mode: 'offline', aiContent: null };
}

/**
 * Merges engine deterministic outputs with optional AI enhancements.
 *
 * @param {object} engine - Decision engine output
 * @param {object|null} aiContent - Optional AI enhancements
 * @returns {object} Merged categories, timeline, vendors, and ideas
 */
function mergeContent(engine, aiContent) {
  if (!aiContent) {
    return {
      categories: engine.budget.categories,
      timeline: engine.timeline,
      vendors: engine.vendors,
      ideas: engine.ideas,
    };
  }

  const categories = engine.budget.categories.map((c) => {
    const match = aiContent.categories?.find((ac) => ac.id === c.id);
    return match ? { ...c, rationale: match.rationale || c.rationale, tips: match.tips || c.tips } : c;
  });

  const timeline = engine.timeline.map((m) => {
    const match = aiContent.timelineTasks?.find((at) => at.milestoneId === m.id);
    return match?.tasks?.length ? { ...m, tasks: match.tasks } : m;
  });

  const vendors = engine.vendors.map((v) => {
    const match = aiContent.vendorGuidance?.find((av) => av.categoryId === v.categoryId);
    return match ? { ...v, questions: match.questions || v.questions, redFlags: match.redFlags || v.redFlags } : v;
  });

  const ideas = aiContent.ideas || engine.ideas;

  return { categories, timeline, vendors, ideas };
}

/**
 * Generates an event plan. Executes decision engine and merges content.
 * Target: under 40 lines.
 *
 * @param {object} validatedRequest - Input validated by requestSchema
 * @param {object} [options={}] - Optional services (e.g. { geminiService })
 * @returns {Promise<object>} Complete validated Plan object conforming to planSchema
 */
export async function generatePlan(validatedRequest, options = {}) {
  const sanitized = sanitizeRequest(validatedRequest);
  const { cacheKey, cachedPlan } = checkPlanCache(sanitized);

  if (cachedPlan) {
    logger.info({ cacheKey, eventType: sanitized.eventType }, 'Serving plan from LRU cache');
    return cachedPlan;
  }

  logger.info({ eventType: sanitized.eventType, guests: sanitized.guests }, 'Executing decision engine');
  const engine = runEngine(sanitized);
  const { mode, aiContent } = await fetchAiContent(options.geminiService, engine, sanitized);
  const merged = mergeContent(engine, aiContent);

  const rawPlan = {
    id: randomUUID(),
    mode,
    request: sanitized,
    summary: buildSummary(sanitized, engine),
    budget: {
      total: engine.budget.total,
      perGuest: engine.budget.perGuest,
      health: engine.budget.health,
      categories: merged.categories,
    },
    timeline: merged.timeline,
    vendors: merged.vendors,
    ideas: merged.ideas,
    warnings: engine.warnings,
    risks: engine.risks,
    firedRules: engine.firedRules,
  };

  const validatedPlan = validatePlan(rawPlan);
  if (mode === 'ai') {
    planCache.set(cacheKey, validatedPlan);
  }
  return validatedPlan;
}
