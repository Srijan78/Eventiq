import test from 'node:test';
import assert from 'node:assert/strict';
import { runEngine } from '../../src/services/decisionEngine.js';

test('decisionEngine: parametric evaluation across all event profiles produces valid plans', () => {
  const refDate = new Date('2026-11-01');

  const testCases = [
    {
      eventType: 'wedding',
      eventDate: '2027-05-15',
      guests: 150,
      budget: 1500000,
      costLevel: 'average',
      wedding: { functions: ['wedding', 'reception'], indoor: true, dietary: '' },
    },
    {
      eventType: 'birthday',
      eventDate: '2027-01-10',
      guests: 40,
      budget: 60000,
      costLevel: 'average',
      birthday: { age: 30, surprise: false, indoor: true },
    },
    {
      eventType: 'birthday',
      eventDate: '2027-01-10',
      guests: 20,
      budget: 25000,
      costLevel: 'average',
      birthday: { age: 7, surprise: true, indoor: true },
    },
    {
      eventType: 'community',
      eventDate: '2027-03-20',
      guests: 300,
      budget: 150000,
      costLevel: 'average',
      community: { expectedCrowd: 300, sponsorshipTarget: 50000, indoor: false, isPublic: true },
    },
    {
      eventType: 'other',
      eventName: 'Corporate Annual Offsite',
      eventDate: '2027-02-15',
      guests: 50,
      budget: 200000,
      costLevel: 'average',
    },
  ];

  for (const req of testCases) {
    const plan = runEngine(req, refDate);

    // 1. Budget reconciliation invariant
    const sum = plan.budget.categories.reduce((acc, c) => acc + c.amount, 0);
    assert.equal(
      sum,
      req.budget,
      `Sum invariant failed for ${req.eventType}: ${sum} !== ${req.budget}`,
    );

    // 2. Budget health exists
    assert.ok(plan.budget.health.level);
    assert.ok(plan.budget.health.reason);

    // 3. Timeline is non-empty and sorted
    assert.ok(plan.timeline.length > 0);
    for (let i = 0; i < plan.timeline.length - 1; i++) {
      assert.ok(plan.timeline[i].dueDate <= plan.timeline[i + 1].dueDate);
    }

    // 4. Vendors exist and have questions & red flags
    assert.ok(plan.vendors.length > 0);
    for (const v of plan.vendors) {
      assert.ok(v.questions.length > 0);
      assert.ok(v.redFlags.length > 0);
    }

    // 5. "Why this plan" fired rules are populated
    assert.ok(plan.firedRules.length > 0);
    assert.ok(plan.risks.length > 0);
  }
});

test('decisionEngine: rule S-HEALTH triggers tight budget adjustments (+4 catering, -4 decor)', () => {
  const refDate = new Date('2026-11-01');
  // 150 guests with ₹3,50,000 budget at high cost level -> tight (effective ≈ 1795, between 1500 and 3000)
  const req = {
    eventType: 'wedding',
    eventDate: '2027-06-01',
    guests: 150,
    budget: 350000,
    costLevel: 'high',
    wedding: { functions: ['wedding'], indoor: true },
  };

  const plan = runEngine(req, refDate);
  assert.equal(plan.budget.health.level, 'tight');

  const sHealthRule = plan.firedRules.find((r) => r.id === 'S-HEALTH');
  assert.ok(sHealthRule);

  // Compare catering vs profile base: 30% base + 4% = 34% (approx normalized)
  const catering = plan.budget.categories.find((c) => c.id === 'catering');
  const decor = plan.budget.categories.find((c) => c.id === 'decor');
  assert.ok(catering.percent > 30, 'Catering should have increased');
  assert.ok(decor.percent < 12, 'Decor should have decreased');
});

test('decisionEngine: rule B-CHILD uses child variant and calculates adult supervision ratio', () => {
  const refDate = new Date('2026-11-01');
  const req = {
    eventType: 'birthday',
    eventDate: '2026-12-01',
    guests: 24, // 24 / 8 = 3 supervisors needed
    budget: 20000,
    birthday: { age: 6, surprise: false, indoor: true },
  };

  const plan = runEngine(req, refDate);
  const childRule = plan.firedRules.find((r) => r.id === 'B-CHILD');
  assert.ok(childRule);

  // Check supervisor warning
  const supervisorWarning = plan.warnings.find((w) => w.includes('3 adult supervisors'));
  assert.ok(supervisorWarning, 'Must advise 3 adult supervisors for 24 children');

  // Check cake percent in child allocation (child base is 7%, adult base is 6%)
  const cake = plan.budget.categories.find((c) => c.id === 'cake');
  assert.ok(cake);
});

test('decisionEngine: rule S-URGENT fires when event is under 4 weeks away', () => {
  const refDate = new Date('2026-11-01');
  const req = {
    eventType: 'wedding',
    eventDate: '2026-11-20', // ~2.7 weeks away
    guests: 50,
    budget: 200000,
  };

  const plan = runEngine(req, refDate);
  const urgentRule = plan.firedRules.find((r) => r.id === 'S-URGENT');
  assert.ok(urgentRule, 'S-URGENT must fire when < 4 weeks away');

  // Priority flags must be set to immediate on vendors
  const venueVendor = plan.vendors.find((v) => v.categoryId === 'venue');
  assert.equal(venueVendor.priority, 'immediate');
});

test('decisionEngine: rule C-NOC and C-SAFETY-TIER fire for large public gatherings', () => {
  const refDate = new Date('2026-11-01');
  const req = {
    eventType: 'community',
    eventDate: '2027-04-10',
    guests: 800,
    budget: 400000,
    community: { expectedCrowd: 800, isPublic: true, sponsorshipTarget: 100000 },
  };

  const plan = runEngine(req, refDate);
  const nocRule = plan.firedRules.find((r) => r.id === 'C-NOC');
  const safetyTierRule = plan.firedRules.find((r) => r.id === 'C-SAFETY-TIER');
  assert.ok(nocRule);
  assert.ok(safetyTierRule);

  const sponsorWarning = plan.warnings.find((w) => w.includes('Sponsorship target'));
  assert.ok(sponsorWarning);
});

test('decisionEngine: rule S-OUTDOOR-SEASON fires for monsoon outdoor events', () => {
  const refDate = new Date('2026-11-01');
  const req = {
    eventType: 'wedding',
    eventDate: '2027-07-15', // July is Monsoon
    guests: 100,
    budget: 500000,
    wedding: { indoor: false },
  };

  const plan = runEngine(req, refDate);
  const monsoonRule = plan.firedRules.find((r) => r.id === 'S-OUTDOOR-SEASON');
  assert.ok(monsoonRule);

  const monsoonRisk = plan.risks.find((r) => r.id === 'monsoon-disruption');
  assert.ok(monsoonRisk);
  assert.equal(monsoonRisk.severity, 3);
});
