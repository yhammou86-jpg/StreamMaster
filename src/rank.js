'use strict';

/**
 * Ranking.
 *
 * A raw seeder count is a terrible sort key: it puts 15-year-old CAM rips with
 * 900 seeders above a fresh 4K REMUX. We score on quality first, then liveness,
 * then a set of small tie-breakers, and finally add a huge bonus for anything
 * TorBox already has cached (instant playback beats everything).
 */

const CACHED_BONUS = 100000;

function seederScore(seeders) {
  if (!seeders || seeders < 0) return 0;
  return Math.min(800, Math.round(Math.log10(1 + seeders) * 220));
}

/**
 * P2P results live or die by swarm size: a 4K rip with one seeder will stall
 * forever, so it must not outrank a well-seeded 1080p. Cached debrid results
 * are immune — TorBox serves those from disk regardless of swarm.
 */
function livenessPenalty(seeders) {
  if (seeders <= 0) return -3000;
  if (seeders < 3) return -2000;
  if (seeders < 10) return -700;
  if (seeders < 20) return -200;
  return 0;
}

function scoreItem(item, cfg, opts = {}) {
  const p = item.parsed;
  const useLiveness = opts.liveness !== false && !item.cached && item.via !== 'torbox';
  let score = 0;

  score += p.resRank * 1000;
  score += p.sourceRank * 10;
  score += seederScore(item.seeders);
  if (useLiveness) score += livenessPenalty(item.seeders);

  if (cfg.preferEfficient && (p.codec === 'x265' || p.codec === 'AV1')) score += 120;
  if (p.hdr) score += 90;
  if (p.proper) score += 40;

  if (cfg.lang) {
    const want = cfg.lang.toLowerCase();
    if (p.langs.some((l) => l.toLowerCase().includes(want))) score += 180;
  }

  if (p.isCam) score -= 6000;
  if (p.threeD) score -= 250;
  if (!item.size) score -= 50;

  if (item.cached) score += CACHED_BONUS;

  return score;
}

function passesFilters(item, cfg) {
  const p = item.parsed;

  if (!p.resolution && !p.isCam) {
    // Unknown resolution is only acceptable when the release still declares a
    // real source (e.g. "BluRay" with no resolution tag).
    if (!p.source) return false;
  }
  if (p.resolution && !cfg.res.includes(p.resolution)) return false;
  if (cfg.noCam && p.isCam) return false;
  // NB: cachedOnly is enforced in the stream handler *after* the TorBox probe,
  // because cache state is unknown while scraping.
  if (cfg.minSeed > 0 && item.seeders < cfg.minSeed) return false;

  return true;
}

function sortItems(items, cfg) {
  const by = cfg.sort;
  return items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (by === 'seeders') return b.seeders - a.seeders;
    if (by === 'size') return b.size - a.size;
    return b.seeders - a.seeders;
  });
}

module.exports = { scoreItem, passesFilters, sortItems, CACHED_BONUS, livenessPenalty };
