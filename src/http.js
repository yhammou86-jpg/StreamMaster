'use strict';

/**
 * Tiny fetch wrapper: hard timeouts, browser-ish headers, never throws.
 *
 * Public trackers are hostile to datacenter IPs, so every call must be able to
 * fail fast without taking down the whole request — and when it fails, it has
 * to say *why*. "HTTP 403" is three different problems wearing the same coat:
 *
 *   cloudflare  the site fingerprints TLS and rejects non-browser clients.
 *               Headers and IP are irrelevant; no amount of UA spoofing helps.
 *               Only a proxy, FlareSolverr, or Prowlarr can fix this.
 *   blocked     a plain 403 with no bot-check markers: IP or region ban.
 *   rate-limit  429, or a 403 with Retry-After. Backing off fixes it.
 *   parse       we got HTML where JSON was expected — usually a challenge page
 *               or a dead endpoint returning a landing page.
 *
 * Redirects are deliberately *not* a failure reason: fetch follows them, so a
 * moved domain shows up as a successful response from a different host. That is
 * how a rename gets misdiagnosed as a block, so a cross-host redirect is
 * surfaced as `note` on the successful response instead.
 *
 * Knowing which one you have is the difference between a five-minute fix and
 * an afternoon of guessing.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const DEFAULT_HEADERS = {
  'user-agent': UA,
  accept: 'application/json, text/plain, */*',
  'accept-language': 'en-US,en;q=0.9',
};

/**
 * Route a URL through a user-supplied proxy.
 * Accepts either a prefix ("https://worker.dev/?url=") or a template
 * ("https://worker.dev/fetch/{url}").
 */
function applyProxy(url, proxy) {
  if (!proxy) return url;
  if (proxy.includes('{url}')) return proxy.replace('{url}', encodeURIComponent(url));
  return proxy + encodeURIComponent(url);
}

const CF_BODY = /just a moment|cf_chl|challenge-platform|cf-browser-verification|enable javascript and cookies/i;

/** Turn a response into a machine-readable failure reason plus a human hint. */
function classify(res, url) {
  const status = res.status;
  const headers = res.headers || {};
  const body = res.text || '';
  const cfMitigated = headers['cf-mitigated'];
  const server = headers.server || '';

  // If the request was bounced to another host, the failure belongs to the new
  // host, not the one the provider asked for. Without this, a renamed domain
  // gets reported as "the old domain is blocked", which sends you fixing the
  // wrong thing.
  let via = '';
  try {
    const from = new URL(res.requested || url).host;
    const to = new URL(res.url).host;
    // A proxied request legitimately ends on the proxy's host — that is not a move.
    if (from && to && from !== to && !res.proxied) via = ` (after redirecting to ${to})`;
  } catch {
    /* unparseable URL: skip the annotation */
  }

  if (status === 0) {
    return {
      reason: 'network',
      hint: `Could not connect (${res.error || 'network error'}). The host may be down, blocked by your network, or the DNS entry is gone.`,
    };
  }

  if (status === 429) {
    return {
      reason: 'rate-limit',
      hint: `Rate limited${headers['retry-after'] ? ` (retry after ${headers['retry-after']}s)` : ''}. This source works but asks for fewer requests.`,
    };
  }

  if (cfMitigated === 'challenge' || (server === 'cloudflare' && CF_BODY.test(body))) {
    return {
      reason: 'cloudflare',
      hint: `Cloudflare bot check${via} — TLS fingerprint, not headers. Needs a proxy, FlareSolverr, or Prowlarr.`,
    };
  }

  if (status === 403 || status === 401) {
    return {
      reason: 'blocked',
      hint: `Access denied${via} without a bot check — usually an IP or region ban, or the source now requires a key.`,
    };
  }

  if (status === 404) {
    return {
      reason: 'missing',
      hint: `Endpoint not found${via}. The source likely changed its API or domain.`,
    };
  }

  if (status >= 500) {
    return { reason: 'server', hint: `Upstream error (${status})${via}. Usually temporary.` };
  }

  if (!res.ok) {
    return { reason: 'http', hint: `Unexpected HTTP ${status}${via}.` };
  }

  return { reason: 'ok', hint: '' };
}

async function request(url, opts = {}) {
  const { timeout = 6000, method = 'GET', headers = {}, body, signal, proxy } = opts;
  const target = applyProxy(url, proxy);

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  const relay = () => ctrl.abort();
  if (signal) {
    if (signal.aborted) relay();
    else signal.addEventListener('abort', relay, { once: true });
  }

  try {
    const res = await fetch(target, {
      method,
      headers: { ...DEFAULT_HEADERS, ...headers },
      body,
      signal: ctrl.signal,
      redirect: 'follow',
    });
    const text = await res.text();

    const flat = {};
    res.headers.forEach((v, k) => {
      flat[k.toLowerCase()] = v;
    });

    const out = {
      ok: res.ok,
      status: res.status,
      text,
      headers: flat,
      url: res.url || target,
      requested: url,
      proxied: !!proxy,
      redirected: !!(res.url && res.url !== target && res.url !== url),
    };

    if (!res.ok) {
      const c = classify(out, url);
      out.reason = c.reason;
      out.hint = c.hint;
    } else {
      out.reason = 'ok';
    }

    return out;
  } catch (err) {
    const aborted = err && err.name === 'AbortError';
    return {
      ok: false,
      status: 0,
      text: '',
      headers: {},
      url: target,
      requested: url,
      error: aborted ? 'timeout' : String(err && err.message),
      reason: aborted ? 'timeout' : 'network',
      hint: aborted
        ? `No response within ${timeout}ms. The source is slow or unreachable from here.`
        : `Network error: ${err && err.message}`,
    };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', relay);
  }
}

/** Parse JSON, attaching the classified reason when the body is not JSON. */
async function json(url, opts = {}) {
  const res = await request(url, opts);
  if (!res.ok) {
    const err = new Error(`${res.reason || 'http'} ${res.status} ${url}`);
    err.reason = res.reason;
    err.hint = res.hint;
    err.status = res.status;
    throw err;
  }
  try {
    return JSON.parse(res.text);
  } catch {
    const err = new Error(`Invalid JSON from ${url}`);
    err.reason = 'parse';
    err.hint = 'Got a non-JSON body. Usually a challenge page or a landing page instead of an API.';
    throw err;
  }
}

/**
 * Rank failure reasons by how much they tell you.
 *
 * When several mirrors are tried, the *last* error is rarely the useful one: a
 * definitive "Cloudflare challenge" from mirror one gets overwritten by a
 * timeout from mirror three, and the UI then advises you to retry instead of
 * configure a proxy. Report the most specific diagnosis instead.
 */
const REASON_RANK = {
  cloudflare: 9,
  blocked: 8,
  'rate-limit': 7,
  missing: 6,
  server: 5,
  parse: 4,
  http: 3,
  timeout: 2,
  network: 1,
};

function mostInformative(errors) {
  const list = (errors || []).filter(Boolean);
  if (!list.length) return null;
  return list.reduce((best, err) =>
    (REASON_RANK[err.reason] || 0) > (REASON_RANK[best.reason] || 0) ? err : best
  );
}

function withTimeout(promise, ms, label = 'task') {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => {
        const err = new Error(`${label} timed out`);
        err.reason = 'timeout';
        reject(err);
      }, ms);
    }),
  ]);
}

module.exports = { request, json, withTimeout, classify, applyProxy, mostInformative, UA };
