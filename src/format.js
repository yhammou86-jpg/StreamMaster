'use strict';

/**
 * Stream formatting.
 *
 * Clients render two fields: `name` is a narrow badge on the left, `title` is
 * the body block. Newlines are unreliable in `name` but well supported in
 * `title`, so the whole information card lives there.
 *
 * The layout mirrors the format popularised by AIOStreams — one icon per fact,
 * one fact per line — because it scans far faster than a comma-separated wall:
 *
 *   🔥 4K | ⚡ Cached | 🛰️ 7.2 GB
 *   🎬 Sugar ▸ S02E03
 *   💎 WEB-DL · HEVC
 *   🔊 Atmos · DD+
 *   🌐 English
 *   📚 TorBox
 *
 * Image badges are deliberately not used: no client reliably renders markdown
 * images in a stream title, so we stay with Unicode glyphs.
 */

const { sources } = require('./trackers');

const SEP = ' | ';

function humanSize(bytes) {
  const n = Number(bytes) || 0;
  if (n <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let i = 0;
  let v = n;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v >= 100 ? v.toFixed(0) : v.toFixed(v >= 10 ? 1 : 2)} ${units[i]}`;
}

function resLabel(parsed) {
  if (!parsed.resolution) return '';
  return parsed.resolution === '4k' ? '4K' : parsed.resolution;
}

function serviceTag(cfg) {
  if (!cfg.key) return 'P2P';
  return cfg.svc === 'realdebrid' ? 'RD' : 'TB';
}

/** Left-hand badge: short enough to survive Stremio's narrow column. */
function badge(item, cfg) {
  if (item.cached) return `⚡ ${serviceTag(cfg)}`;
  if (item.via === 'debrid') return `⏳ ${serviceTag(cfg)}`;
  return 'P2P';
}

/** Line 1 — resolution, availability, size. */
function headline(item, cfg) {
  const bits = [];
  const res = resLabel(item.parsed);
  if (res) bits.push(`🔥 ${res}`);

  if (item.cached) bits.push(`⚡ Cached`);
  else if (item.via === 'debrid') bits.push(`⏳ Uncached`);
  else if (item.seeders > 0) bits.push(`👥 ${item.seeders}`);

  const size = humanSize(item.size);
  if (size) bits.push(`🛰️ ${size}`);

  return bits.join(SEP);
}

/** Line 2 — what the file actually is, in human terms. */
function titleLine(item, meta) {
  const name = (meta && meta.title) || '';
  const p = item.parsed;

  if (meta && meta.kind === 'series' && meta.season != null) {
    const tag = `S${String(meta.season).padStart(2, '0')}E${String(meta.episode).padStart(2, '0')}`;
    const ep = meta.episodeTitle ? ` · ${meta.episodeTitle}` : '';
    return `🎬 ${name} ▸ ${tag}${ep}`;
  }
  if (name) {
    const year = meta && meta.year ? ` (${meta.year})` : '';
    return `🎬 ${name}${year}`;
  }
  if (p.season != null) {
    return `🎬 S${String(p.season).padStart(2, '0')}E${String(p.episode).padStart(2, '0')}`;
  }
  return '';
}

/** Line 3 — source and codec. */
function qualityLine(item) {
  const p = item.parsed;
  const bits = [];
  if (p.source) bits.push(p.source);
  if (p.codec) bits.push(p.codec);
  if (p.dv) bits.push('DV');
  else if (p.hdr10p) bits.push('HDR10+');
  else if (p.hdr) bits.push('HDR');
  if (p.threeD) bits.push('3D');
  return bits.length ? `💎 ${bits.join(' · ')}` : '';
}

function audioLine(item) {
  return item.parsed.audio ? `🔊 ${item.parsed.audio}` : '';
}

function languageLine(item) {
  const langs = item.parsed.langs;
  if (!langs || !langs.length) return '';
  return `🌐 ${langs.join(' · ')}`;
}

/** Last line — which tracker the result came from, plus release group. */
function libraryLine(item) {
  const bits = [];
  if (item.providerName) bits.push(item.providerName);
  if (item.parsed.group) bits.push(item.parsed.group);
  return bits.length ? `📚 ${bits.join(' · ')}` : '';
}

function compactTitle(item, meta) {
  const bits = [];
  const res = resLabel(item.parsed);
  if (res) bits.push(`🔥 ${res}`);
  if (item.cached) bits.push('⚡');
  else if (item.seeders) bits.push(`👥 ${item.seeders}`);
  const size = humanSize(item.size);
  if (size) bits.push(size);
  if (item.parsed.source) bits.push(item.parsed.source);
  if (item.parsed.codec) bits.push(item.parsed.codec);
  if (item.providerName) bits.push(item.providerName);
  return bits.join(SEP);
}

/**
 * @param {object[]} items ranked items
 * @param {object} cfg normalised config
 * @param {{base:string, blob:string, hint:string, limit:number, meta:object}} ctx
 */
function buildStreams(items, cfg, ctx) {
  const { base, blob, hint, limit, meta } = ctx;
  const out = [];

  for (const item of items) {
    if (out.length >= limit) break;

    const lines =
      cfg.style === 'compact'
        ? [compactTitle(item, meta)]
        : [
            headline(item, cfg),
            titleLine(item, meta),
            qualityLine(item),
            audioLine(item),
            languageLine(item),
            libraryLine(item),
          ];

    const stream = {
      name: badge(item, cfg),
      title: lines.filter(Boolean).join('\n'),
      behaviorHints: {
        bingeGroup: `hydra|${cfg.mode}|${item.parsed.resolution}|${item.parsed.source}|${item.parsed.group}`,
        filename: item.title,
      },
    };

    if (item.size) stream.behaviorHints.videoSize = item.size;

    if (item.cached || item.via === 'debrid') {
      // Lazy resolution: our own endpoint mints the debrid link on play.
      const params = new URLSearchParams({ c: blob });
      if (hint) params.set('f', hint);
      if (!item.cached) params.set('u', '1');
      stream.url = `${base}/r/${item.infoHash}?${params.toString()}`;
    } else {
      stream.infoHash = item.infoHash;
      stream.sources = sources();
    }

    out.push(stream);
  }

  return out;
}

module.exports = { buildStreams, humanSize };
