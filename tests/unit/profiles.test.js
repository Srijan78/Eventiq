import test from 'node:test';
import assert from 'node:assert/strict';
import { getProfile, getAllProfiles } from '../../src/profiles/index.js';

test('getAllProfiles: all profiles have valid contracts and allocations summing to 100%', () => {
  const profiles = getAllProfiles();
  assert.equal(profiles.length, 4);

  for (const profile of profiles) {
    assert.ok(profile.id, 'Profile must have an id');
    assert.ok(profile.label, 'Profile must have a label');
    assert.ok(profile.timelineMilestones.length > 0, 'Profile must have milestones');
    assert.ok(profile.vendorCategories.length > 0, 'Profile must have vendor categories');
    assert.ok(profile.perGuestBands.comfortable > profile.perGuestBands.tight, 'Bands must be ordered');
    assert.ok(Array.isArray(profile.rules), 'Rules must be an array');
    assert.ok(profile.templates, 'Profile must provide offline templates');

    // Allocation sum check
    const sum = Object.values(profile.budgetAllocation).reduce((acc, val) => acc + val, 0);
    assert.equal(sum, 100, `Profile ${profile.id} budgetAllocation must sum to 100%`);

    // Verify contingency is present and >= 5
    assert.ok(
      profile.budgetAllocation.contingency >= 5,
      `Profile ${profile.id} contingency must be at least 5%`,
    );
  }
});

test('birthday childBudgetAllocation: sums to exactly 100%', () => {
  const birthday = getProfile('birthday');
  assert.ok(birthday.childBudgetAllocation);
  const sum = Object.values(birthday.childBudgetAllocation).reduce((acc, val) => acc + val, 0);
  assert.equal(sum, 100, 'childBudgetAllocation must sum to 100%');
  assert.ok(birthday.childBudgetAllocation.contingency >= 5);
});

test('getProfile: resolves correct profiles and falls back to generic for unknown types', () => {
  assert.equal(getProfile('wedding').id, 'wedding');
  assert.equal(getProfile('WEDDING').id, 'wedding');
  assert.equal(getProfile('birthday').id, 'birthday');
  assert.equal(getProfile('community').id, 'community');
  assert.equal(getProfile('other').id, 'generic');
  assert.equal(getProfile('corporate-offsite').id, 'generic');
  assert.equal(getProfile(undefined).id, 'generic');
});

test('profile rules: are pure functions returning structured rule outputs', () => {
  const wedding = getProfile('wedding');
  const peakRule = wedding.rules.find((r) => r.id === 'W-PEAK-SEASON');
  assert.ok(peakRule);

  // October is month 10 -> peak
  const peakCtx = { eventMonth: 10, request: { wedding: {} } };
  assert.equal(peakRule.applies(peakCtx), true);

  const result = peakRule.apply(peakCtx);
  assert.ok(Array.isArray(result.warnings));
  assert.ok(Array.isArray(result.priorityFlags));
  assert.ok(Array.isArray(result.risks));

  // July is month 7 -> not peak
  const nonPeakCtx = { eventMonth: 7, request: { wedding: {} } };
  assert.equal(peakRule.applies(nonPeakCtx), false);
});
