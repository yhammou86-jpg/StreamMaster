'use strict';

/**
 * The Pirate Bay via apibay.org — the largest public catalogue, exposed as a
 * plain JSON array.
 *
 * Reality check: apibay.org is behind a Cloudflare managed challenge that
 * fingerprints the TLS handshake. A browser (or curl) passes; Node's fetch does
 * not, and no header or cipher tweak changes that. So this provider is
 * opportunistic by design — it will work when the challenge is relaxed or when
 * a proxy is configured, and otherwise report `reason: 'cloudflare'`.
 *
 * TPB's catalogue is still covered when this fails: Knaben indexes it and
 * reports it as "The Pirate Bay (proxy)" in its results.
 */

const { json, mostInformative } = require('../http');

const MIRRORS = [
  'https://apibay.org',
  'https://apibay.net',
  'https://thepiratebay.org/apibay',
];

module.exports = {
  id: 'apibay',
  name: 'TPB',
  kinds: ['movie', 'series'],

  async search(ctx) {
    const q =
      ctx.kind === 'series'
        ? `${ctx.title} S${String(ctx.season).padStart(2, '0')}E${String(ctx.episode).padStart(2, '0')}`
        : `${ctx.title} ${ctx.year || ''}`.trim();
    if (!q.trim()) return [];

    let data = null;
    const errors = [];

    for (const host of MIRRORS) {
      try {
        data = await json(`${host}/q.php?q=${encodeURIComponent(q)}&cat=0`, {
          timeout: 2200,
          proxy: ctx.cfg.proxy,
        });
        if (Array.isArray(data)) break;
      } catch (err) {
        errors.push(err);
        data = null;
        // A TLS-fingerprint challenge is a property of the operator, not the
        // domain name. Retrying sibling mirrors only burns the time budget and
        // downgrades a precise diagnosis into a useless `timeout`.
        if (err.reason === 'cloudflare') break;
      }
    }

    if (!Array.isArray(data)) {
      // Report the most specific failure, not whichever mirror happened to be last.
      const err = mostInformative(errors);
      if (err) throw err;
      return [];
    }
    if (data.length === 1 && /no results returned/i.test(String(data[0].name || ''))) {
      return [];
    }

    return data
      .filter((t) => t && t.info_hash && /^[a-f0-9]{40}$/i.test(t.info_hash))
      .map((t) => ({
        infoHash: String(t.info_hash).toLowerCase(),
        title: t.name || '',
        size: Number(t.size) || 0,
        seeders: Number(t.seeders) || 0,
        provider: 'apibay',
        providerName: 'TPB',
      }));
  },
};
