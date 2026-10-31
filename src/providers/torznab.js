'use strict';

/**
 * Torznab — the single most valuable provider in the box.
 *
 * Torznab is the Newznab-compatible search API exposed by both Jackett and
 * Prowlarr. One URL from either of them unlocks every indexer they manage:
 * private trackers, niche sites, foreign-language trackers — hundreds of
 * sources behind one endpoint, with correct seeders and infohashes.
 *
 * The user pastes the full Torznab search URL from their indexer manager
 * (Jackett shows it under "Copy Torznab Feed"), plus the API key if it is not
 * already in the URL.
 */

const { request } = require('../http');
const { parseRelease, matchesEpisode } = require('../parse');

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

/** Pull every <torznab:attr name="x" value="y"/> out of an item block. */
function attrs(block) {
  const out = {};
  const re = /<torznab:attr[^>]*name="([^"]+)"[^>]*value="([^"]*)"/gi;
  let m;
  while ((m = re.exec(block))) out[m[1].toLowerCase()] = decodeEntities(m[2]);
  return out;
}

function extractMagnet(block, a) {
  if (a.magneturl) return a.magneturl;
  const enc = block.match(/<enclosure[^>]*url="([^"]+)"/i);
  if (enc && /^magnet:/i.test(enc[1])) return decodeEntities(enc[1]);
  const link = tag(block, 'link');
  if (/^magnet:/i.test(link)) return link;
  if (/^https?:/i.test(link) && a.infohash) {
    return `magnet:?xt=urn:btih:${a.infohash}`;
  }
  return '';
}

function hashFromMagnet(m) {
  const match = String(m).match(/urn:btih:([a-z0-9]{32,40})/i);
  if (!match) return '';
  let h = match[1].toLowerCase();
  // Base32 infohashes are legal in magnets; normalise to hex.
  if (h.length === 32) {
    try {
      const alphabet = 'abcdefghijklmnopqrstuvwxyz234567';
      let bits = '';
      for (const ch of h) bits += alphabet.indexOf(ch).toString(2).padStart(5, '0');
      let hex = '';
      for (let i = 0; i + 4 <= bits.length; i += 4) {
        hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
      }
      h = hex.slice(0, 40);
    } catch {
      return '';
    }
  }
  return /^[a-f0-9]{40}$/.test(h) ? h : '';
}

function buildUrl(base, key, query, kind) {
  // Accept a bare base ("http://host:9117") or a full Torznab endpoint.
  let url = base.trim().replace(/\/+$/, '');
  if (!/\/api$/i.test(url)) url += '/api';

  const params = new URLSearchParams({ t: 'search', q: query });
  if (key) params.set('apikey', key);
  // 2000 = Movies, 5000 = TV
  params.set('cat', kind === 'series' ? '5000' : '2000');
  params.set('limit', '100');

  return `${url}?${params.toString()}`;
}

module.exports = {
  id: 'torznab',
  name: 'Torznab',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const { url, key } = ctx.cfg.torznab || {};
    if (!url) return [];

    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    const res = await request(buildUrl(url, key, q, ctx.kind), {
      timeout: 7000,
      headers: { accept: 'application/rss+xml, application/xml, text/xml' },
    });
    if (!res.ok || !res.text) return [];

    const items = res.text.split(/<item[\s>]/i).slice(1);
    const out = [];

    for (const block of items) {
      const a = attrs(block);
      const infoHash = hashFromMagnet(extractMagnet(block, a)) || (a.infohash || '').toLowerCase();
      if (!/^[a-f0-9]{40}$/.test(infoHash)) continue;

      const title = tag(block, 'title');
      const parsed = parseRelease(title);
      if (ctx.kind === 'series' && !matchesEpisode(parsed, ctx.season, ctx.episode)) continue;

      const size = Number(a.size) || Number(tag(block, 'size')) || 0;
      const seeders = Number(a.seeders) || 0;

      out.push({
        infoHash,
        title,
        size,
        seeders,
        provider: 'torznab',
        providerName: a.indexer || tag(block, 'author') || 'Torznab',
      });
    }
    return out;
  },
};
