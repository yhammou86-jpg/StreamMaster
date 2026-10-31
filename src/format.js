'use strict';

/**
 * Stream object construction.
 *
 * Stremio/Nuvio render two lines per stream: `name` is a compact badge on the
 * left, `title` is the descriptive block (markdown + newlines supported).
 * Everything the user needs to choose — quality, size, seeders, source — has to
 * fit in those two lines without becoming noise.
 */

const { sources } = require('./trackers');

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

function qualityLine(item) {
  const p = item.parsed;
  const bits = [];
  bits.push(p.resolution ? `**${p.resolution === '4k' ? '4K' : p.resolution}**` : '**?**');
  if (p.source) bits.push(p.source);
  if (p.codec) bits.push(p.codec);
  if (p.hdr) bits.push('HDR');
  if (p.audio) bits.push(p.audio);
  return bits.join(' · ');
}

function detailLine(item) {
  const bits = [];
  const size = humanSize(item.size);
  if (size) bits.push(size);
  if (item.seeders > 0) bits.push(`${item.seeders} seeders`);
  if (item.providerName) bits.push(item.providerName);
  return bits.join(' · ');
}

function badge(item, cfg) {
  if (item.cached) return '⚡ TB';
  if (item.via === 'torbox') return 'TB ↓';
  return 'P2P';
}

/**
 * @param {object[]} items ranked items
 * @param {object} cfg normalised config
 * @param {{base:string, blob:string, hint:string, limit:number}} ctx
 */
function buildStreams(items, cfg, ctx) {
  const { base, blob, hint, limit } = ctx;
  const out = [];

  for (const item of items) {
    if (out.length >= limit) break;

    const stream = {
      name: badge(item, cfg),
      title: `${qualityLine(item)}\n${detailLine(item)}`,
      behaviorHints: {
        bingeGroup: `hydra|${cfg.mode}|${item.parsed.resolution}|${item.parsed.source}|${item.parsed.group}`,
        filename: item.title,
      },
    };

    if (item.size) stream.behaviorHints.videoSize = item.size;

    if (item.cached || item.via === 'torbox') {
      // Lazy resolution: the URL is our own endpoint, which mints a TorBox
      // direct link on demand. No API call happens until the user hits play.
      const params = new URLSearchParams({ c: blob });
      if (hint) params.set('f', hint);
      if (!item.cached) params.set('u', '1'); // allow uncached download
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
