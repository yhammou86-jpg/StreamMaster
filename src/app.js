'use strict';

/**
 * Framework-free request handling.
 *
 * The same functions back both the Vercel functions in /api and the local dev
 * server in /scripts, so there is exactly one implementation of every route.
 */

const { normalize, FALLBACK } = require('./config');
const { encode, decode } = require('./codec');
const { resolveMeta } = require('./metadata');
const { gather } = require('./orchestrator');
const { buildStreams } = require('./format');
const { CACHED_BONUS, scoreItem } = require('./rank');
const { ALL } = require('./providers');
const torbox = require('./torbox');
const cache = require('./cache');
const { magnet } = require('./trackers');

const VERSION = '1.0.0';
const ADDON_ID = 'community.hydrastream';

function baseUrl(headers) {
  const h = headers || {};
  const proto = h['x-forwarded-proto'] || (String(h.host || '').includes('localhost') ? 'http' : 'https');
  const host = h['x-forwarded-host'] || h.host || 'localhost:7000';
  return `${proto}://${host}`;
}

function jsonResponse(body, status = 200, extraHeaders = {}) {
  return {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'access-control-allow-origin': '*',
      'cache-control': 'public, max-age=300, stale-while-revalidate=600',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  };
}

/* ------------------------------------------------------------------ manifest */

function buildManifest(cfg, base) {
  const modeLabel = !cfg.tb ? 'P2P' : cfg.mode === 'debrid' ? 'TorBox' : 'TorBox + P2P';
  return {
    id: ADDON_ID,
    version: VERSION,
    name: 'Hydra',
    description:
      `One addon, every source. ${modeLabel}. ` +
      'Aggregates public trackers, checks TorBox cache in a single batch call, ' +
      'and falls back to native P2P so there is always something to play.',
    logo: `${base}/logo.svg`,
    background: `${base}/logo.svg`,
    resources: ['stream'],
    types: ['movie', 'series'],
    idPrefixes: ['tt'],
    catalogs: [],
    behaviorHints: { configurable: true },
  };
}

function handleManifest(query, headers) {
  const cfg = query && query.c ? normalize(decode(query.c)) : FALLBACK;
  const base = baseUrl(headers);
  return jsonResponse(buildManifest(cfg, base), 200, { 'cache-control': 'public, max-age=3600' });
}

/* -------------------------------------------------------------------- stream */

function stripJson(id) {
  return String(id || '').replace(/\.json$/i, '');
}

async function handleStream(query, headers) {
  const type = query.type === 'series' ? 'series' : 'movie';
  const rawId = stripJson(query.id);
  const cfg = normalize(decode(query.c));
  const base = baseUrl(headers);

  if (!rawId || !/^tt\d+/.test(rawId)) {
    return jsonResponse({ streams: [] });
  }

  const meta = await resolveMeta(type, rawId);

  const { items, stats } = await gather(cfg, meta, {
    budget: cfg.providers.prowlarr ? 8000 : 6500,
  });

  let working = items;

  // --- TorBox batch cache probe (one request for every hash) --------------
  if (cfg.tb && cfg.mode !== 'p2p' && working.length) {
    try {
      const cached = await torbox.checkCached(
        working.map((i) => i.infoHash),
        cfg.tb
      );
      for (const item of working) {
        if (cached.has(item.infoHash)) item.cached = true;
        else if (cfg.tbUncached) item.via = 'torbox';
      }

      // Re-score: cached results no longer care about swarm size.
      for (const item of working) {
        item.score = scoreItem(item, cfg) + (item.cached ? CACHED_BONUS : 0);
      }
      working.sort((a, b) => b.score - a.score);

      // Mode semantics, applied only once cache state is known:
      //   debrid     -> TorBox must be able to serve it
      //   cachedOnly -> strictly what is already on TorBox's disk
      if (cfg.mode === 'debrid') {
        working = working.filter((i) => i.cached || i.via === 'torbox');
      }
      if (cfg.cachedOnly) {
        working = working.filter((i) => i.cached);
      }
    } catch (err) {
      // Bad key or TorBox outage: never fail the request, degrade to P2P.
      if (cfg.mode === 'debrid') {
        for (const item of working) item.via = 'torbox';
      }
      stats.torboxError = String(err.message || err);
    }
  } else if (cfg.mode === 'p2p' || !cfg.tb) {
    // Explicitly P2P-only: strip any debrid affordance.
    working = working.map((i) => ({ ...i, cached: false, via: undefined }));
  }

  const hint =
    meta.kind === 'series' && meta.season != null
      ? `s${String(meta.season).padStart(2, '0')}e${String(meta.episode).padStart(2, '0')}`
      : '';

  const streams = buildStreams(working, cfg, {
    base,
    blob: query.c || encode(cfg),
    hint,
    limit: cfg.max,
  });

  return jsonResponse({ streams }, 200, {
    'cache-control': 'public, max-age=60, stale-while-revalidate=300',
    'x-hydra-stats': JSON.stringify({
      found: working.length,
      shown: streams.length,
      providers: stats.perProvider,
      ms: stats.ms,
    }),
  });
}

