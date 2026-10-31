import test from 'node:test';
import assert from 'node:assert/strict';
import { buildTimeline, formatDate } from '../../src/services/timelineService.js';

test('timelineService.formatDate: formats date cleanly as YYYY-MM-DD', () => {
  const d = new Date(2027, 4, 15); // May 15, 2027
  assert.equal(formatDate(d), '2027-05-15');
});

test('timelineService.buildTimeline: collapses past milestones into single "Do Now" milestone dated today', () => {
  const today = new Date('2026-11-01');
  const eventDate = '2026-11-20'; // ~2.7 weeks away

  const sampleMilestones = [
    { id: 'm-far-past', label: 'Lock Venue 24 Weeks Ago', weeksBefore: 24 },
    { id: 'm-med-past', label: 'Send Invites 8 Weeks Ago', weeksBefore: 8 },
    { id: 'm-near-future', label: 'Final Walkthrough', weeksBefore: 1 },
    { id: 'm-day-of', label: 'Event Day', weeksBefore: 0 },
  ];

  const timeline = buildTimeline(sampleMilestones, eventDate, today);

  // Past milestones must collapse into the first item
  const doNow = timeline.find((m) => m.id === 'm-do-now');
  assert.ok(doNow, 'Must produce a "m-do-now" milestone for past items');
  assert.equal(doNow.dueDate, '2026-11-01');
  assert.equal(doNow.urgent, true);
  assert.equal(doNow.weeksLeft, 0);

  // Must contain tasks from both past milestones
  assert.ok(doNow.tasks.length >= 2);

  // Timeline must be sorted chronologically
  for (let i = 0; i < timeline.length - 1; i++) {
    assert.ok(
      timeline[i].dueDate <= timeline[i + 1].dueDate,
      `Timeline not sorted: ${timeline[i].dueDate} > ${timeline[i + 1].dueDate}`,
    );
  }
});

test('timelineService.buildTimeline: merges milestones falling on the exact same date', () => {
  const today = new Date('2026-11-01');
  const eventDate = '2027-05-01'; // 26 weeks away

  const duplicateDateMilestones = [
    { id: 'm1', label: 'Book Caterer', weeksBefore: 10 },
    { id: 'm2', label: 'Book Photographer', weeksBefore: 10 },
  ];

  const timeline = buildTimeline(duplicateDateMilestones, eventDate, today);
  assert.equal(timeline.length, 1);
  assert.ok(timeline[0].label.includes('Book Caterer'));
  assert.ok(timeline[0].label.includes('Book Photographer'));
  assert.equal(timeline[0].tasks.length, 2);
});
