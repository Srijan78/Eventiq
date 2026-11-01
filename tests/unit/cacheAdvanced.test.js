import test from 'node:test';
import assert from 'node:assert/strict';
import { LruCache, buildCacheKey } from '../../src/utils/cache.js';

test('Cache: Key invariance across property order and extraneous spacing', () => {
  const req1 = {
    eventType: 'wedding',
    guests: 100,
    budget: 250000,
    city: 'Hyderabad',
    costLevel: 'average',
    wedding: { functions: ['reception', 'sangeet'], indoor: true },
  };

  // Same data, reversed property order
  const req2 = {
    wedding: { indoor: true, functions: ['reception', 'sangeet'] },
    costLevel: 'average',
    city: 'Hyderabad',
    budget: 250000,
    guests: 100,
    eventType: 'wedding',
  };

  const key1 = buildCacheKey(req1, 'test-model', '2026-11-01');
  const key2 = buildCacheKey(req2, 'test-model', '2026-11-01');

  assert.equal(key1, key2, 'Canonical hashing must be invariant to object key ordering');
});

test('Cache: Key change when input fields vary', () => {
  const baseReq = { eventType: 'wedding', guests: 100, budget: 250000 };
  const key1 = buildCacheKey(baseReq, 'test-model', '2026-11-01');
  const key2 = buildCacheKey({ ...baseReq, guests: 101 }, 'test-model', '2026-11-01');
  const key3 = buildCacheKey({ ...baseReq, budget: 250001 }, 'test-model', '2026-11-01');
  const keyDate = buildCacheKey(baseReq, 'test-model', '2026-11-02');

  assert.notEqual(key1, key2);
  assert.notEqual(key1, key3);
  assert.notEqual(key1, keyDate);
});

test('Cache: TTL expiration evicts expired items', async () => {
  // Cache with 50ms TTL (0.05 seconds)
  const shortCache = new LruCache(10, 0.05);
  shortCache.set('k1', { data: 'test-value' });

  assert.deepEqual(shortCache.get('k1'), { data: 'test-value' });

  // Wait 70ms for TTL to expire
  await new Promise((resolve) => setTimeout(resolve, 70));

  assert.equal(shortCache.get('k1'), null, 'Expired cache entry must return null and be pruned');
  assert.equal(shortCache.size, 0);
});

test('Cache: LRU eviction discards least recently used item at capacity', () => {
  const lru = new LruCache(3, 3600);
  lru.set('a', 1);
  lru.set('b', 2);
  lru.set('c', 3);

  assert.equal(lru.size, 3);

  // Read 'a' to make it most recently used (order now: b, c, a)
  assert.equal(lru.get('a'), 1);

  // Insert 'd' (must evict 'b', because 'b' is now least recently used)
  lru.set('d', 4);

  assert.equal(lru.get('b'), null, 'Oldest item "b" must have been evicted');
  assert.equal(lru.get('a'), 1);
  assert.equal(lru.get('c'), 3);
  assert.equal(lru.get('d'), 4);
  assert.equal(lru.size, 3);
});
