'use strict';

/**
 * YTS — small, high-quality movie encodes (usually 1-4 GB).
 * Excellent for 1080p on limited bandwidth, and it is IMDb-addressable.
 */

const { json } = require('../http');

const HOSTS = ['https://yts.lt', 'https://yts.mx', 'https://yts.am'];

module.exports = {
  id: 'yts',
  name: 'YTS',
  kinds: ['movie'],

  async search(ctx) {
    if (!ctx.imdbId) return [];

    let data = null;
    for (const host of HOSTS) {
      try {
        data = await json(
          `${host}/api/v2/list_movies.json?query_term=${encodeURIComponent(ctx.imdbId)}&limit=20&sort_by=seeds`,
          { timeout: 4000 }
        );
        if (data && data.data) break;
      } catch {
        data = null;
      }
    }
    if (!data || !data.data || !Array.isArray(data.data.movies)) return [];

    const out = [];
    for (const movie of data.data.movies) {
      if (!movie || !Array.isArray(movie.torrents)) continue;
      for (const t of movie.torrents) {
        if (!t.hash) continue;
        out.push({
          infoHash: String(t.hash).toLowerCase(),
          title: `${movie.title_long || movie.title} [${t.quality}] [${t.type}] [YTS.${t.video_codec || 'x264'}]`,
          size: Number(t.size_bytes) || 0,
          seeders: Number(t.seeds) || 0,
          provider: 'yts',
          providerName: 'YTS',
        });
      }
    }
    return out;
  },
};
