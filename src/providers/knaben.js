'use strict';

/**
 * Knaben — a meta-search engine that indexes dozens of public trackers
 * (TPB, 1337x, RARBG mirrors, TorrentGalaxy, YTS, EZTV, ...) behind one JSON
 * API, and reports *live* seeders rather than stale scrape data.
 *
 * This is the backbone provider: one request yields the breadth that used to
 * require fifteen scrapers.
 */

const { json } = require('../http');

const API = 'https://api.knaben.org/v1';

const MOVIE_CATS = [2000000];
const TV_CATS = [3000000];

function buildQuery(ctx) {
  if (ctx.kind === 'series') {
    const s = String(ctx.season).padStart(2, '0');
    const e = String(ctx.episode).padStart(2, '0');
    return `${ctx.title} S${s}E${e}`;
  }
  return ctx.year ? `${ctx.title} ${ctx.year}` : ctx.title;
}

function cleanOrigin(value) {
  const s = String(value || 'Knaben').replace(/\s*\(proxy\)\s*$/i, '');
  if (/^the pirate bay$/i.test(s)) return 'TPB';
  if (/^1337x$/i.test(s)) return '1337x';
  return s.slice(0, 26);
}

module.exports = {
  id: 'knaben',
  name: 'Knaben',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const query = buildQuery(ctx);
    if (!query.trim()) return [];

    const body = JSON.stringify({
      search_type: '100%',
      search_field: 'title',
      query,
      order_by: 'seeders',
      order_direction: 'desc',
      from: 0,
      size: 100,
      hide_unsafe: true,
      hide_xxx: true,
      categories: ctx.kind === 'series' ? TV_CATS : MOVIE_CATS,
    });

    const data = await json(API, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      timeout: 5500,
    });

    const hits = Array.isArray(data && data.hits) ? data.hits : [];

    return hits
      .filter((h) => {
        if (!h || !h.hash || h.hash.length < 32) return false;
        const cat = String(h.category || '');
        // Guard against category filters being ignored server-side.
        return /movie|tv|anime|video/i.test(cat) || cat === '';
      })
      .map((h) => ({
        infoHash: String(h.hash).toLowerCase(),
        title: h.title || '',
        size: Number(h.bytes) || 0,
        seeders: Number(h.liveSeeders) || Number(h.seeders) || 0,
        provider: 'knaben',
        providerName: cleanOrigin(h.cachedOrigin),
      }));
  },
};
