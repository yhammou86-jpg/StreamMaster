'use strict';

/**
 * Tiny fetch wrapper: hard timeouts, browser-ish headers, never throws.
 *
 * Public trackers are hostile to datacenter IPs, so every call must be able to
 * fail fast without taking down the whole request.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'user-agent': UA,
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
};

async function request(url, opts = {}) {
  const { timeout = 6000, method = 'GET', headers = {}, body, signal } = opts;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const relay = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) relay();
    else signal.addEventListener('abort', relay, { once: true });
  }

  try {
    const res = await fetch(url, {
      method,
      headers: { ...DEFAULT_HEADERS, ...headers },
      body,
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const text = await res.text();
    return { ok: res.ok, status: res.status, text, url: res.url };
  } catch (err) {
    return { ok: false, status: 0, text: '', error: err && err.name === 'AbortError' ? 'timeout' : String(err && err.message) };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', relay);
  }
}

async function json(url, opts = {}) {
  const res = await request(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  try {
    return JSON.parse(res.text);
  } catch {
    throw new Error(`Invalid JSON from ${url}`);
  }
}

function withTimeout(promise, ms, label = 'task') {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`${label} timed out`)), ms);
    }),
  ]);
}

module.exports = { request, json, withTimeout, UA };
