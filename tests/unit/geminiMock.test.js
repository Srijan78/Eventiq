import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../../src/services/planService.js';
import { planCache, buildCacheKey } from '../../src/utils/cache.js';
import { ENV } from '../../src/config/env.js';
import { createValidRequest } from '../helpers/request.js';

test('Gemini Mock: Success path produces AI mode, valid schema, and caches plan', async () => {
  const req = createValidRequest('wedding', { city: 'MockSuccessCity' });
  const fakeAiService = {
    async generateContent(engine) {
      return {
        categories: engine.budget.categories.map((c) => ({
          id: c.id,
          rationale: 'AI enhanced rationale',
          tips: ['AI custom tip 1'],
        })),
        ideas: {
          themes: ['Botanical Harmony: Fresh green aesthetics'],
          activities: ['Acoustic String Duo'],
          menu: ['Farm-to-table seasonal menu'],
          decor: ['Fairy-light canopy with botanical arches'],
          extras: ['Personalized guest favors'],
        },
        timelineTasks: [
          { milestoneId: 'm-venue-date', title: 'AI Task', detail: 'Lock in venue contract' },
        ],
        vendorGuidance: [
          {
            category: 'venue',
            questions: ['What is the noise curfew?'],
            redFlags: ['Unclear overtime fee structure'],
          },
        ],
      };
    },
  };

  const plan = await generatePlan(req, { geminiService: fakeAiService });
  assert.equal(plan.mode, 'ai');
  assert.equal(plan.ideas.themes[0], 'Botanical Harmony: Fresh green aesthetics');

  // Verify caching
  const key = buildCacheKey(req, ENV.GEMINI_MODEL);
  const cached = planCache.get(key);
  assert.ok(cached, 'Plan must be cached when mode is ai');
  assert.equal(cached.id, plan.id);
});

test('Gemini Mock: Invalid JSON output triggers safe offline fallback and is NOT cached', async () => {
  const req = createValidRequest('birthday', { city: 'MockInvalidJsonCity' });
  const fakeAiService = {
    async generateContent() {
      throw new Error(
        'Gemini returned invalid non-JSON output for BudgetIdeasCall: Unexpected token',
      );
    },
  };

  const plan = await generatePlan(req, { geminiService: fakeAiService });
  assert.equal(plan.mode, 'offline');
  assert.ok(plan.budget.categories.length > 0);
  assert.ok(plan.timeline.length > 0);

  // Verify NOT cached
  const key = buildCacheKey(req, ENV.GEMINI_MODEL);
  assert.equal(planCache.get(key), null, 'Offline plans must never be stored in cache');
});

test('Gemini Mock: Schema-invalid response triggers fallback to offline templates', async () => {
  const req = createValidRequest('community', { city: 'MockSchemaInvalidCity' });
  const fakeAiService = {
    async generateContent() {
      // Missing required ideas and vendorGuidance fields
      throw new Error('ZodValidationError: Invalid model output shape');
    },
  };

  const plan = await generatePlan(req, { geminiService: fakeAiService });
  assert.equal(plan.mode, 'offline');
  assert.ok(plan.ideas.themes.length > 0);
});

test('Gemini Mock: Upstream timeout falls back to offline mode', async () => {
  const req = createValidRequest('other', { city: 'MockTimeoutCity' });
  const fakeAiService = {
    async generateContent() {
      throw new Error('Operation "TimelineTasksCall" timed out after 15000ms');
    },
  };

  const plan = await generatePlan(req, { geminiService: fakeAiService });
  assert.equal(plan.mode, 'offline');
});

test('Gemini Mock: Model-returned amounts NEVER override engine budget amounts', async () => {
  const req = createValidRequest('wedding', { budget: 500000, city: 'ImmutabilityCity' });
  const fakeAiService = {
    async generateContent(engine) {
      return {
        // Attempting to override category amounts and percentages
        categories: engine.budget.categories.map((c) => ({
          id: c.id,
          amount: 99999999, // Malicious / hallucinated amount
          percentage: 99,
          rationale: 'Legitimate rationale',
          tips: ['Legitimate tip'],
        })),
        ideas: engine.ideas,
        timelineTasks: [],
        vendorGuidance: [],
      };
    },
  };

  const plan = await generatePlan(req, { geminiService: fakeAiService });
  assert.equal(plan.mode, 'ai');

  // Verify amounts match input budget exactly and engine calculations were untouched
  const sum = plan.budget.categories.reduce((acc, c) => acc + c.amount, 0);
  assert.equal(sum, 500000, 'Sum must remain strictly 500,000');

  for (const cat of plan.budget.categories) {
    assert.notEqual(cat.amount, 99999999, 'Model amount override must be ignored');
    assert.notEqual(cat.percentage, 99, 'Model percentage override must be ignored');
    assert.equal(cat.rationale, 'Legitimate rationale');
  }
});
