'use strict';

/**
 * Configuration schema + normalisation.
 *
 * Short keys because the whole object is compressed into the addon URL. Every
 * value is clamped so a hand-edited URL can never crash the addon.
 */

const PROVIDER_IDS = [
  'knaben',
  'yts',
  'eztv',
  'bitsearch',
  'nyaa',
  'apibay',
  'animetosho',
  'therarbg',
  'prowlarr',
  'torznab',
];

const RESOLUTIONS = ['4k', '1080p', '720p', '480p', '360p'];
const SERVICES = ['torbox', 'realdebrid'];
const STYLES = ['rich', 'compact'];

const DEFAULTS = {
  v: 2,
  svc: 'torbox',
  key: '',
  mode: 'hybrid',
  style: 'rich',
  providers: {
    knaben: true,
    yts: true,
    eztv: true,
    bitsearch: true,
    nyaa: true,
    apibay: true,
    animetosho: true,
    therarbg: false,
    prowlarr: false,
    torznab: false,
  },
  res: ['4k', '1080p', '720p', '480p'],
  max: 40,
  minSeed: 0,
  noCam: true,
  sort: 'quality',
  cachedOnly: false,
  uncached: false,
  preferEfficient: true,
  lang: '',
  proxy: '',
  prowlarr: { url: '', key: '' },
  torznab: { url: '', key: '' },
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

  // `tb` was the original single-service key name; accept it as an alias.
  const key = typeof src.key === 'string' ? src.key : typeof src.tb === 'string' ? src.tb : '';

  const cfg = {
    v: 2,
    svc: SERVICES.includes(src.svc) ? src.svc : DEFAULTS.svc,
    key: key.trim(),
    mode: ['hybrid', 'debrid', 'p2p'].includes(src.mode) ? src.mode : DEFAULTS.mode,
    style: STYLES.includes(src.style) ? src.style : DEFAULTS.style,
    providers: {},
    res: [],
    max: clampInt(src.max, 5, 100, DEFAULTS.max),
    minSeed: clampInt(src.minSeed, 0, 500, DEFAULTS.minSeed),
    noCam: bool(src.noCam, DEFAULTS.noCam),
    sort: ['quality', 'seeders', 'size'].includes(src.sort) ? src.sort : DEFAULTS.sort,
    cachedOnly: bool(src.cachedOnly, DEFAULTS.cachedOnly),
    uncached: bool(src.uncached, DEFAULTS.uncached),
    preferEfficient: bool(src.preferEfficient, DEFAULTS.preferEfficient),
    lang: typeof src.lang === 'string' ? src.lang.slice(0, 12) : '',
    proxy: typeof src.proxy === 'string' ? src.proxy.trim().slice(0, 300) : '',
    prowlarr: { url: '', key: '' },
    torznab: { url: '', key: '' },
  };

  // `solid` was the original SolidTorrents provider id. It became BitSearch, so
  // an old encoded URL still carries `providers.solid` — honour it.
  const solidAlias =
    src.providers && typeof src.providers === 'object' ? src.providers.solid : undefined;

  for (const id of PROVIDER_IDS) {
    const explicit = src.providers && src.providers[id];
    const v = explicit !== undefined ? explicit : id === 'bitsearch' ? solidAlias : undefined;
    cfg.providers[id] = bool(v, DEFAULTS.providers[id]);
  }

  const wanted = Array.isArray(src.res) ? src.res : DEFAULTS.res;
  cfg.res = RESOLUTIONS.filter((r) => wanted.includes(r));
  if (!cfg.res.length) cfg.res = DEFAULTS.res.slice();

  if (src.prowlarr && typeof src.prowlarr === 'object') {
    cfg.prowlarr.url = String(src.prowlarr.url || '').replace(/\/+$/, '').slice(0, 200);
    cfg.prowlarr.key = String(src.prowlarr.key || '').slice(0, 200);
  }
  if (!cfg.prowlarr.url || !cfg.prowlarr.key) cfg.providers.prowlarr = false;

  if (src.torznab && typeof src.torznab === 'object') {
    cfg.torznab.url = String(src.torznab.url || '').replace(/\/+$/, '').slice(0, 300);
    cfg.torznab.key = String(src.torznab.key || '').slice(0, 200);
  }
  if (!cfg.torznab.url) cfg.providers.torznab = false;

  if (!cfg.key) {
    if (cfg.mode === 'debrid') cfg.mode = 'hybrid';
    cfg.cachedOnly = false;
    cfg.uncached = false;
  }

  return cfg;
}

/** Config used when someone hits the bare /manifest.json */
const FALLBACK = normalize({});

module.exports = { DEFAULTS, PROVIDER_IDS, RESOLUTIONS, SERVICES, normalize, FALLBACK };
