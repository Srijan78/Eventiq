import test from 'node:test';
import assert from 'node:assert/strict';
import { validateRequest, validatePlan } from '../../src/schemas/index.js';

test('requestSchema: validates a standard wedding request successfully', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const dateStr = futureDate.toISOString().split('T')[0];

  const input = {
    eventType: 'wedding',
    eventDate: dateStr,
    guests: 150,
    budget: 500000,
    city: 'Chennai',
    costLevel: 'high',
    theme: 'Traditional Silk',
    notes: 'Vegetarian only',
    wedding: {
      functions: ['wedding', 'reception'],
      indoor: true,
      dietary: 'Strict Vegetarian',
    },
  };

  const validated = validateRequest(input);
  assert.equal(validated.eventType, 'wedding');
  assert.equal(validated.guests, 150);
  assert.equal(validated.budget, 500000);
  assert.equal(validated.costLevel, 'high');
  assert.equal(validated.city, 'Chennai');
});

test('requestSchema: fills default values for optional fields', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateStr = futureDate.toISOString().split('T')[0];

  const input = {
    eventType: 'birthday',
    eventDate: dateStr,
    guests: 25,
    budget: 25000,
  };

  const validated = validateRequest(input);
  assert.equal(validated.costLevel, 'average');
  assert.equal(validated.city, '');
  assert.equal(validated.theme, '');
  assert.equal(validated.notes, '');
  assert.equal(validated.birthday.surprise, false);
});

test('requestSchema: rejects past dates', () => {
  assert.throws(() => {
    validateRequest({
      eventType: 'birthday',
      eventDate: '2020-01-01',
      guests: 20,
      budget: 10000,
    });
  }, /cannot be in the past/);
});

test('requestSchema: rejects guests outside bounds [1, 5000]', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateStr = futureDate.toISOString().split('T')[0];

  assert.throws(() => {
    validateRequest({
      eventType: 'birthday',
      eventDate: dateStr,
      guests: 0,
      budget: 10000,
    });
  }, /Guest count must be at least 1/);

  assert.throws(() => {
    validateRequest({
      eventType: 'birthday',
      eventDate: dateStr,
      guests: 5001,
      budget: 10000,
    });
  }, /Guest count cannot exceed 5000/);
});

test('requestSchema: rejects budget outside bounds [1000, 100000000]', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateStr = futureDate.toISOString().split('T')[0];

  assert.throws(() => {
    validateRequest({
      eventType: 'community',
      eventDate: dateStr,
      guests: 100,
      budget: 500,
    });
  }, /Budget must be at least ₹1000/);

  assert.throws(() => {
    validateRequest({
      eventType: 'community',
      eventDate: dateStr,
      guests: 100,
      budget: 100000001,
    });
  }, /Budget cannot exceed ₹100000000/);
});

test('requestSchema: requires eventName when eventType is "other"', () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const dateStr = futureDate.toISOString().split('T')[0];

  assert.throws(() => {
    validateRequest({
      eventType: 'other',
      eventDate: dateStr,
      guests: 40,
      budget: 100000,
      eventName: '',
    });
  }, /Event name is required when event type is/);

  const validOther = validateRequest({
    eventType: 'other',
    eventDate: dateStr,
    guests: 40,
    budget: 100000,
    eventName: 'Corporate Offsite',
  });
  assert.equal(validOther.eventName, 'Corporate Offsite');
});

test('planSchema: validates a complete valid plan object', () => {
  const plan = {
    id: 'test-plan-1',
    mode: 'offline',
    request: { eventType: 'wedding' },
    summary: 'Plan summary for wedding',
    budget: {
      total: 500000,
      perGuest: 3333,
      health: { level: 'tight', reason: 'High per-guest ratio' },
      categories: [
        {
          id: 'venue',
          label: 'Venue',
          percent: 20,
          amount: 100000,
          rationale: 'Venue cost',
          tips: ['Book early'],
        },
      ],
    },
    timeline: [
      {
        id: 'm1',
        label: 'Finalize venue',
        dueDate: '2027-01-01',
        weeksLeft: 10,
        urgent: false,
        tasks: [{ title: 'Visit venues', detail: 'Compare 3 options' }],
      },
    ],
    vendors: [
      {
        categoryId: 'venue',
        label: 'Venue',
        bookByDate: '2027-01-01',
        priority: 'normal',
        checklist: ['Capacity check'],
        questions: ['Is sound allowed after 10pm?'],
        redFlags: ['No written contract'],
      },
    ],
    ideas: {
      themes: ['Eco-friendly'],
      activities: ['Live band'],
      menu: ['South Indian buffet'],
      decor: ['Marigold floral'],
      extras: ['Welcome drinks'],
    },
    warnings: ['Book venue soon'],
    risks: [
      {
        id: 'r1',
        title: 'Monsoon risk',
        severity: 2,
        mitigation: 'Reserve waterproof canopy',
      },
    ],
    firedRules: [
      {
        id: 'S-HEALTH',
        description: 'Budget health rule',
        effect: 'Protected catering by +4%',
      },
    ],
  };

  const validated = validatePlan(plan);
  assert.equal(validated.id, 'test-plan-1');
  assert.equal(validated.budget.categories[0].amount, 100000);
});
