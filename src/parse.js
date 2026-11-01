'use strict';

/**
 * Release-name intelligence.
 *
 * Turns "Inception.2010.2160p.UHD.BluRay.REMUX.HDR.HEVC.DTS-HD.MA.7.1-FGT"
 * into structured metadata used for ranking, filtering and pretty labels.
 */

const RES_MAP = [
  [/\b(2160p|4k|uhd)\b/i, '4k', 5],
  [/\b1080p\b/i, '1080p', 4],
  [/\b720p\b/i, '720p', 3],
  [/\b(576p|540p)\b/i, '576p', 2],
  [/\b480p\b/i, '480p', 2],
  [/\b(360p|240p)\b/i, '360p', 1],
];

// Ordered best -> worst. First match wins.
const SOURCE_MAP = [
  [/\bremux\b/i, 'REMUX', 100],
  [/\b(blu-?ray|bdrip|brrip|bdremux)\b/i, 'BluRay', 90],
  [/\b(web-?dl|webdl)\b/i, 'WEB-DL', 80],
  [/\b(web-?rip|webrip)\b/i, 'WEBRip', 65],
  [/\bweb\b/i, 'WEB', 70],
  [/\b(hdtv|pdtv|dsr)\b/i, 'HDTV', 50],
  [/\bdvdrip\b/i, 'DVDRip', 40],
  [/\b(hdrip)\b/i, 'HDRip', 38],
  [/\b(cam|hdcam|ts|hdts|telesync|tc|hdtc|screener|scr|dvdscr|pdvd|r5|pre-?dvd)\b/i, 'CAM', 0],
];

const BAD_SOURCE = /\b(cam|hdcam|hdts|telesync|ts|tc|hdtc|screener|scr|dvdscr|pdvd|r5)\b/i;

const CODEC_MAP = [
  [/\b(x265|h\.?265|hevc)\b/i, 'x265'],
  [/\b(av1)\b/i, 'AV1'],
  [/\b(x264|h\.?264|avc)\b/i, 'x264'],
  [/\b(xvid|divx)\b/i, 'XviD'],
];

const AUDIO_MAP = [
  [/\b(atmos|truehd)\b/i, 'Atmos'],
  [/\b(dts-?hd|dts-?x)\b/i, 'DTS-HD'],
  [/\b(ddp?5\.1|eac3|dd\+)\b/i, 'DD+'],
  [/\b(dts)\b/i, 'DTS'],
  [/\b(ac3|dd5\.1)\b/i, 'AC3'],
  [/\b(aac)\b/i, 'AAC'],
];

const LANG_TAGS = {
  multi: 'MULTi',
  ita: 'ITA',
  fre: 'FRE',
  vff: 'FRE',
  vfq: 'FRE',
  ger: 'GER',
  spa: 'SPA',
  lat: 'LAT',
  por: 'POR',
  rus: 'RUS',
  hin: 'HIN',
  kor: 'KOR',
  jpn: 'JPN',
  dual: 'DUAL',
};

function firstMatch(map, text) {
  for (const [re, label, weight] of map) {
    if (re.test(text)) return { label, weight };
  }
  return { label: '', weight: 0 };
}

/** Collect up to `max` distinct labels — releases often carry two audio formats. */
function collectMatches(map, text, max = 2) {
  const found = [];
  for (const [re, label] of map) {
    if (found.length >= max) break;
    if (re.test(text) && !found.includes(label)) found.push(label);
  }
  return found;
}

