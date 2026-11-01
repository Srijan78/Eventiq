import test from 'node:test';
import assert from 'node:assert/strict';
import { SHARED_RULES } from '../../src/rules/sharedRules.js';
import { getAllProfiles } from '../../src/profiles/index.js';

test('Rule Contracts: All shared and profile rule IDs are unique', () => {
  const seenIds = new Set();
  const allRules = [...SHARED_RULES];

  for (const profile of getAllProfiles()) {
    allRules.push(...(profile.rules || []));
  }

  for (const rule of allRules) {
    assert.ok(rule.id, 'Every rule must have a non-empty string ID');
    assert.ok(!seenIds.has(rule.id), `Duplicate rule ID found: "${rule.id}"`);
    seenIds.add(rule.id);
  }
});

function assertZeroNetShifts(rule, ctx) {
  if (!rule.applies(ctx)) {
    return;
  }
  const result = rule.apply(ctx);
  if (!result?.allocationShifts) {
    return;
  }
  const shiftSum = Object.values(result.allocationShifts).reduce((a, b) => a + b, 0);
  assert.equal(
    shiftSum,
    0,
    `Rule "${rule.id}" allocation shifts must net to zero (got ${shiftSum})`,
  );
}

test('Rule Contracts: Every rule with allocation shifts nets strictly to zero', () => {
  const testContexts = [
    {
      request: {
        guests: 20,
        budget: 100000,
        wedding: { functions: ['wedding', 'reception'], indoor: false },
        birthday: { age: 7 },
        community: { expectedTurnout: 50, outdoor: false },
      },
      perGuest: 5000,
      costLevel: 'average',
      bands: { tight: 1500, comfortable: 3000 },
      weeksToEvent: 2,
      eventMonth: 7,
    },
    {
      request: {
        guests: 500,
        budget: 2000000,
        wedding: { functions: ['wedding', 'sangeet', 'mehendi'], indoor: true },
        birthday: { age: 10 },
        community: { expectedTurnout: 800, outdoor: true },
      },
      perGuest: 4000,
      costLevel: 'high',
      bands: { tight: 2000, comfortable: 4000 },
      weeksToEvent: 1,
      eventMonth: 8,
    },
  ];

  const allRules = [...SHARED_RULES];
  for (const profile of getAllProfiles()) {
    allRules.push(...(profile.rules || []));
  }

  for (const rule of allRules) {
    for (const ctx of testContexts) {
      assertZeroNetShifts(rule, ctx);
    }
  }
});

test('Table-driven boundary: guests intimate rule S-SMALL triggers on 29, not on 30', () => {
  const smallRule = SHARED_RULES.find((r) => r.id === 'S-SMALL');
  assert.ok(smallRule);

  assert.equal(smallRule.applies({ request: { guests: 29 } }), true);
  assert.equal(smallRule.applies({ request: { guests: 30 } }), false);
  assert.equal(smallRule.applies({ request: { guests: 31 } }), false);
});

test('Table-driven boundary: guests crowd rule S-LARGE triggers on 401, not on 400', () => {
  const largeRule = SHARED_RULES.find((r) => r.id === 'S-LARGE');
  assert.ok(largeRule);

  assert.equal(largeRule.applies({ request: { guests: 400 } }), false);
  assert.equal(largeRule.applies({ request: { guests: 401 } }), true);
  assert.equal(largeRule.applies({ request: { guests: 500 } }), true);
});

test('Table-driven boundary: urgent rule S-URGENT triggers on exactly 4 weeks (28 days)', () => {
  const urgentRule = SHARED_RULES.find((r) => r.id === 'S-URGENT');
  assert.ok(urgentRule);

  assert.equal(urgentRule.applies({ weeksToEvent: 4 }), true);
  assert.equal(urgentRule.applies({ weeksToEvent: 2 }), true);
  assert.equal(urgentRule.applies({ weeksToEvent: 1 }), false); // collapses to very-urgent
  assert.equal(urgentRule.applies({ weeksToEvent: 5 }), false);
});

test('Table-driven boundary: critical timeline S-VERY-URGENT triggers on exactly 1 week (7 days)', () => {
  const criticalRule = SHARED_RULES.find((r) => r.id === 'S-VERY-URGENT');
  assert.ok(criticalRule);

  assert.equal(criticalRule.applies({ weeksToEvent: 1 }), true);
  assert.equal(criticalRule.applies({ weeksToEvent: 0 }), true);
  assert.equal(criticalRule.applies({ weeksToEvent: 2 }), false);
});

test('Table-driven boundary: monsoon outdoor rule S-OUTDOOR-SEASON on month boundaries', () => {
  const monsoonRule = SHARED_RULES.find((r) => r.id === 'S-OUTDOOR-SEASON');
  assert.ok(monsoonRule);

  const outdoorReq = { request: { wedding: { indoor: false } } };
  const indoorReq = { request: { wedding: { indoor: true } } };

  // June (6) to September (9)
  assert.equal(monsoonRule.applies({ ...outdoorReq, eventMonth: 5 }), false); // May: false
  assert.equal(monsoonRule.applies({ ...outdoorReq, eventMonth: 6 }), true); // June: true
  assert.equal(monsoonRule.applies({ ...outdoorReq, eventMonth: 9 }), true); // September: true
  assert.equal(monsoonRule.applies({ ...outdoorReq, eventMonth: 10 }), false); // October: false

  // Indoor venue during monsoon should not trigger
  assert.equal(monsoonRule.applies({ ...indoorReq, eventMonth: 7 }), false);
});

test('Table-driven boundary: birthday child age boundary (12 vs 13)', () => {
  const birthdayProfile = getAllProfiles().find((p) => p.id === 'birthday');
  assert.ok(birthdayProfile);

  const childRule = birthdayProfile.rules.find((r) => r.id === 'B-CHILD');
  assert.ok(childRule);

  assert.equal(childRule.applies({ request: { birthday: { age: 12 } } }), true);
  assert.equal(childRule.applies({ request: { birthday: { age: 13 } } }), false);
  assert.equal(childRule.applies({ request: { birthday: { age: 5 } } }), true);
});
