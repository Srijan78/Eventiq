import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';
import { dispatchRequest } from '../helpers/request.js';

test('GET /health: returns 200 with server status', async () => {
  const res = await dispatchRequest(app, { url: '/health' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(typeof data.uptime === 'number');
  assert.ok(data.timestamp);
});

test('POST /api/plan: returns 200 and complete offline plan for valid request', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 90);
  const dateStr = futureDate.toISOString().split('T')[0];

  const payload = {
    eventType: 'wedding',
    eventDate: dateStr,
    guests: 150,
    budget: 500000,
    city: 'Hyderabad',
    costLevel: 'average',
    theme: 'Floral Garden',
    notes: 'No peanuts',
    wedding: {
      functions: ['wedding', 'reception'],
      indoor: true,
      dietary: 'Vegetarian',
    },
  };

  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/plan',
    body: payload,
  });

  assert.equal(res.status, 200);
  assert.ok(res.headers['x-request-id']);

  const plan = await res.json();
  assert.equal(plan.mode, 'offline');
  assert.equal(plan.budget.total, 500000);
  assert.ok(plan.timeline.length > 0);
  assert.ok(plan.vendors.length > 0);
  assert.ok(plan.ideas.themes.length > 0);
  assert.ok(plan.firedRules.length > 0);
});

test('POST /api/plan: returns 400 VALIDATION_ERROR for invalid request body', async () => {
  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/plan',
    body: { eventType: 'invalid-type' },
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error.code, 'VALIDATION_ERROR');
  assert.ok(data.error.message);
  assert.ok(data.error.requestId);
});

test('POST /api/plan/whatif: recomputes budget deterministically', async () => {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 60);
  const dateStr = futureDate.toISOString().split('T')[0];

  const payload = {
    eventType: 'birthday',
    eventDate: dateStr,
    guests: 30,
    budget: 45000,
    costLevel: 'average',
  };

  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/plan/whatif',
    body: payload,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.budget.total, 45000);
  assert.ok(data.budget.health.level);
  assert.ok(data.firedRules.length > 0);
});

test('POST /api/export/ics: returns downloadable .ics calendar file', async () => {
  const payload = {
    eventName: 'Meera & Rohan Wedding',
    timeline: [
      {
        label: 'Lock Banquet Hall',
        dueDate: '2027-01-15',
        tasks: [{ title: 'Sign agreement', detail: 'Pay 25% token deposit' }],
      },
    ],
  };

  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/export/ics',
    body: payload,
  });

  assert.equal(res.status, 200);
  assert.ok(String(res.headers['content-type']).includes('text/calendar'));
  assert.ok(String(res.headers['content-disposition']).includes('event-timeline.ics'));

  const text = await res.text();
  assert.ok(text.includes('BEGIN:VCALENDAR'));
  assert.ok(text.includes('Lock Banquet Hall'));
  assert.ok(text.includes('END:VCALENDAR'));
});

test('GET /unknown-endpoint: returns 404 NOT_FOUND error shape', async () => {
  const res = await dispatchRequest(app, {
    url: '/api/does-not-exist',
  });
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.error.code, 'NOT_FOUND');
  assert.ok(data.error.requestId);
});
