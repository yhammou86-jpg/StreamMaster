'use strict';

/**
 * AniTosho — mirrors Nyaa plus several other anime trackers and exposes a JSON
 * feed. Used as an anime-only top-up so it never pollutes movie/series results.
 */

const { json } = require('../http');

const API = 'https://feed.animetosho.org/json';

module.exports = {
  id: 'animetosho',
  name: 'AniTosho',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const isAnime = (ctx.genres || []).some((g) => /anime/i.test(g));
    if (!isAnime) return [];

    const q = ctx.kind === 'series' ? `${ctx.title} ${String(ctx.episode).padStart(2, '0')}` : ctx.title;
    if (!q.trim()) return [];

    const data = await json(`${API}?q=${encodeURIComponent(q)}&limit=50`, { timeout: 5000 });
    if (!Array.isArray(data)) return [];

    return data
      .filter((t) => t && t.info_hash && /^[a-f0-9]{40}$/i.test(t.info_hash))
      .map((t) => ({
        infoHash: String(t.info_hash).toLowerCase(),
        title: t.title || '',
        size: Number(t.total_size) || 0,
        seeders: Number(t.seeders) || 0,
        provider: 'animetosho',
        providerName: 'AniTosho',
      }));
  },
};
