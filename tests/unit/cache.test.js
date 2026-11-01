import test from 'node:test';
import assert from 'node:assert/strict';
import { LruCache, buildCacheKey } from '../../src/utils/cache.js';

test('LruCache: basic set, get, and eviction', () => {
  const cache = new LruCache(3, 3600);
  assert.equal(cache.size, 0);

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert.equal(cache.size, 3);
  assert.equal(cache.get('a'), 1);

  // Accessing 'a' makes 'b' the oldest. Adding 'd' should evict 'b'.
  cache.set('d', 4);
  assert.equal(cache.size, 3);
  assert.equal(cache.get('b'), null, 'Key b should have been evicted');
  assert.equal(cache.get('a'), 1);
  assert.equal(cache.get('c'), 3);
  assert.equal(cache.get('d'), 4);
});

test('LruCache: expires items after TTL', async () => {
  const cache = new LruCache(10, 0.05); // 50ms TTL
  cache.set('k1', 'val1');
  assert.equal(cache.get('k1'), 'val1');

  await new Promise((resolve) => setTimeout(resolve, 70));
  assert.equal(cache.get('k1'), null, 'Key should have expired');
});

test('buildCacheKey: produces deterministic SHA-256 independent of key order and casing', () => {
  const req1 = {
    eventType: 'wedding',
    eventDate: '2027-05-15',
    guests: 150,
    budget: 500000,
    city: 'Mumbai',
    costLevel: 'high',
    theme: 'Pastel Garden',
    wedding: { functions: ['wedding', 'reception'], dietary: 'vegetarian' },
  };

  const req2 = {
    theme: 'pastel garden',
    costLevel: 'high',
    budget: 500000,
    guests: 150,
    city: 'mumbai   ',
    eventDate: '2027-05-15',
    eventType: 'wedding',
    wedding: { dietary: 'vegetarian', functions: ['reception', 'wedding'] },
  };

  const key1 = buildCacheKey(req1, 'gemini-3.5-flash-lite', '2026-11-01');
  const key2 = buildCacheKey(req2, 'gemini-3.5-flash-lite', '2026-11-01');

  assert.equal(key1, key2, 'Normalized cache keys must be strictly identical');
});

test('buildCacheKey: differs when today date or inputs change', () => {
  const req = {
    eventType: 'birthday',
    eventDate: '2027-01-10',
    guests: 20,
    budget: 25000,
  };

  const keyDay1 = buildCacheKey(req, 'gemini-3.5-flash-lite', '2026-11-01');
  const keyDay2 = buildCacheKey(req, 'gemini-3.5-flash-lite', '2026-11-02');
  assert.notEqual(keyDay1, keyDay2, 'Cache keys must differ across dates due to weeksToEvent');
});
