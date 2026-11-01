/**
 * HydraStream fetch proxy — a Cloudflare Worker.
 *
 * WHY THIS EXISTS
 * ---------------
 * Some trackers (notably apibay.org, which serves The Pirate Bay) reject
 * server-side clients by fingerprinting the TLS handshake (JA3/JA4). The
 * response is decided before a single HTTP header is read, so no User-Agent,
 * Referer or cipher tweak can change it. `curl` gets 200 and Node's fetch gets
 * 403 against the identical URL from the identical IP — that is the signature.
 *
 * The only fix is to make the request from somewhere else. This Worker does
 * exactly that: the addon calls the Worker, the Worker calls the tracker from
 * Cloudflare's network, and the tracker sees a request it is willing to serve.
 *
 * No server to run, no Prowlarr to host, no card required — the Workers free
 * plan covers 100,000 requests a day, and a Stremio stream request is one.
 *
 * DEPLOY
 * ------
 * Dashboard (no tooling at all):
 *   1. dash.cloudflare.com -> Workers & Pages -> Create -> Worker
 *   2. Paste this file over the starter code, Deploy
 *   3. Copy the URL: https://<name>.<subdomain>.workers.dev
 *   4. Open <url>/__check to confirm it can actually reach the trackers
 *   5. Paste that URL into step 2 of /configure as the proxy
 *
 * CLI:
 *   npx wrangler deploy
 *
 * URL SHAPES ACCEPTED (all three, so any proxy setting works)
 *   https://<worker>/?url=https%3A%2F%2Fapibay.org%2Fq.php%3Fq%3Ddune
 *   https://<worker>/f/https%3A%2F%2Fapibay.org%2Fq.php%3Fq%3Ddune
 *   https://<worker>/https%3A%2F%2Fapibay.org%2Fq.php%3Fq%3Ddune
 */

/**
 * Hosts this Worker will fetch. An open proxy is an abuse vector and an SSRF
 * risk, so the target is checked against this list — not merely "any URL".
 * Add your own with a comma-separated ALLOW_HOSTS environment variable.
 */
const DEFAULT_ALLOW_HOSTS = [
  'apibay.org',
  'apibay.net',
  'thepiratebay.org',
  'bitsearch.eu',
  'bitsearch.to',
  '1337x.to',
  'nyaa.si',
  'eztv.re',
  'eztvx.to',
  'yts.mx',
  'yts.lt',
  'knaben.org',
  'knaben.eu',
  'animetosho.org',
  'therarbg.to',
  'torrentgalaxy.to',
  'limetorrents.lol',
];

/** Only these are allowed to be reached, so private ranges are unreachable by construction. */
function allowList(env) {
  const extra = String((env && env.ALLOW_HOSTS) || '')
    .split(',')
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return extra.length ? extra : DEFAULT_ALLOW_HOSTS;
}

/**
 * Exact host or a subdomain of an allowed host.
 *
 * Deliberately not `endsWith(host)`: that would let `evil-apibay.org` pass.
 * The dot boundary is what makes this safe.
 */
function isAllowed(hostname, list) {
  const host = String(hostname || '').toLowerCase();
  if (!host) return false;
  return list.some((allowed) => host === allowed || host.endsWith('.' + allowed));
}

/**
 * Pull the target URL out of whichever shape was used.
 * Returns null when the request is not a proxy request at all.
 */
function extractTarget(requestUrl) {
  const u = new URL(requestUrl);

  const direct = u.searchParams.get('url');
  if (direct) return direct;

  let rest = u.pathname.replace(/^\/+/, '');
  if (!rest) return null;

  rest = rest.replace(/^(?:f|fetch|proxy)\//, '');

  try {
    rest = decodeURIComponent(rest);
  } catch {
    /* already decoded — use as-is */
  }

  return /^https?:\/\//i.test(rest) ? rest : null;
}

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-methods': 'GET,HEAD,OPTIONS',
  'access-control-allow-headers': '*',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...CORS },
  });
}