function cleanTitle(raw) {
  return String(raw || '')
    .replace(/\.(mkv|mp4|avi|mov|m4v|webm)$/i, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/* ------------------------------------------------------------------ identity */

/**
 * Tokens that mark the end of the title and the start of technical metadata.
 * Anything from here on is quality/source/codec noise, never part of the name.
 */
const TECH_TOKENS = new Set([
  '2160p', '1080p', '720p', '576p', '540p', '480p', '360p', '240p', '4k', 'uhd',
  'bluray', 'blu-ray', 'bdrip', 'brrip', 'bdremux', 'remux',
  'webrip', 'web-dl', 'webdl', 'web', 'hdtv', 'pdtv', 'dsr', 'dvdrip', 'hdrip', 'dvd',
  'hdr', 'hdr10', 'hdr10plus', 'dovi', 'dv', 'sdr', 'hlg', 'imax', 'imax2d', 'imaxe',
  'x264', 'x265', 'h264', 'h265', 'hevc', 'avc', 'av1', 'xvid', 'divx',
  'aac', 'ac3', 'eac3', 'ddp', 'dd', 'atmos', 'truehd', 'dts', 'flac', 'mp3',
  'proper', 'repack', 'real', 'extended', 'unrated', 'remastered', 'internal',
  'limited', 'multi', 'dual', 'complete', 'sample', 'readnfo', 'dubbed', 'subbed',
]);

/** Words that legitimately appear after the title and must not count as a mismatch. */
const EDITION_WORDS = new Set([
  'extended', 'unrated', 'directors', 'director', 'cut', 'imax', 'remastered', 'remaster',
  'dc', 'edition', 'theatrical', 'uncut', 'special', 'anniversary', 'redux', 'final',
  'proper', 'repack', 'version', 'open', 'matte', 'criterion', 'collectors',
]);

const ARTICLES = new Set(['the', 'a', 'an']);

/**
 * A four-digit number is only a release year if it could plausibly be one.
 * Without this, "Blade Runner 2049" is read as a 2049 release and "1917" as a
 * 1917 one — and every year comparison downstream then rejects the right film.
 */
const MAX_PLAUSIBLE_YEAR = new Date().getFullYear() + 1;

function isPlausibleYear(token) {
  if (!/^(19|20)\d{2}$/.test(String(token || ''))) return false;
  const n = Number(token);
  return n >= 1880 && n <= MAX_PLAUSIBLE_YEAR;
}

/** Split a release name into tokens, dropping separators and punctuation-only parts. */
function tokenizeRelease(raw) {
  return String(raw || '')
    .replace(/\.(mkv|mp4|avi|mov|m4v|webm|srt|nfo|txt)$/i, '')
    .split(/[.\s_\[\](){}]+/)
    .map((t) => t.replace(/^[-–—:]+|[-–—:]+$/g, ''))
    .filter((t) => t && !/^[-–—:]+$/.test(t));
}

/**
 * Strip the parts of a release name that are never the title:
 * leading group tags ("[SubsPlease]") and trailing episode numbers ("- 24").
 */
function stripTags(raw) {
  let s = String(raw || '');
  s = s.replace(/^\s*(?:\[[^\]]*\]\s*)+/, ''); // [Group] [1080p] at the start
  return s;
}

/**
 * Extract the title portion and the release year of a release name.
 *
 *   "Inception.2010.2160p.UHD.BluRay.REMUX"      -> "Inception" / 2010
 *   "Blade.Runner.2049.2017.1080p.BluRay"        -> "Blade Runner 2049" / 2017
 *   "Dune.Part.Two.2024.1080p.WEB-DL"            -> "Dune Part Two" / 2024
 *   "[SubsPlease] Jujutsu Kaisen - 24 (1080p)"   -> "Jujutsu Kaisen" / null
 *
 * Title and year are resolved together on purpose. Doing them separately is how
 * "Blade Runner 2049" loses its 2049: a naive trailing-year strip sees a
 * four-digit number and eats it, and the release then looks like the wrong film.
 * Here a number only counts as the year if it is a *plausible* release year and
 * is not the only thing left in the title.
 */
function releaseParts(raw) {
  const tokens = tokenizeRelease(stripTags(raw));

  let cut = tokens.length;
  for (let i = 0; i < tokens.length; i += 1) {
    const t = tokens[i].toLowerCase();
    // Note the prefix match: releases run the episode marker into the next word
    // ("S01E01Xvid", "S02E05WEB"), and anchoring at the end of the token would
    // leave it glued to the title and make a correct release look like a
    // different show.
    if (TECH_TOKENS.has(t) || /^s\d{1,2}(?:e\d{1,3})?/i.test(t) || /^\d{3,4}p$/i.test(t)) {
      cut = i;
      break;
    }
  }

  const head = tokens.slice(0, cut);

  // A trailing 1-3 digit number is an anime-style episode number, not the title.
  while (head.length > 1 && /^\d{1,3}$/.test(head[head.length - 1])) head.pop();

  // Exactly one trailing year, and only if it could actually be a release year.
  // "Blade Runner 2049" keeps its 2049 because 2049 is not a plausible year yet.
  let year = null;
  const last = head[head.length - 1];
  if (head.length > 1 && isPlausibleYear(last)) {
    year = Number(last);
    head.pop();
  }

  return { title: head.join(' ').trim(), year };
}

function releaseTitle(raw) {
  return releaseParts(raw).title;
}

/**
 * Year from a release name. Prefers the year parsed alongside the title, which
 * is the last plausible year before the technical metadata — not the first.
 * "Blade.Runner.2049.2017.1080p" is the 2017 film; a first-match read calls it
 * 2049 and every year comparison then wrongly rejects it.
 */
function releaseYear(raw) {
  return releaseParts(raw).year;
}

/** Fold accents, punctuation and casing so "Amélie" == "amelie". */
function normTitle(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function titleTokens(s) {
  const t = normTitle(s).split(' ').filter(Boolean);
  while (t.length > 1 && ARTICLES.has(t[0])) t.shift();
  return t;
}

/**
 * Is this release actually the thing that was asked for?
 *
 * Token-set equality after dropping edition words. Subset matching would be
 * more forgiving, but it is exactly how "Dune" ends up playing "Dune: Part Two",
 * so extras have to be real edition words to be tolerated.
 */
function titleMatches(requested, candidate) {
  const a = titleTokens(requested);
  const b = titleTokens(candidate);
  if (!a.length || !b.length) return true; // nothing to compare — don't block

  const aKey = a.join(' ');
  const bKey = b.join(' ');
  if (aKey === bKey) return true;

  const bSet = new Set(b);
  const aSet = new Set(a);
  const missing = a.filter((t) => !bSet.has(t));
  const extra = b.filter((t) => !aSet.has(t) && !EDITION_WORDS.has(t));

  return missing.length === 0 && extra.length === 0;
}

/** Executables, archives, password dumps and URL spam masquerading as a release. */
const JUNK_PATTERN =
  /\.(exe|scr|bat|cmd|com|pif|msi|vbs|jar|apk|dmg)\b|\b(password|passwd|pass\.txt|readme\.txt|crack|keygen|serial)\b|\bwww\.[a-z0-9-]+\.(com|net|org|to|ru|cc)\b/i;

function isJunk(raw) {
  return JUNK_PATTERN.test(String(raw || ''));
}

/**
 * Minimum believable size for a release, in bytes.
 *
 * A "4K" movie under 600 MB is not a 4K movie — it is a fake, a sample, or a
 * password-protected archive. Series episodes are shorter, so they get lower
 * floors. Unknown sizes (0) are never rejected: several providers omit them.
 */
const MIN_BYTES = {
  movie: { '4k': 600e6, '1080p': 200e6, '720p': 80e6, '576p': 40e6, '480p': 30e6, '360p': 20e6, '': 15e6 },
  series: { '4k': 150e6, '1080p': 60e6, '720p': 30e6, '576p': 20e6, '480p': 10e6, '360p': 8e6, '': 8e6 },
};

function plausibleSize(bytes, resolution, kind) {
  const n = Number(bytes);
  if (!n) return true; // unknown — cannot judge
  const table = MIN_BYTES[kind] || MIN_BYTES.movie;
  return n >= (table[resolution] || table['']);
}


/**
 * @param {string} name raw release / torrent title
 * @returns {object} structured release info
 */
function parseRelease(name) {
  const raw = String(name || '');
  // Match against the raw name: separators in release names are dots, so
  // stripping them would break tokens like "DDP5.1" or "S01.E02".
  const text = raw;

  const res = firstMatch(RES_MAP, text);
  const source = firstMatch(SOURCE_MAP, text);
  // An untagged source is unknown, not worthless — give it a neutral weight
  // instead of letting it fall below every labelled release.
  if (!source.label) source.weight = 45;
  const codec = firstMatch(CODEC_MAP, text);
  const audioTags = collectMatches(AUDIO_MAP, text, 2);

  const dv = /\b(dolby ?vision|dovi)\b|\bdv\b/i.test(text);
  const hdr10p = /\bhdr10\+|\bhdr10plus\b/i.test(text);
  const hdr = dv || hdr10p || /\bhdr(10)?\b|\bhlg\b/i.test(text);
  const proper = /\b(proper|repack|real)\b/i.test(text);
  const threeD = /\b(3d|hsbs|half-sbs)\b/i.test(text);

  const se =
    text.match(/\bS(\d{1,2})[.\s_-]?E(\d{1,3})\b/i) || text.match(/\b(\d{1,2})x(\d{2,3})\b/);
  const season = se ? Number(se[1]) : null;
  const episode = se ? Number(se[2]) : null;

  const year = releaseYear(raw);

  // Release group is conventionally the trailing token after a dash.
  const groupMatch = raw.match(/-\s?([A-Za-z0-9@]{2,20})(?:\.[a-z0-9]{2,4})?$/);
  const group = groupMatch ? groupMatch[1] : '';

  const langs = [];
  for (const [tag, label] of Object.entries(LANG_TAGS)) {
    if (new RegExp(`\\b${tag}\\b`, 'i').test(text)) langs.push(label);
  }

  return {
    raw,
    clean: cleanTitle(raw),
    releaseTitle: releaseTitle(raw),
    isJunk: isJunk(raw),
    resolution: res.label || '',
    resRank: res.weight,
    source: source.label || '',
    sourceRank: source.weight,
    isCam: BAD_SOURCE.test(text),
    codec: codec.label || '',
    audio: audioTags.join(' · '),
    dv,
    hdr10p,
    hdr,
    proper,
    threeD,
    season,
    episode,
    year,
    group,
    langs: [...new Set(langs)],
  };
}

/** Rough episode compatibility check against the requested SxxExx. */
function matchesEpisode(parsed, season, episode) {
  if (parsed.season == null) return true; // season packs, omnibus, movies
  if (parsed.season !== season) return false;
  return parsed.episode === episode;
}

module.exports = {
  parseRelease,
  matchesEpisode,
  cleanTitle,
  releaseTitle,
  releaseYear,
  titleMatches,
  isJunk,
  plausibleSize,
  normTitle,
};
