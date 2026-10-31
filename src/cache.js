'use strict';

/**
 * Per-instance LRU + single-flight cache.
 *
 * Vercel lambdas stay warm for minutes at a time, so an in-memory cache catches
 * the vast majority of repeat traffic (people re-opening the same episode, or
 * Stremio's own double-request on open). No external KV needed = stays free.
 */

const MAX_ENTRIES = 900;
const store = new Map();
const inflight = new Map();

function get(key) {
  const hit = store.get(key);
  if (!hit) return undefined;
  if (hit.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  // Refresh recency
  store.delete(key);
  store.set(key, hit);
  return hit.value;
}

function set(key, value, ttlMs = 60000) {
  if (store.size >= MAX_ENTRIES) {
    const oldest = store.keys().next().value;
    if (oldest !== undefined) store.delete(oldest);
  }
  store.set(key, { value, expires: Date.now() + ttlMs });
}

/**
 * Coalesce concurrent identical lookups into one upstream request.
 * A rejected promise is never cached.
 */
async function memo(key, ttlMs, fn) {
  const cached = get(key);
  if (cached !== undefined) return cached;

  const running = inflight.get(key);
  if (running) return running;

  const task = (async () => {
    try {
      const value = await fn();
      set(key, value, ttlMs);
      return value;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, task);
  return task;
}

module.exports = { get, set, memo, size: () => store.size };
