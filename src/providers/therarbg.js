'use strict';

/**
 * TheRARBG — a RARBG successor with a terse JSON endpoint. Heavily rate limited,
 * so it ships disabled by default and is only worth enabling for the deep
 * back-catalogue it holds.
 */

const { json } = require('../http');

const HOSTS = ['https://therarbg.to', 'https://therarbg.com'];

function pick(obj, keys) {
  for (const k of keys) {
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return undefined;
}

module.exports = {
  id: 'therarbg',
  name: 'RARBG',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    let data = null;
    for (const host of HOSTS) {
      try {
        data = await json(
          `${host}/get-posts/keywords:${encodeURIComponent(q)}:format:json/`,
          { timeout: 5000, headers: { accept: 'application/json' } }
        );
        if (data) break;
      } catch {
        data = null;
      }
    }
    if (!data) return [];

    const rows = Array.isArray(data) ? data : Array.isArray(data.results) ? data.results : [];

    return rows
      .map((r) => {
        const hash = String(pick(r, ['ih', 'info_hash', 'hash', 'infohash']) || '').toLowerCase();
        return {
          infoHash: hash,
          title: String(pick(r, ['t', 'title', 'name']) || ''),
          size: Number(pick(r, ['sz', 'size', 'bytes'])) || 0,
          seeders: Number(pick(r, ['s', 'se', 'seeders'])) || 0,
          provider: 'therarbg',
          providerName: 'RARBG',
        };
      })
      .filter((r) => /^[a-f0-9]{40}$/.test(r.infoHash));
  },
};
