'use strict';

/**
 * Configuration schema + normalisation.
 *
 * Everything is stored with short keys because the whole object is compressed
 * into the addon URL. Unknown keys are dropped and every value is clamped so a
 * hand-edited URL can never crash the addon.
 */

const PROVIDER_IDS = [
  'knaben',
  'yts',
  'eztv',
  'solid',
  'nyaa',
  'apibay',
  'animetosho',
  'therarbg',
  'prowlarr',
];

const RESOLUTIONS = ['4k', '1080p', '720p', '480p', '360p'];

const DEFAULTS = {
  v: 1,
  // TorBox API key (optional — omit for pure P2P)
  tb: '',
  // 'hybrid' = debrid when cached, P2P otherwise. 'debrid' = TorBox only.
  // 'p2p' = never touch TorBox, always hand the client an infohash.
  mode: 'hybrid',
  // Enabled scrapers
  providers: {
    knaben: true,
    yts: true,
    eztv: true,
    solid: true,
    nyaa: true,
    apibay: true,
    animetosho: true,
    therarbg: false,
    prowlarr: false,
  },
  // Quality filters
  res: ['4k', '1080p', '720p', '480p'],
  max: 40,
  minSeed: 0,
  // Block low-quality releases
  noCam: true,
  // Sort order: 'quality' | 'seeders' | 'size'
  sort: 'quality',
  // Only show results TorBox already has cached (fastest, zero waiting)
  cachedOnly: false,
  // Allow TorBox to fetch uncached torrents on play (slow first play)
  tbUncached: false,
  // Prefer HEVC/AV1 encodes (smaller files, same quality)
  preferEfficient: true,
  // Preferred audio/subtitle language hint, e.g. 'ita', 'fre'
  lang: '',
  // Self-hosted Prowlarr (optional)
  prowlarr: { url: '', key: '' },
};

function bool(v, dflt) {
  return typeof v === 'boolean' ? v : dflt;
}

function clampInt(v, min, max, dflt) {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, Math.round(n)));
}

function normalize(raw) {
  const src = raw && typeof raw === 'object' ? raw : {};
  const cfg = {
    v: 1,
    tb: typeof src.tb === 'string' ? src.tb.trim() : '',
    mode: ['hybrid', 'debrid', 'p2p'].includes(src.mode) ? src.mode : DEFAULTS.mode,
    providers: {},
    res: [],
    max: clampInt(src.max, 5, 100, DEFAULTS.max),
    minSeed: clampInt(src.minSeed, 0, 500, DEFAULTS.minSeed),
    noCam: bool(src.noCam, DEFAULTS.noCam),
    sort: ['quality', 'seeders', 'size'].includes(src.sort) ? src.sort : DEFAULTS.sort,
    cachedOnly: bool(src.cachedOnly, DEFAULTS.cachedOnly),
    tbUncached: bool(src.tbUncached, DEFAULTS.tbUncached),
    preferEfficient: bool(src.preferEfficient, DEFAULTS.preferEfficient),
    lang: typeof src.lang === 'string' ? src.lang.slice(0, 12) : '',
    prowlarr: { url: '', key: '' },
  };

  for (const id of PROVIDER_IDS) {
    const v = src.providers && src.providers[id];
    cfg.providers[id] = bool(v, DEFAULTS.providers[id]);
  }

  const wanted = Array.isArray(src.res) ? src.res : DEFAULTS.res;
  cfg.res = RESOLUTIONS.filter((r) => wanted.includes(r));
  if (!cfg.res.length) cfg.res = DEFAULTS.res.slice();

  if (src.prowlarr && typeof src.prowlarr === 'object') {
    cfg.prowlarr.url = String(src.prowlarr.url || '').replace(/\/+$/, '').slice(0, 200);
    cfg.prowlarr.key = String(src.prowlarr.key || '').slice(0, 200);
  }
  if (!cfg.prowlarr.url || !cfg.prowlarr.key) {
    cfg.providers.prowlarr = false;
  }
  if (!cfg.tb) {
    // No debrid key -> the only sensible mode is P2P.
    if (cfg.mode === 'debrid') cfg.mode = 'hybrid';
    cfg.cachedOnly = false;
  }

  return cfg;
}

/** Config used when someone hits the bare /manifest.json */
const FALLBACK = normalize({});

module.exports = { DEFAULTS, PROVIDER_IDS, RESOLUTIONS, normalize, FALLBACK };
