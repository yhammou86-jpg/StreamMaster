'use strict';

/**
 * Nyaa — anime. RSS is more stable than the HTML search page and needs no
 * parser dependency: the feed is flat enough for a targeted regex.
 */

const { request } = require('../http');
const { parseRelease } = require('../parse');

const CAT_ANIME = '1_2'; // Anime / English-translated

function decodeEntities(s) {
  return String(s)
    .replace(/&#(\d+);/g, (_, d) => String.fromCharCode(Number(d)))
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function tag(block, name) {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, 'i'));
  return m ? decodeEntities(m[1].trim()) : '';
}

module.exports = {
  id: 'nyaa',
  name: 'Nyaa',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const isAnime = ctx.genres.some((g) => /anime/i.test(g));
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} ${String(ctx.episode).padStart(2, '0')}`
        : ctx.title;
    if (!q.trim()) return [];

    const url = `https://nyaa.si/?page=rss&q=${encodeURIComponent(q)}&c=${CAT_ANIME}&f=0`;
    const res = await request(url, { timeout: 5000 });
    if (!res.ok || !res.text) return [];

    const items = res.text.split(/<item>/i).slice(1);
    const out = [];

    for (const block of items) {
      const hash = tag(block, 'nyaa:infoHash').toLowerCase();
      if (!/^[a-f0-9]{40}$/.test(hash)) continue;

      const title = tag(block, 'title');
      const parsed = parseRelease(title);

      // Non-anime titles would drown the list in unrelated fansubs.
      if (!isAnime && ctx.kind === 'series') {
        if (parsed.season != null && parsed.season !== ctx.season) continue;
      }

      out.push({
        infoHash: hash,
        title,
        size: tag(block, 'nyaa:size'),
        seeders: Number(tag(block, 'nyaa:seeders')) || 0,
        provider: 'nyaa',
        providerName: 'Nyaa',
      });
    }
    return out;
  },
};
