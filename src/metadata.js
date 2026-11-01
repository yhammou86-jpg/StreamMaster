'use strict';

/**
 * Metadata resolution via Cinemeta (the catalogue Stremio itself uses).
 *
 * Stream requests only give us an IMDb id (tt1375666) or an episode id
 * (tt0903747:5:14). Scrapers need a human title, a year and an episode number.
 */

const { json } = require('./http');
const cache = require('./cache');

const CINEMETA = 'https://v3-cinemeta.strem.io/meta';

function splitId(id) {
  const parts = String(id || '').split(':');
  return {
    imdbId: parts[0] || '',
    season: parts[1] ? Number(parts[1]) : null,
    episode: parts[2] ? Number(parts[2]) : null,
  };
}

/**
 * @returns {Promise<{kind:'movie'|'series', imdbId, title, year, season, episode, episodeTitle, genres}>}
 */
async function resolveMeta(type, rawId) {
  const { imdbId, season, episode } = splitId(rawId);
  const kind = type === 'series' ? 'series' : 'movie';

  const base = {
    kind,
    imdbId,
    title: '',
    year: null,
    season,
    episode,
    episodeTitle: '',
    genres: [],
    released: '',
    releasedAt: null,
    episodeReleasedAt: null,
  };

  if (!/^tt\d+$/.test(imdbId)) return base;

  const meta = await cache
    .memo(`meta:${kind}:${imdbId}`, 12 * 60 * 60 * 1000, async () => {
      const data = await json(`${CINEMETA}/${kind}/${imdbId}.json`, { timeout: 4500 });
      return data && data.meta ? data.meta : null;
    })
    .catch(() => null);

  if (!meta) return base;

  base.title = meta.name || '';
  base.year = meta.year ? Number(String(meta.year).slice(0, 4)) : null;
  base.genres = Array.isArray(meta.genres) ? meta.genres : [];
  base.released = meta.released || '';
  base.releasedAt = base.released ? Date.parse(base.released) || null : null;

  if (kind === 'series' && Array.isArray(meta.videos) && season != null && episode != null) {
    const video = meta.videos.find(
      (v) => Number(v.season) === season && Number(v.episode) === episode
    );
    if (video) {
      base.episodeTitle = video.name || video.title || '';
      // An unaired episode is the same situation as an unreleased film: every
      // torrent claiming to be it is fake.
      base.episodeReleasedAt = video.released ? Date.parse(video.released) || null : null;
    }
  }

  return base;
}

/**
 * Has this actually come out yet?
 *
 * A day of slack absorbs timezone differences between Cinemeta's dates and the
 * viewer's clock. The episode date wins for series, because asking for an
 * unaired episode of an airing show should not return anything.
 */
function isUnreleased(meta, now = Date.now()) {
  if (!meta) return false;
  const at = meta.episodeReleasedAt || meta.releasedAt;
  if (!at) return false;
  return at > now + 24 * 60 * 60 * 1000;
}

module.exports = { resolveMeta, splitId, isUnreleased };
