'use strict';

/**
 * TorrentGalaxy — HTML scraper with mirror rotation.
 *
 * Two things make TGX awkward, and both are handled explicitly:
 *
 *   1. Its result rows carry no infohash, only a link to a detail page. Since
 *      everything downstream is keyed on the hash, the top few rows are opened
 *      to pull the magnet. That is a second round of requests, so it is capped
 *      hard — depth over breadth, but bounded.
 *   2. Every public mirror is currently dead or Cloudflare-challenged, which is
 *      why this ships disabled with a short timeout. A source that hangs would
 *      become the slowest request in every search and drag the whole addon to
 *      its budget for nothing.
 *
 * Parsing is regex-based because there is no API. It degrades to an empty list
 * rather than throwing: a markup change should look like "no results", never
 * like a broken addon.
 */

const { request, mostInformative } = require('../http');
const { parseSizeText } = require('../parse');

const MIRRORS = [
  'https://torrentgalaxy.to',
  'https://tgx.rs',
  'https://torrentgalaxy.one',
];

const HREF_RE = /href="\/torrent\/(\d+)\/([^"]+)"/gi;
const ROW_SPLIT = /(?=<div[^>]+class="[^"]*tgxtablerow)/i;
const TAG_RE = /<[^>]+>/g;
const ENTITIES = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>', '#039': "'" };

/** How many detail pages to open per search. Each one costs a round trip. */
const ENRICH_LIMIT = 8;
const ENRICH_TIMEOUT = 2500;

function decodeEntities(s) {
  return String(s || '').replace(/&(amp|quot|apos|lt|gt|#039);/g, (m, k) => ENTITIES[k] || m);
}

/** "/torrent/123/inception-2010-1080p-bluray-x264" -> "inception 2010 1080p bluray x264" */
function slugToName(slug) {
  return decodeEntities(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function stripTags(html) {
  return decodeEntities(String(html || '').replace(TAG_RE, ' ')).replace(/\s{2,}/g, ' ').trim();
}

/**
 * @param {string} html search results page
 * @returns {Array<{id:string,title:string,size:number,seeders:number}>}
 */
function parseResults(html) {
  const text = String(html || '');
  if (!text) return [];

  const rows = [];
  const seen = new Set();

  for (const chunk of text.split(ROW_SPLIT)) {
    HREF_RE.lastIndex = 0;
    const m = HREF_RE.exec(chunk);
    if (!m) continue;

    const id = m[1];
    if (seen.has(id)) continue;
    seen.add(id);

    const title = slugToName(m[2]);
    if (!title) continue;

    const flat = stripTags(chunk);
    const size = parseSizeText(flat);
    // Seeders are rendered in a green cell on TGX.
    const green = flat.match(/\b(\d{1,6})\b/g);
    let seeders = 0;
    const greenCell = chunk.match(/<font[^>]*color="#?3[0-9a-f]{5}"[^>]*>\s*(\d{1,6})/i);
    if (greenCell) seeders = Number(greenCell[1]);
    else if (green && green.length) seeders = Number(green[green.length - 1]);

    rows.push({ id, title, size, seeders });
  }

  return rows;
}

/** Open one detail page and pull the magnet hash out of it. */
async function resolveHash(mirror, id, proxy) {
  try {
    const res = await request(`${mirror}/torrent/${id}`, { timeout: ENRICH_TIMEOUT, proxy });
    if (!res.ok) return '';
    const m = res.text.match(/btih:([a-z0-9]{40})/i);
    return m ? m[1].toLowerCase() : '';
  } catch {
    return '';
  }
}

module.exports = {
  id: 'torrentgalaxy',
  name: 'TorrentGalaxy',
  kinds: ['movie', 'series'],
  mirrors: MIRRORS,
  parseResults,

  async search(ctx) {
    const query =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : ctx.year
          ? `${ctx.title} ${ctx.year}`
          : ctx.title;

    if (!String(query || '').trim()) return [];

    const proxy = ctx.cfg && ctx.cfg.proxy;
    const errors = [];

    for (const mirror of MIRRORS) {
      const url = `${mirror}/torrents.php?search=${encodeURIComponent(query)}&sort=seeders&order=desc`;
      let res;
      try {
        res = await request(url, { timeout: 3000, proxy });
      } catch (err) {
        errors.push(err);
        continue;
      }

      if (!res.ok) {
        const err = new Error(`${res.reason} ${res.status}`);
        err.reason = res.reason;
        err.hint = res.hint;
        errors.push(err);
        // A TLS-fingerprint block belongs to the operator, not the domain, so
        // the next mirror would just burn another timeout for the same answer.
        if (res.reason === 'cloudflare') break;
        continue;
      }

      const rows = parseResults(res.text).slice(0, ENRICH_LIMIT);
      if (!rows.length) continue;

      const hashes = await Promise.all(rows.map((r) => resolveHash(mirror, r.id, proxy)));

      return rows
        .map((row, i) => ({
          infoHash: hashes[i],
          title: row.title,
          size: row.size,
          seeders: row.seeders,
          provider: 'torrentgalaxy',
          providerName: 'TGX',
        }))
        .filter((r) => r.infoHash);
    }

    const best = mostInformative(errors);
    if (best) throw best;
    return [];
  },
};
