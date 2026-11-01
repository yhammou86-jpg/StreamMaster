'use strict';

/**
 * Stremio-addon sources.
 *
 * Torrentio, Comet, MediaFusion and friends are not trackers — they are addons
 * that already did the scraping. Rather than re-scrape what they scrape, we ask
 * them the same question Stremio would ask: "what do you have for tt0816692?".
 * One request returns a ranked, de-duplicated list from dozens of indexers.
 *
 * The trade-off is control: we inherit their formatting, so the parsers below
 * are deliberately defensive. A stream we cannot attribute to an infohash is
 * dropped — everything downstream (debrid cache probe, P2P playback, dedupe)
 * is keyed on that hash.
 */

const { json } = require('../http');
const { parseSizeText } = require('../parse');

/** Torrentio and Comet both use "👤 123" for seeders; others spell it out. */
const SEED_RE = /(?:👤|👥|🌱|seed(?:ers)?\s*[:=]?)\s*(\d+)/i;
const HASH_RE = /btih:([a-z0-9]{40})/i;

/**
 * A line is worth treating as the release name if it carries the vocabulary of
 * one. Addons decorate their titles with emoji and stat lines, and picking the
 * wrong line means the title/year parser sees garbage and the identity filter
 * rejects a perfectly good release.
 */
const RELEASE_HINT =
  /\b(19|20)\d{2}\b|\b(2160p|1080p|720p|480p|4k|uhd)\b|\b(x264|x265|hevc|av1|web-?dl|web-?rip|blu-?ray|bdrip|hdtv|remux)\b/i;

function streamTitle(stream) {
  const hint = stream.behaviorHints || {};
  if (typeof hint.filename === 'string' && hint.filename.trim()) return hint.filename.trim();

  const raw = typeof stream.title === 'string' ? stream.title : '';
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const best = lines.find((l) => RELEASE_HINT.test(l));
  if (best) return best;
  if (lines.length) return lines[0];

  return typeof stream.name === 'string' ? stream.name.trim() : '';
}

function pickHash(stream) {
  const direct = typeof stream.infoHash === 'string' ? stream.infoHash.trim().toLowerCase() : '';
  if (/^[a-f0-9]{40}$/.test(direct)) return direct;

  // Some addons return a ready-made magnet or a debrid URL instead of a bare
  // hash. Pull the hash out rather than discarding the result.
  for (const field of [stream.url, stream.externalUrl]) {
    if (typeof field !== 'string') continue;
    const m = field.match(HASH_RE);
    if (m) return m[1].toLowerCase();
  }
  return '';
}

/**
 * @param {object} stream one entry from an addon's `streams` array
 * @param {string} providerId
 * @param {string} providerName
 * @returns {object|null} normalised row, or null when unusable
 */
function toRow(stream, providerId, providerName) {
  if (!stream || typeof stream !== 'object') return null;

  const hash = pickHash(stream);
  if (!hash) return null;

  const hint = stream.behaviorHints || {};
  const title = streamTitle(stream);
  // Stats live in the *other* lines of `title`, so scan the raw string — using
  // the extracted release name alone loses the size and seeder counts.
  const rawTitle = typeof stream.title === 'string' ? stream.title : '';
  const blob = `${rawTitle} ${stream.name || ''} ${stream.description || ''}`;

  const declared = Number(hint.videoSize);
  const size = Number.isFinite(declared) && declared > 0 ? Math.round(declared) : parseSizeText(blob);

  const seedMatch = blob.match(SEED_RE);
  const seeders = seedMatch ? Number(seedMatch[1]) : 0;

  return {
    infoHash: hash,
    title,
    size,
    seeders,
    provider: providerId,
    providerName,
  };
}

/** Strip trailing slashes and a pasted /manifest.json so we can append paths. */
function normalizeBase(url) {
  let s = String(url || '').trim();
  if (!s) return '';
  if (!/^https?:\/\//i.test(s)) s = `https://${s}`;
  s = s.replace(/\/manifest\.json$/i, '');
  return s.replace(/\/+$/, '');
}

/**
 * Build a provider bound to one addon base URL.
 *
 * @param {{id:string,name:string,base:string,kinds?:string[]}} spec
 */
function makeAddon({ id, name, base, kinds = ['movie', 'series'] }) {
  const root = normalizeBase(base);

  return {
    id,
    name,
    kinds,
    addon: true,
    base: root,

    async search(ctx) {
      if (!root || !ctx.imdbId) return [];

      const type = ctx.kind === 'series' ? 'series' : 'movie';
      // Stremio addresses episodes as tt1234567:season:episode — no encoding,
      // the colons are part of the id format.
      const idPart =
        ctx.kind === 'series' && ctx.season != null && ctx.episode != null
          ? `${ctx.imdbId}:${ctx.season}:${ctx.episode}`
          : ctx.imdbId;

      const data = await json(`${root}/stream/${type}/${idPart}.json`, { timeout: 6500 });
      const streams = Array.isArray(data && data.streams) ? data.streams : [];

      const rows = [];
      for (const stream of streams) {
        const row = toRow(stream, id, name);
        if (row) rows.push(row);
      }
      return rows;
    },
  };
}

/** Zero-config public instances — verified reachable, no account needed. */
const PRESETS = [
  makeAddon({ id: 'torrentio', name: 'Torrentio', base: 'https://torrentio.strem.fun' }),
  makeAddon({ id: 'comet', name: 'Comet', base: 'https://comet.feels.legal' }),
  makeAddon({ id: 'torrentsdb', name: 'TorrentsDB', base: 'https://torrentsdb.com' }),
  makeAddon({ id: 'mediafusion', name: 'MediaFusion', base: 'https://mediafusion.elfhosted.com' }),
];

/**
 * Turn user-pasted addon URLs into providers.
 *
 * This is how the config-required addons work in practice: StremThru Torz,
 * Sootio and Zilean all hand you a personal manifest URL containing your
 * settings, and there is no such thing as a usable anonymous instance.
 * Pasting that URL here is the correct integration, not a workaround.
 */
function fromUrls(urls) {
  const list = Array.isArray(urls) ? urls : [];
  const out = [];

  list.forEach((raw, index) => {
    const base = normalizeBase(raw);
    if (!base) return;

    let host = '';
    try {
      host = new URL(base).host.replace(/^www\./, '');
    } catch {
      return;
    }
    if (!host) return;

    out.push(makeAddon({ id: `addon${index}`, name: host, base }));
  });

  return out;
}

module.exports = { makeAddon, toRow, fromUrls, normalizeBase, PRESETS };
