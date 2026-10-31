'use strict';

/**
 * The Pirate Bay via apibay.org — the largest public catalogue, exposed as a
 * plain JSON array. Frequently behind a Cloudflare challenge; fails soft.
 */

const { json } = require('../http');

const API = 'https://apibay.org/q.php';

module.exports = {
  id: 'apibay',
  name: 'TPB',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    // cat 200 = Video, 205 = TV shows, 207 = HD Movies
    const data = await json(`${API}?q=${encodeURIComponent(q)}&cat=0`, { timeout: 5000 });
    if (!Array.isArray(data)) return [];
    if (data.length === 1 && String(data[0].name || '').toLowerCase().includes('no results')) {
      return [];
    }

    return data
      .filter((t) => t && t.info_hash && /^[a-f0-9]{40}$/i.test(t.info_hash))
      .map((t) => ({
        infoHash: String(t.info_hash).toLowerCase(),
        title: t.name || '',
        size: Number(t.size) || 0,
        seeders: Number(t.seeders) || 0,
        provider: 'apibay',
        providerName: 'TPB',
      }));
  },
};
