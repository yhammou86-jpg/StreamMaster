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

function cleanTitle(raw) {
  return String(raw || '')
    .replace(/\.(mkv|mp4|avi|mov|m4v|webm)$/i, '')
    .replace(/[._]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/**
 * @param {string} name raw release / torrent title
 * @returns {object} structured release info
 */
function parseRelease(name) {
  const raw = String(name || '');
  const text = raw.replace(/[._]/g, ' ');

  const res = firstMatch(RES_MAP, text);
  const source = firstMatch(SOURCE_MAP, text);
  // An untagged source is unknown, not worthless — give it a neutral weight
  // instead of letting it fall below every labelled release.
  if (!source.label) source.weight = 45;
  const codec = firstMatch(CODEC_MAP, text);
  const audio = firstMatch(AUDIO_MAP, text);

  const hdr = /\b(hdr10\+?|hdr|dolby ?vision|dv|hlg)\b/i.test(text);
  const proper = /\b(proper|repack|real)\b/i.test(text);
  const threeD = /\b(3d|hsbs|half-sbs)\b/i.test(text);

  const se = text.match(/\bS(\d{1,2})\s?E(\d{1,3})\b/i) || text.match(/\b(\d{1,2})x(\d{2,3})\b/);
  const season = se ? Number(se[1]) : null;
  const episode = se ? Number(se[2]) : null;

  const yearMatch = text.match(/\b(19\d{2}|20\d{2})\b/);
  const year = yearMatch ? Number(yearMatch[1]) : null;

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
    resolution: res.label || '',
    resRank: res.weight,
    source: source.label || '',
    sourceRank: source.weight,
    isCam: BAD_SOURCE.test(text),
    codec: codec.label || '',
    audio: audio.label || '',
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

module.exports = { parseRelease, matchesEpisode, cleanTitle };
