import test from 'node:test';
import assert from 'node:assert/strict';
import { runEngine } from '../../src/services/decisionEngine.js';
import { getAllProfiles } from '../../src/profiles/index.js';
import { futureDate } from '../helpers/request.js';

/**
 * Deterministic pseudo-random number generator (Mulberry32).
 * @param {number} seed
 * @returns {() => number} Float in [0, 1)
 */
function createPrng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Asserts mathematical budget invariants.
 *
 * @param {number} iter
 * @param {number} seed
 * @param {number} rawBudget
 * @param {object} budget
 */
function assertBudgetInvariants(iter, seed, rawBudget, budget) {
  const categorySum = budget.categories.reduce((acc, cat) => acc + cat.amount, 0);

  // Invariant 1: Sum strictly equals input budget
  if (categorySum !== rawBudget) {
    assert.fail(
      `Invariant 1 Violated on iter ${iter} (seed: ${seed}): ${categorySum} !== ${rawBudget}`,
    );
  }

  // Invariant 2: No negative amounts
  for (const cat of budget.categories) {
    if (cat.amount < 0) {
      assert.fail(
        `Invariant 2 Violated on iter ${iter} (seed: ${seed}): negative amount ${cat.amount}`,
      );
    }
  }

  // Invariant 3 & 4: Contingency floor (at least 5%)
  const contingencyCat = budget.categories.find((c) => c.id === 'contingency');
  assert.ok(contingencyCat, `Contingency category missing on iter ${iter}`);
  if (contingencyCat.percent < 5) {
    assert.fail(
      `Invariant 3 Violated on iter ${iter} (seed: ${seed}): ${contingencyCat.percent}% < 5%`,
    );
  }

  const minContingencyRupees = Math.floor(rawBudget * 0.05);
  if (contingencyCat.amount < minContingencyRupees) {
    assert.fail(`Invariant 4 Violated on iter ${iter} (seed: ${seed}): amount < min floor`);
  }
}

/**
 * Builds request payload for a random property test case.
 *
 * @param {object} opts
 * @param {string} opts.eventType
 * @param {() => number} opts.casePrng
 * @param {number} opts.rawBudget
 * @param {number} opts.guests
 * @param {string} opts.costLevel
 * @param {number} opts.daysAhead
 * @returns {object}
 */
function buildPropertyRequest(opts) {
  const { eventType, casePrng, rawBudget, guests, costLevel, daysAhead } = opts;
  const request = {
    eventType,
    eventDate: futureDate(daysAhead),
    guests,
    budget: rawBudget,
    city: 'PropertyCity',
    costLevel,
  };

  if (eventType === 'wedding') {
    request.wedding = { functions: ['wedding'], indoor: casePrng() > 0.5 };
  } else if (eventType === 'birthday') {
    request.birthday = { childAge: Math.floor(casePrng() * 80) + 1, homeParty: casePrng() > 0.5 };
  } else if (eventType === 'community') {
    request.community = { outdoor: casePrng() > 0.5, expectedTurnout: guests };
  } else {
    request.eventName = 'Custom Event';
  }
  return request;
}

test('Property-based invariant test: 500+ seeded random cases across all 4 profiles', () => {
  const MASTER_SEED = 20261101;
  const prng = createPrng(MASTER_SEED);
  const profiles = getAllProfiles().map((p) => p.id);
  const costLevels = ['low', 'average', 'high'];
  const testIterations = 550;

  for (let i = 0; i < testIterations; i++) {
    const caseSeed = Math.floor(prng() * 1000000);
    const casePrng = createPrng(caseSeed);

    const eventType = profiles[Math.floor(casePrng() * profiles.length)];
    const rawBudget = Math.floor(casePrng() * casePrng() * 99999000) + 1000;
    const guests = Math.floor(casePrng() * 5000) + 1;
    const costLevel = costLevels[Math.floor(casePrng() * costLevels.length)];
    const daysAhead = Math.floor(casePrng() * 400) + 7;

    const request = buildPropertyRequest({
      eventType,
      casePrng,
      rawBudget,
      guests,
      costLevel,
      daysAhead,
    });
    const engineResult = runEngine(request);
    assertBudgetInvariants(i, caseSeed, rawBudget, engineResult.budget);
  }

  assert.ok(true, 'All 550 seeded property cases passed without invariant violation');
});