/* ------------------------------------------------------------------- resolve */

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function handleResolve(query) {
  const cfg = normalize(decode(query.c));
  const hash = String(query.h || '').toLowerCase();

  if (!cfg.tb) {
    return { status: 400, headers: { 'content-type': 'text/plain' }, body: 'No TorBox API key in config.' };
  }
  if (!/^[a-f0-9]{40}$/.test(hash)) {
    return { status: 400, headers: { 'content-type': 'text/plain' }, body: 'Invalid infohash.' };
  }

  const hint = query.f || '';
  const allowUncached = query.u === '1' || cfg.tbUncached;
  const cacheKey = `tb:${hash}:${cfg.tb.slice(-10)}`;

  try {
    let rec = cache.get(cacheKey);

    if (!rec) {
      const created = await torbox.createTorrent(cfg.tb, magnet(hash, hint || 'video'), {
        cachedOnly: !allowUncached,
      });

      // Cached torrents are ready almost immediately; uncached ones need a
      // short wait before files exist. Poll briefly, then give up honestly.
      let torrent = null;
      const deadline = Date.now() + (allowUncached ? 9000 : 3500);
      while (Date.now() < deadline) {
        torrent = await torbox.getTorrent(cfg.tb, created.id);
        if (torrent && Array.isArray(torrent.files) && torrent.files.length) break;
        await sleep(600);
      }

      const file = torrent && torbox.pickFile(torrent.files, hint);
      if (!file) {
        return {
          status: 503,
          headers: { 'content-type': 'text/plain' },
          body: 'TorBox is still preparing this file. Try again in a few seconds.',
        };
      }
      rec = { id: created.id, fileId: file.id, name: file.name };
      cache.set(cacheKey, rec, 45 * 60 * 1000);
    }

    const url = await torbox.requestDownload(cfg.tb, rec.id, rec.fileId);
    return { status: 302, headers: { location: url, 'cache-control': 'no-store' }, body: '' };
  } catch (err) {
    const code = err && err.code ? ` (${err.code})` : '';
    return {
      status: 502,
      headers: { 'content-type': 'text/plain' },
      body: `TorBox error${code}: ${err.message || 'unknown'}`,
    };
  }
}

/* -------------------------------------------------------------------- config */

async function handleConfig({ query, body }) {
  // GET ?c=... -> hydrate the configure page from an existing install URL
  if (query && query.c) {
    const cfg = decode(query.c);
    if (!cfg) return jsonResponse({ ok: false, error: 'Could not decode config' }, 400);
    const safe = { ...normalize(cfg), tb: cfg.tb ? '***' : '' };
    return jsonResponse({ ok: true, config: safe });
  }

  if (!body || typeof body !== 'object') {
    return jsonResponse({ ok: false, error: 'Expected JSON body' }, 400);
  }

  if (body.action === 'verify') {
    const key = String(body.key || '').trim();
    if (!key) return jsonResponse({ ok: false, error: 'Missing API key' }, 400);
    try {
      const info = await torbox.userInfo(key);
      return jsonResponse({
        ok: true,
        user: {
          email: info && info.email,
          plan: info && (info.plan ?? info.plan_id),
          premium: !!(info && (info.premium_expires_at || info.is_subscribed)),
          expires: info && (info.premium_expires_at || info.expires_at),
          cooldown: info && info.cooldown_until,
        },
      });
    } catch (err) {
      return jsonResponse({ ok: false, error: err.message || 'Invalid key' }, 200);
    }
  }

  if (body.action === 'encode') {
    const cfg = normalize(body.config);
    return jsonResponse({ ok: true, blob: encode(cfg) });
  }

  return jsonResponse({ ok: false, error: 'Unknown action' }, 400);
}

/* -------------------------------------------------------------------- health */

function handleHealth() {
  return jsonResponse({
    ok: true,
    name: 'Hydra',
    version: VERSION,
    providers: ALL.map((p) => ({ id: p.id, name: p.name, kinds: p.kinds })),
    cacheEntries: cache.size(),
    encryptedConfig: !!process.env.CONFIG_SECRET,
    uptime: Math.round(process.uptime()),
  });
}

module.exports = {
  VERSION,
  ADDON_ID,
  baseUrl,
  jsonResponse,
  handleManifest,
  handleStream,
  handleResolve,
  handleConfig,
  handleHealth,
  buildManifest,
};
