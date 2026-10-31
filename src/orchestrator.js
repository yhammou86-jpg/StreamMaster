'use strict';

/**
 * The orchestrator: fan out, enforce a deadline, normalise, dedupe, rank.
 *
 * Design rule: this function must never reject. A stream request that returns
 * 6 good results from 3 working scrapers is a success; a 500 because one tracker
 * timed out is a bug. Everything is Promise.allSettled + per-provider timeout.
 */

const { ALL } = require('./providers');
const { parseRelease, matchesEpisode } = require('./parse');
const { scoreItem, passesFilters, sortItems } = require('./rank');
const { withTimeout } = require('./http');

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
    if (!existing.providerName.split(',').includes(item.providerName)) {
      existing.providerName += `, ${item.providerName}`;
    }
  }
  return [...map.values()];
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

  const tasks = active.map((provider) => {
    const remaining = Math.max(1200, deadline - Date.now());
    return withTimeout(provider.search(ctx), remaining, provider.id)
      .then((rows) => ({ id: provider.id, rows: Array.isArray(rows) ? rows : [] }))
      .catch(() => ({ id: provider.id, rows: [] }));
  });

  const settled = await Promise.allSettled(tasks);
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

module.exports = { gather, DEFAULT_BUDGET_MS };
