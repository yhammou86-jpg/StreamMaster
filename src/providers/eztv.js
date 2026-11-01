'use strict';

/**
 * EZTV — the canonical TV-release tracker.
 *
 * Two traps here, both of which made this source silently serve the wrong show:
 *
 * 1. EZTV keys its index by the NUMERIC part of the IMDb id. Sending the full
 *    "tt0903747" is not rejected — it is ignored, and the API then returns its
 *    entire global catalogue (about 1.1 million torrents of whatever aired last
 *    night) with a perfectly normal 200 response. Passing "0903747" filters
 *    correctly. A 403 would have been obvious; this looked like success.
 *
 * 2. Because of (1), the response has to be sanity-checked. A count far larger
 *    than any single show has episodes means the filter was ignored and the
 *    payload is unusable.
 */

const { json } = require('../http');
const { parseRelease, matchesEpisode } = require('../parse');

const HOSTS = ['https://eztvx.to', 'https://eztv.re', 'https://eztv.wf'];

/** No show has this many episodes. Anything above it means the filter was ignored. */
const MAX_PLAUSIBLE_COUNT = 50000;

module.exports = {
  id: 'eztv',
  name: 'EZTV',
  kinds: ['series'],

  async search(ctx) {
    if (!ctx.imdbId) return [];

    // "tt0903747" -> "0903747"
    const numericId = String(ctx.imdbId).replace(/^tt/i, '');
    let ignoredFilter = false;

    for (const host of HOSTS) {
      try {
        const data = await json(
          `${host}/api/get-torrents?imdb_id=${encodeURIComponent(numericId)}&limit=100&page=1`,
          { timeout: 5000, proxy: ctx.cfg.proxy }
        );
        if (!data || !Array.isArray(data.torrents)) continue;

        if (Number(data.torrents_count) > MAX_PLAUSIBLE_COUNT) {
          ignoredFilter = true;
          continue; // unusable payload — try the next host
        }

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
      } catch {
        /* try the next mirror */
      }
    }

    if (ignoredFilter) {
      const err = new Error('EZTV ignored the imdb_id filter');
      err.reason = 'filtered';
      err.hint =
        'EZTV answered with its whole catalogue instead of this show, which would mean unrelated episodes. Skipped.';
      throw err;
    }

    return [];
  },
};
