'use strict';

/**
 * The orchestrator: fan out, enforce a deadline, normalise, dedupe, rank.
 *
 * Design rule: this function must never reject. A stream request that returns
 * six good results from three working scrapers is a success; a 500 because one
 * tracker timed out is a bug. Everything is allSettled + per-provider timeout.
 */

const { ALL } = require('./providers');
const { parseRelease, matchesEpisode } = require('./parse');
const { scoreItem, passesFilters, sortItems } = require('./rank');
const { withTimeout } = require('./http');
const health = require('./health');

/** Overall budget for scraping. Vercel Hobby allows 60s; we stay far below. */
const DEFAULT_BUDGET_MS = 7000;

function normalizeOne(raw, ctx) {
  if (!raw || !raw.infoHash) return null;
  const hash = String(raw.infoHash).toLowerCase();
  if (!/^[a-f0-9]{40}$/.test(hash)) return null;

  const parsed = parseRelease(raw.title || '');

  // Episode hygiene: drop season packs and wrong episodes for series requests.
  if (ctx.kind === 'series' && ctx.season != null && ctx.episode != null) {
    if (!matchesEpisode(parsed, ctx.season, ctx.episode)) return null;
  }

  return {
    infoHash: hash,
    title: raw.title || '',
    size: Number(raw.size) || 0,
    seeders: Number(raw.seeders) || 0,
    provider: raw.provider || 'unknown',
    providerName: raw.providerName || raw.provider || 'unknown',
    parsed,
    cached: false,
    score: 0,
  };
}

function dedupe(items) {
  const map = new Map();
  for (const item of items) {
    const existing = map.get(item.infoHash);
    if (!existing) {
      map.set(item.infoHash, item);
      continue;
    }
    // Same infohash across trackers: keep the richer record.
    if (item.seeders > existing.seeders) existing.seeders = item.seeders;
    if (!existing.size && item.size) existing.size = item.size;
    if (item.title.length > existing.title.length) existing.title = item.title;
    if (!existing.providerName.split(', ').includes(item.providerName)) {
      existing.providerName += `, ${item.providerName}`;
    }
  }
  return [...map.values()];
}

/**
 * Run one provider, timing it and recording the outcome for diagnostics.
 */
async function runProvider(provider, ctx, deadline) {
  const started = Date.now();
  const remaining = Math.max(1200, deadline - started);
  try {
    const rows = await withTimeout(provider.search(ctx), remaining, provider.id);
    const list = Array.isArray(rows) ? rows : [];
    health.record(provider.id, { ok: true, ms: Date.now() - started, count: list.length });
    return { id: provider.id, rows: list };
  } catch (err) {
    health.record(provider.id, { ok: false, ms: Date.now() - started, error: err.message });
    return { id: provider.id, rows: [] };
  }
}

/**
 * @param {object} cfg normalised config
 * @param {object} meta output of resolveMeta
 * @param {{budget?:number}} [opts]
 */
async function gather(cfg, meta, opts = {}) {
  const budget = opts.budget || DEFAULT_BUDGET_MS;
  const started = Date.now();
  const deadline = started + budget;

  const active = ALL.filter((p) => cfg.providers[p.id] && p.kinds.includes(meta.kind));
  if (!active.length || !meta.title) return { items: [], stats: { providers: 0, raw: 0, ms: 0 } };

  const ctx = { ...meta, cfg };
  const settled = await Promise.allSettled(active.map((p) => runProvider(p, ctx, deadline)));

  const raw = [];
  const perProvider = {};

  for (const result of settled) {
    if (result.status !== 'fulfilled') continue;
    const { id, rows } = result.value;
    perProvider[id] = rows.length;
    for (const row of rows) {
      const item = normalizeOne(row, ctx);
      if (item) raw.push(item);
    }
  }

  let items = dedupe(raw);
  items = items.filter((item) => passesFilters(item, cfg));

  for (const item of items) item.score = scoreItem(item, cfg);
  items = sortItems(items, cfg);

  return {
    items,
    stats: {
      providers: active.length,
      raw: raw.length,
      unique: items.length,
      perProvider,
      ms: Date.now() - started,
    },
  };
}

/**
 * Diagnostics: run every enabled provider against a fixed, well-seeded title and
 * report what each one returned. Powers the "Test sources" panel.
 */
async function probe(cfg, meta) {
  const active = ALL.filter((p) => cfg.providers[p.id] && p.kinds.includes(meta.kind));
  const ctx = { ...meta, cfg };
  const deadline = Date.now() + 9000;

  const settled = await Promise.allSettled(active.map((p) => runProvider(p, ctx, deadline)));
  const out = [];

  for (let i = 0; i < active.length; i += 1) {
    const provider = active[i];
    const result = settled[i];
    const rows = result.status === 'fulfilled' ? result.value.rows : [];
    const stat = health.snapshot().find((s) => s.id === provider.id);
    out.push({
      id: provider.id,
      name: provider.name,
      count: rows.length,
      ok: rows.length > 0,
      avgMs: stat ? stat.avgMs : 0,
      successRate: stat ? stat.successRate : null,
      error: rows.length ? null : stat && stat.lastError ? stat.lastError : 'no results',
    });
  }

  return out.sort((a, b) => b.count - a.count);
}

/**
 * Diagnostics across both media kinds.
 *
 * A provider may only support movies or only series, so a single query would
 * leave half the list untested. Run one of each and merge by provider.
 */
async function probeAll(cfg) {
  const movie = {
    kind: 'movie',
    imdbId: 'tt1375666',
    title: 'Inception',
    year: 2010,
    season: null,
    episode: null,
    episodeTitle: '',
    genres: ['Action'],
  };
  const series = {
    kind: 'series',
    imdbId: 'tt0903747',
    title: 'Breaking Bad',
    year: 2008,
    season: 1,
    episode: 1,
    episodeTitle: 'Pilot',
    genres: ['Crime'],
  };

  const [a, b] = await Promise.all([probe(cfg, movie), probe(cfg, series)]);
  const merged = new Map();

  for (const row of [...a, ...b]) {
    const cur = merged.get(row.id);
    if (!cur) {
      merged.set(row.id, { ...row });
    } else {
      cur.count += row.count;
      cur.ok = cur.count > 0;
      cur.avgMs = Math.max(cur.avgMs, row.avgMs);
      if (row.count > 0) cur.error = null;
    }
  }

  return [...merged.values()].sort((x, y) => y.count - x.count);
}

module.exports = { gather, probe, probeAll, DEFAULT_BUDGET_MS };
