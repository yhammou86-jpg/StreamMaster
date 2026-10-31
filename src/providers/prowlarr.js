'use strict';

/**
 * Prowlarr — optional bridge to a self-hosted indexer manager, which in turn
 * unlocks private trackers (TorrentLeech, IPTorrents, ...).
 *
 * Requires a publicly reachable Prowlarr instance; disabled unless the user
 * supplies both a URL and an API key.
 */

const { json } = require('../http');

module.exports = {
  id: 'prowlarr',
  name: 'Prowlarr',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const { url, key } = ctx.cfg.prowlarr || {};
    if (!url || !key) return [];

    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    const data = await json(
      `${url}/api/v1/search?query=${encodeURIComponent(q)}&type=search&limit=100`,
      {
        timeout: 6000,
        headers: { 'X-Api-Key': key, accept: 'application/json' },
      }
    );
    if (!Array.isArray(data)) return [];

    return data
      .filter((r) => r && r.infoHash && /^[a-f0-9]{40}$/i.test(r.infoHash))
      .map((r) => ({
        infoHash: String(r.infoHash).toLowerCase(),
        title: r.title || '',
        size: Number(r.size) || 0,
        seeders: Number(r.seeders) || 0,
        provider: 'prowlarr',
        providerName: r.indexer || 'Prowlarr',
      }));
  },
};