/** Fetch upstream with a hard timeout and browser-like headers. */
async function fetchUpstream(target, env, init = {}) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), Number((env && env.TIMEOUT_MS) || 9000));
  try {
    const headers = {
      'user-agent': UA,
      accept: 'application/json, text/plain, */*',
      'accept-language': 'en-US,en;q=0.9',
    };
    // Some sources (Knaben) search via POST, so the content type has to survive.
    if (init.contentType) headers['content-type'] = init.contentType;

    return await fetch(target, {
      method: init.method || 'GET',
      headers,
      body: init.body,
      redirect: 'follow',
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

/** Small GET responses are cached at the edge — public trackers rate limit. */
const CACHE_TTL = 300;

async function cachedResponse(request, key) {
  if (typeof caches === 'undefined') return null;
  try {
    const hit = await caches.default.match(key);
    if (hit) return hit;
  } catch {
    /* no cache in this runtime */
  }
  return null;
}

/**
 * Self-test: prove from the Worker itself that it can reach the trackers.
 * This is the whole point of the proxy, so it should be verifiable in one click
 * rather than discovered later as an empty stream list.
 *
 * Each target mirrors how the addon actually queries that source, including the
 * POST ones — a GET-only check would report Knaben healthy while every real
 * Knaben search failed.
 */
const CHECK_TARGETS = [
  { name: 'TPB (apibay)', url: 'https://apibay.org/q.php?q=dune&cat=0', expect: '[' },
  { name: 'BitSearch', url: 'https://bitsearch.eu/api/v1/search?q=dune&category=1', expect: '{' },
  {
    name: 'Knaben',
    url: 'https://api.knaben.org/v1',
    method: 'POST',
    contentType: 'application/json',
    body: JSON.stringify({ search_type: '100%', search_field: 'title', query: 'dune', from: 0, size: 5 }),
    expect: '{',
  },
  { name: 'YTS', url: 'https://yts.mx/api/v2/list_movies.json?query_term=dune', expect: '{' },
];

async function runChecks(env) {
  const results = await Promise.all(
    CHECK_TARGETS.map(async (t) => {
      const started = Date.now();
      try {
        const res = await fetchUpstream(t.url, env, {
          method: t.method,
          body: t.body,
          contentType: t.contentType,
        });
        const body = await res.text();
        const looksRight = body.trim().startsWith(t.expect);
        return {
          name: t.name,
          status: res.status,
          ms: Date.now() - started,
          bytes: body.length,
          ok: res.ok && looksRight,
          preview: body.slice(0, 90).replace(/\s+/g, ' '),
        };
      } catch (err) {
        return {
          name: t.name,
          status: 0,
          ms: Date.now() - started,
          ok: false,
          error: String((err && err.message) || err),
        };
      }
    })
  );

  const working = results.filter((r) => r.ok).length;
  return {
    ok: working > 0,
    proxy: 'cloudflare-worker',
    working,
    total: results.length,
    note:
      working > 0
        ? 'The Worker can reach these trackers. Paste its URL into /configure as the proxy.'
        : 'Nothing reachable. Check ALLOW_HOSTS, or the upstreams are down.',
    results,
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    // Root doubles as a landing page so a stray visit explains itself.
    if (url.pathname === '/' && !url.searchParams.get('url')) {
      return json({
        service: 'hydrastream-proxy',
        ok: true,
        usage: `${url.origin}/?url=<encoded-target>`,
        selfTest: `${url.origin}/__check`,
      });
    }

    if (url.pathname === '/__check' || url.pathname === '/health') {
      return json(await runChecks(env));
    }

    const target = extractTarget(request.url);
    if (!target) {
      return json({ ok: false, error: 'No target URL. Use /?url=<encoded-url>.' }, 400);
    }

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return json({ ok: false, error: `Not a valid URL: ${target}` }, 400);
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return json({ ok: false, error: 'Only http and https targets are allowed.' }, 400);
    }

    const allow = allowList(env);
    if (!isAllowed(parsed.hostname, allow)) {
      return json(
        {
          ok: false,
          error: `Host not allowed: ${parsed.hostname}`,
          hint: 'Add it to the ALLOW_HOSTS environment variable if you trust it.',
          allowed: allow,
        },
        403
      );
    }

    // GET is cacheable; a POST search is not, and must not be served a stale body.
    const isGet = request.method === 'GET' || request.method === 'HEAD';
    const cacheKey = isGet ? new Request(parsed.toString(), { method: 'GET' }) : null;

    if (cacheKey) {
      const cached = await cachedResponse(request, cacheKey);
      if (cached) return cached;
    }

    // Knaben searches by POST, so the method and body have to be forwarded or
    // that source silently returns nothing through the proxy.
    const hasBody = !isGet;
    const body = hasBody ? await request.arrayBuffer() : undefined;
    const contentType = request.headers.get('content-type') || undefined;

    try {
      const upstream = await fetchUpstream(parsed.toString(), env, {
        method: request.method,
        body,
        contentType,
      });
      const out = await upstream.arrayBuffer();

      const headers = new Headers(CORS);
      headers.set('content-type', upstream.headers.get('content-type') || 'application/json; charset=utf-8');
      headers.set('x-proxy-target', parsed.hostname);
      headers.set('x-proxy-status', String(upstream.status));
      headers.set('cache-control', isGet ? `public, max-age=${CACHE_TTL}` : 'no-store');

      const response = new Response(out, { status: upstream.status, headers });

      if (cacheKey && upstream.ok && typeof caches !== 'undefined') {
        try {
          // Clone before caching: a body can only be consumed once.
          await caches.default.put(cacheKey, response.clone());
        } catch {
          /* caching is best-effort */
        }
      }

      return response;
    } catch (err) {
      const aborted = err && err.name === 'AbortError';
      return json(
        {
          ok: false,
          error: aborted ? 'Upstream timed out' : String((err && err.message) || err),
          target: parsed.hostname,
          hint: aborted
            ? 'The tracker is slow or unreachable from Cloudflare.'
            : 'The tracker refused the connection.',
        },
        502
      );
    }
  },
};

// Exported for the test suite.
export { extractTarget, isAllowed, allowList, DEFAULT_ALLOW_HOSTS };
