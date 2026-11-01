import test from 'node:test';
import assert from 'node:assert/strict';
import { envSchema } from '../../src/config/env.js';

test('Config: TRUST_PROXY accepts numeric string and parses as integer', () => {
  const result = envSchema.safeParse({ TRUST_PROXY: '1' });
  assert.equal(result.success, true);
  assert.equal(result.data.TRUST_PROXY, 1);

  const resultZero = envSchema.safeParse({ TRUST_PROXY: '0' });
  assert.equal(resultZero.success, true);
  assert.equal(resultZero.data.TRUST_PROXY, 0);

  const resultMulti = envSchema.safeParse({ TRUST_PROXY: '3' });
  assert.equal(resultMulti.success, true);
  assert.equal(resultMulti.data.TRUST_PROXY, 3);
});

test('Config: TRUST_PROXY rejects non-numeric strings', () => {
  const result = envSchema.safeParse({ TRUST_PROXY: 'abc' });
  assert.equal(result.success, false);
});

test('Config: PORT validation handles valid ports and rejects negative or non-numeric values', () => {
  const valid = envSchema.safeParse({ PORT: '8080' });
  assert.equal(valid.success, true);
  assert.equal(valid.data.PORT, 8080);

  const negative = envSchema.safeParse({ PORT: '-1' });
  assert.equal(negative.success, false);

  const nonNum = envSchema.safeParse({ PORT: 'not-a-port' });
  assert.equal(nonNum.success, false);
});

test('Config: GEMINI_API_KEY is completely optional and defaults to empty string', () => {
  const result = envSchema.safeParse({});
  assert.equal(result.success, true);
  assert.equal(result.data.GEMINI_API_KEY, '');
  assert.equal(result.data.PORT, 3000);
  assert.equal(result.data.TRUST_PROXY, 0);
});
