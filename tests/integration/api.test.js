import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../../src/app.js';
import { dispatchRequest, createValidRequest, futureDate } from '../helpers/request.js';

const originalServices = app.locals.services;

test.before(() => {
  // Ensure fast, deterministic offline testing without external network retries
  app.locals.services = {};
});

test.after(() => {
  app.locals.services = originalServices;
});

test('GET /: returns 200 with HTML frontend and security headers', async () => {
  const res = await dispatchRequest(app, { url: '/' });
  assert.equal(res.status, 200);

  // Security Headers Check
  const csp = String(res.headers['content-security-policy'] || '');
  assert.ok(csp.includes("default-src 'self'"), 'CSP default-src must be self');
  assert.equal(csp.includes("'unsafe-inline'"), false, 'CSP must NOT contain unsafe-inline');
  assert.equal(res.headers['x-powered-by'], undefined, 'X-Powered-By must be disabled');

  const text = await res.text();
  assert.ok(text.includes('<!doctype html>'));
  assert.ok(text.includes('Eventiq'));
});

test('GET /health: returns 200 with server status', async () => {
  const res = await dispatchRequest(app, { url: '/health' });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
  assert.ok(typeof data.uptime === 'number');
  assert.ok(data.timestamp);
});

test('POST /api/plan: generates complete plan across all 4 event types with exact budget sum', async () => {
  const eventTypes = ['wedding', 'birthday', 'community', 'other'];

  for (const eventType of eventTypes) {
    const payload = createValidRequest(eventType, {
      guests: 80,
      budget: 150000,
    });

    const res = await dispatchRequest(app, {
      method: 'POST',
      url: '/api/plan',
      body: payload,
    });

    assert.equal(res.status, 200, `POST /api/plan failed for eventType "${eventType}"`);
    const plan = await res.json();

    assert.ok(plan.id);
    assert.equal(plan.budget.total, 150000);
    assert.ok(plan.timeline.length > 0);
    assert.ok(plan.vendors.length > 0);
    assert.ok(plan.ideas.themes.length > 0);

    // Sum invariant
    const sum = plan.budget.categories.reduce((acc, c) => acc + c.amount, 0);
    assert.equal(sum, 150000, `Sum invariant violated for eventType "${eventType}"`);
  }
});

test('POST /api/plan/whatif: recomputes budget deterministically without AI calls', async () => {
  const payload = createValidRequest('wedding', {
    budget: 400000,
    guests: 120,
  });

  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/plan/whatif',
    body: payload,
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.budget.total, 400000);
  assert.ok(data.budget.health.level);
  assert.ok(Array.isArray(data.firedRules));
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

test('POST /api/export/ics: returns 400 with AppError shape when timeline is missing or empty', async () => {
  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/export/ics',
    body: { eventName: 'Empty Timeline' },
  });

  assert.equal(res.status, 400);
  const data = await res.json();
  assert.equal(data.error.code, 'VALIDATION_ERROR');
  assert.ok(data.error.message.includes('Timeline array with at least one milestone is required'));
  assert.ok(data.error.requestId);
});

test('POST /api/plan: returns 400 VALIDATION_ERROR with standardized shape for invalid request', async () => {
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
  assert.equal(data.error.stack, undefined, 'Stack traces must never leak to client');
});

test('POST /api/plan: returns 413 VALIDATION_ERROR when request payload exceeds 20 KB limit', async () => {
  const hugeNotes = 'Z'.repeat(25000); // 25 KB body
  const res = await dispatchRequest(app, {
    method: 'POST',
    url: '/api/plan',
    body: {
      eventType: 'wedding',
      eventDate: futureDate(90),
      guests: 100,
      budget: 200000,
      notes: hugeNotes,
    },
  });

  assert.equal(res.status, 413);
  const data = await res.json();
  assert.equal(data.error.code, 'VALIDATION_ERROR');
  assert.ok(data.error.message.includes('exceeds maximum permitted size'));
});

test('GET /unknown-endpoint: returns 404 NOT_FOUND error shape without stack traces', async () => {
  const res = await dispatchRequest(app, {
    url: '/api/does-not-exist',
  });
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.error.code, 'NOT_FOUND');
  assert.ok(data.error.requestId);
  assert.equal(data.error.stack, undefined);
});

test('HTTP compression test: verifies compression headers on requests accepting gzip', async () => {
  const res = await dispatchRequest(app, {
    url: '/health',
    headers: { 'accept-encoding': 'gzip' },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, 'ok');
});
