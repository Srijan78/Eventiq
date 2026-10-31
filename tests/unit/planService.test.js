import test from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../../src/services/planService.js';

test('planService.generatePlan: produces complete, schema-compliant offline plan with all four outputs', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const dateStr = futureDate.toISOString().split('T')[0];

  const req = {
    eventType: 'wedding',
    eventDate: dateStr,
    guests: 150,
    budget: 500000,
    city: 'Hyderabad',
    costLevel: 'average',
    theme: 'Mughal Elegance',
    notes: 'No alcohol',
    wedding: {
      functions: ['wedding', 'reception'],
      indoor: true,
      dietary: 'Vegetarian',
    },
  };

  const plan = await generatePlan(req);

  // Mode check
  assert.equal(plan.mode, 'offline');

  // ID check
  assert.ok(plan.id);

  // Summary check
  assert.ok(plan.summary.length > 20);

  // Budget output check & invariant
  assert.equal(plan.budget.total, 500000);
  const sumAmount = plan.budget.categories.reduce((acc, c) => acc + c.amount, 0);
  assert.equal(sumAmount, 500000, 'Sum of categories must equal budget exactly');
  assert.ok(plan.budget.health.level);
  assert.ok(plan.budget.categories.length >= 5);

  // Timeline output check
  assert.ok(plan.timeline.length >= 4);
  assert.ok(plan.timeline[0].dueDate);
  assert.ok(plan.timeline[0].tasks.length > 0);

  // Vendors output check
  assert.ok(plan.vendors.length >= 4);
  assert.ok(plan.vendors[0].checklist.length > 0);
  assert.ok(plan.vendors[0].questions.length > 0);
  assert.ok(plan.vendors[0].redFlags.length > 0);

  // Ideas output check
  assert.ok(plan.ideas.themes.length > 0);
  assert.ok(plan.ideas.activities.length > 0);
  assert.ok(plan.ideas.menu.length > 0);
  assert.ok(plan.ideas.decor.length > 0);
  assert.ok(plan.ideas.extras.length > 0);

  // Context rules & risks
  assert.ok(plan.firedRules.length > 0);
  assert.ok(plan.risks.length > 0);
});

test('planService.generatePlan: gracefully falls back to offline mode when geminiService fails', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateStr = futureDate.toISOString().split('T')[0];

  const req = {
    eventType: 'birthday',
    eventDate: dateStr,
    guests: 20,
    budget: 20000,
    costLevel: 'average',
    birthday: { age: 10, surprise: false, indoor: true },
  };

  // Mock Gemini service that throws an error
  const failingGemini = {
    generateContent: async () => {
      throw new Error('Upstream quota exhausted or timeout');
    },
  };

  const plan = await generatePlan(req, { geminiService: failingGemini });
  assert.equal(plan.mode, 'offline');
  assert.equal(plan.budget.total, 20000);
  assert.ok(plan.budget.categories.length > 0);
});
