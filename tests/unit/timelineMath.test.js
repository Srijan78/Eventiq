import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, formatDate } from '../../src/services/timelineService.js';
import { getProfile } from '../../src/profiles/index.js';

const weddingMilestones = getProfile('wedding').timelineMilestones;

test('Timeline date math: Same-day event (eventDate === today)', () => {
  const fakeToday = new Date('2026-06-15T00:00:00.000Z');
  const todayStr = formatDate(fakeToday);

  const timeline = buildTimeline(weddingMilestones, todayStr, fakeToday);
  assert.ok(Array.isArray(timeline));
  assert.ok(timeline.length > 0);

  // All past milestones must collapse to "Do Now" dated today
  const doNow = timeline.find((m) => m.id === 'm-do-now');
  assert.ok(doNow, 'Must contain a "Do Now" milestone for past actions');
  assert.equal(doNow.dueDate, todayStr);
  assert.equal(doNow.urgent, true);

  // Assert chronologically sorted
  for (let i = 0; i < timeline.length - 1; i++) {
    assert.ok(new Date(timeline[i].dueDate) <= new Date(timeline[i + 1].dueDate));
  }

  // Assert no duplicate due dates
  const dates = timeline.map((m) => m.dueDate);
  assert.equal(new Set(dates).size, dates.length, 'No duplicate dates permitted');
});

test('Timeline date math: 1 day away event (tomorrow)', () => {
  const fakeToday = new Date('2026-08-01T00:00:00.000Z');
  const tomorrow = new Date('2026-08-02T00:00:00.000Z');

  const timeline = buildTimeline(weddingMilestones, formatDate(tomorrow), fakeToday);
  assert.ok(timeline.length > 0);

  // Should have Do Now and tomorrow's event-day milestone
  const dates = timeline.map((m) => m.dueDate);
  assert.equal(new Set(dates).size, dates.length, 'No duplicate milestone dates');
  assert.ok(
    timeline.every((m) => m.urgent === true),
    'All milestones must be urgent',
  );
});

test('Timeline date math: Long horizon (3 years away = 1095 days)', () => {
  const fakeToday = new Date('2026-01-01T00:00:00.000Z');
  const futureEvent = new Date('2029-01-01T00:00:00.000Z');

  const timeline = buildTimeline(weddingMilestones, formatDate(futureEvent), fakeToday);
  assert.ok(timeline.length > 0);

  // When event is 3 years away, zero milestones are in the past
  const doNow = timeline.find((m) => m.id === 'm-do-now');
  assert.equal(doNow, undefined, 'No "Do Now" milestone should exist when lead time is 3 years');

  // Verify chronological sorting
  for (let i = 0; i < timeline.length - 1; i++) {
    const cur = new Date(timeline[i].dueDate).getTime();
    const nxt = new Date(timeline[i + 1].dueDate).getTime();
    assert.ok(cur <= nxt, `Milestone ${i} is not chronologically sorted`);
  }
});

test('Timeline date math: Past milestones collapse and merge tasks without duplication', () => {
  const fakeToday = new Date('2026-05-10T00:00:00.000Z');
  const futureEvent = new Date('2026-05-25T00:00:00.000Z'); // 15 days (~2 weeks away)

  const timeline = buildTimeline(weddingMilestones, formatDate(futureEvent), fakeToday);
  const doNow = timeline.find((m) => m.id === 'm-do-now');

  assert.ok(doNow);
  assert.ok(doNow.tasks.length > 0, 'Catch-up tasks must be aggregated');
  assert.equal(doNow.dueDate, '2026-05-10');

  // Assert no duplicate dates
  const dates = timeline.map((m) => m.dueDate);
  assert.equal(new Set(dates).size, dates.length);
});
