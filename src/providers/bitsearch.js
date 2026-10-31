'use strict';

/**
 * BitSearch — DHT-indexed search with a clean JSON API and a broad catalogue.
 *
 * This provider replaces the old SolidTorrents one. SolidTorrents did not
 * "return 403 because of Cloudflare": its domain was renamed, and the redirect
 * pointed at a host that *is* Cloudflare-challenged. Following that redirect and
 * blaming the final response is how a rename gets misdiagnosed as a block.
 *
 * Only `.eu` is used, and the `.to` mirror is deliberately *not* a fallback:
 * from a datacenter IP, `bitsearch.to` answers `curl` with a 301 but answers a
 * Node TLS handshake with a 403 "Just a moment..." challenge. Same URL, same
 * headers, different response — the fingerprint decides. Retrying it would just
 * overwrite a real result with a misleading `cloudflare` reason.
 */

const { json } = require('../http');

const API = 'https://bitsearch.eu/api/v1/search';

module.exports = {
  id: 'bitsearch',
  name: 'BitSearch',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    // category 1 = Movies, 2 = TV
    const category = ctx.kind === 'series' ? 2 : 1;

    const data = await json(
      `${API}?q=${encodeURIComponent(q)}&category=${category}&sort=seeders`,
      { timeout: 5000, proxy: ctx.cfg.proxy }
    );

    const results = Array.isArray(data && data.results) ? data.results : [];

    return results
      .filter((r) => r && r.infohash && /^[a-f0-9]{40}$/i.test(r.infohash))
      .map((r) => ({
        infoHash: String(r.infohash).toLowerCase(),
        title: r.title || '',
        size: Number(r.size) || 0,
        seeders: Number(r.seeders) || 0,
        provider: 'bitsearch',
        providerName: 'BitSearch',
      }));
  },
};
