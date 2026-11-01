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
  assert.equal(result.data.NODE_ENV, 'development');
  assert.equal(result.data.LOG_LEVEL, 'info');
});

test('Config: NODE_ENV accepts valid environments and rejects invalid values', () => {
  assert.equal(envSchema.safeParse({ NODE_ENV: 'production' }).success, true);
  assert.equal(envSchema.safeParse({ NODE_ENV: 'test' }).success, true);
  assert.equal(envSchema.safeParse({ NODE_ENV: 'development' }).success, true);
  assert.equal(envSchema.safeParse({ NODE_ENV: 'staging' }).success, false);
});

test('Config: LOG_LEVEL accepts valid log levels and rejects unknown levels', () => {
  assert.equal(envSchema.safeParse({ LOG_LEVEL: 'debug' }).success, true);
  assert.equal(envSchema.safeParse({ LOG_LEVEL: 'silent' }).success, true);
  assert.equal(envSchema.safeParse({ LOG_LEVEL: 'verbose' }).success, false);
});

test('Config: CACHE and RATE_LIMIT numerical branches enforce positive integers', () => {
  const valid = envSchema.safeParse({
    CACHE_TTL_SECONDS: '120',
    CACHE_MAX_ENTRIES: '500',
    RATE_LIMIT_PER_MIN: '100',
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.CACHE_TTL_SECONDS, 120);
  assert.equal(valid.data.CACHE_MAX_ENTRIES, 500);
  assert.equal(valid.data.RATE_LIMIT_PER_MIN, 100);

  assert.equal(envSchema.safeParse({ CACHE_TTL_SECONDS: '-10' }).success, false);
  assert.equal(envSchema.safeParse({ CACHE_MAX_ENTRIES: '0' }).success, false);
  assert.equal(envSchema.safeParse({ RATE_LIMIT_PER_MIN: 'abc' }).success, false);
});

test('Config: Formatter accurately formats error issues when safeParse fails', () => {
  const parsed = envSchema.safeParse({ PORT: 'bad', LOG_LEVEL: 'invalid' });
  assert.equal(parsed.success, false);
  if (!parsed.success) {
    const formatted = parsed.error.issues
      .map((issue) => ` - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    assert.ok(formatted.includes('PORT'));
    assert.ok(formatted.includes('LOG_LEVEL'));
  }
});
