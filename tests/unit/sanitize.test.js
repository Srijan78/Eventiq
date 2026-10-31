import test from 'node:test';
import assert from 'node:assert/strict';
import { sanitize, sanitizeRequest } from '../../src/utils/sanitize.js';

test('sanitize: strips non-printable control characters and collapses whitespace', () => {
  const dirty = 'Hello \x00\x08World\x1F!   Multiple    spaces\nand tabs\t.';
  const cleaned = sanitize(dirty);
  assert.equal(cleaned, 'Hello World! Multiple spaces and tabs .');
});

test('sanitize: truncates string exceeding max length', () => {
  const longText = 'a'.repeat(200);
  const truncated = sanitize(longText, 50);
  assert.equal(truncated.length, 50);
});

test('sanitizeRequest: sanitizes city, notes, theme, eventName, and dietary', () => {
  const rawReq = {
    eventType: 'wedding',
    city: '  Bengaluru \x00 ',
    theme: ' Royal\x07 Heritage ',
    notes: '   Need vegetarian\x1B food.  ',
    eventName: ' Grand\tWedding ',
    wedding: {
      functions: ['wedding'],
      indoor: true,
      dietary: '  Jain \x00 no onion ',
    },
  };

  const cleaned = sanitizeRequest(rawReq);
  assert.equal(cleaned.city, 'Bengaluru');
  assert.equal(cleaned.theme, 'Royal Heritage');
  assert.equal(cleaned.notes, 'Need vegetarian food.');
  assert.equal(cleaned.eventName, 'Grand Wedding');
  assert.equal(cleaned.wedding.dietary, 'Jain no onion');
});
