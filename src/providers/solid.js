'use strict';

/**
 * SolidTorrents — DHT-indexed search with a clean JSON API. Broad catalogue,
 * no Cloudflare challenge, so it works well from datacenter IPs.
 */

const { json } = require('../http');

const API = 'https://solidtorrents.to/api/v1/search';

module.exports = {
  id: 'solid',
  name: 'Solid',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    const category = ctx.kind === 'series' ? 'tv' : 'movie';
    const data = await json(
      `${API}?q=${encodeURIComponent(q)}&category=${category}&sort=seeders`,
      { timeout: 5000 }
    );

    const results = Array.isArray(data && data.results) ? data.results : [];

    return results
      .filter((r) => r && r.infohash && /^[a-f0-9]{40}$/i.test(r.infohash))
      .map((r) => ({
        infoHash: String(r.infohash).toLowerCase(),
        title: r.title || '',
        size: Number(r.size) || 0,
        seeders: Number(r.seeders) || 0,
        provider: 'solid',
        providerName: 'SolidTorrents',
      }));
  },
};
