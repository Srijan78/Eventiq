import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcile, computeHealth } from '../../src/services/budgetService.js';
import { getAllProfiles } from '../../src/profiles/index.js';

test('budgetService.reconcile: invariant sum(amounts) === budget strictly holds across all profiles and budgets', () => {
  const profiles = getAllProfiles();
  const testBudgets = [1000, 7777, 25000, 150000, 500000, 1234567, 100000000];

  for (const profile of profiles) {
    for (const budget of testBudgets) {
      const result = reconcile(budget, profile.budgetAllocation);
      const totalAmount = result.categories.reduce((acc, c) => acc + c.amount, 0);

      assert.equal(
        totalAmount,
        budget,
        `Reconciliation invariant failed for profile ${profile.id} with budget ${budget}`,
      );

      // Verify no negative category amounts
      for (const cat of result.categories) {
        assert.ok(cat.amount >= 0, `Category ${cat.id} has negative amount ${cat.amount}`);
      }

      // Verify contingency is present
      const contingency = result.categories.find((c) => c.id === 'contingency');
      assert.ok(contingency, `Contingency category missing in profile ${profile.id}`);
      assert.ok(contingency.amount > 0, `Contingency amount must be positive for budget ${budget}`);
    }
  }
});

test('budgetService.reconcile: enforces contingency floor of at least 5%', () => {
  const allocWithoutContingency = {
    venue: 50,
    catering: 50,
    contingency: 0,
  };

  const result = reconcile(100000, allocWithoutContingency);
  const contingency = result.categories.find((c) => c.id === 'contingency');
  assert.ok(contingency);
  assert.ok(
    contingency.percent >= 5,
    `Contingency percent must be >= 5%, got ${contingency.percent}`,
  );
  assert.ok(contingency.amount >= 5000);
});

test('budgetService.computeHealth: evaluates comfortable, tight, and unrealistic tiers accurately with cost multiplier', () => {
  const bands = { comfortable: 3000, tight: 1500 };

  // 1. Average cost level (multiplier 1.0)
  // perGuest = 4000 -> comfortable
  const h1 = computeHealth(4000, 'average', bands);
  assert.equal(h1.level, 'comfortable');

  // perGuest = 2000 -> tight
  const h2 = computeHealth(2000, 'average', bands);
  assert.equal(h2.level, 'tight');

  // perGuest = 1000 -> unrealistic
  const h3 = computeHealth(1000, 'average', bands);
  assert.equal(h3.level, 'unrealistic');

  // 2. High cost level (multiplier 1.3)
  // perGuest = 3333 -> effectivePerGuest = 3333 / 1.3 ≈ 2564 -> tight (between 1500 and 3000)
  const h4 = computeHealth(3333, 'high', bands);
  assert.equal(h4.level, 'tight');

  // 3. Low cost level (multiplier 0.8)
  // perGuest = 2500 -> effectivePerGuest = 2500 / 0.8 = 3125 -> comfortable
  const h5 = computeHealth(2500, 'low', bands);
  assert.equal(h5.level, 'comfortable');
});
