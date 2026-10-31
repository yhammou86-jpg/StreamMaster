'use strict';

/**
 * EZTV — the canonical TV-release tracker. Its API is IMDb-addressable, which
 * makes it far more accurate than title searching for series.
 */

const { json } = require('../http');
const { parseRelease, matchesEpisode } = require('../parse');

const HOSTS = ['https://eztvx.to', 'https://eztv.re', 'https://eztv.wf'];

module.exports = {
  id: 'eztv',
  name: 'EZTV',
  kinds: ['series'],

  async search(ctx) {
    if (!ctx.imdbId) return [];

    let data = null;
    for (const host of HOSTS) {
      try {
        data = await json(
          `${host}/api/get-torrents?imdb_id=${encodeURIComponent(ctx.imdbId)}&limit=100&page=1`,
          { timeout: 5000 }
        );
        if (data && Array.isArray(data.torrents)) break;
      } catch {
        data = null;
      }
    }
    if (!data || !Array.isArray(data.torrents)) return [];

    return data.torrents
      .filter((t) => t && t.hash)
      .filter((t) => {
        const p = parseRelease(t.title || t.filename || '');
        return matchesEpisode(p, ctx.season, ctx.episode);
      })
      .map((t) => ({
        infoHash: String(t.hash).toLowerCase(),
        title: t.title || t.filename || '',
        size: Number(t.size_bytes) || 0,
        seeders: Number(t.seeds) || 0,
        provider: 'eztv',
        providerName: 'EZTV',
      }));
  },
};
