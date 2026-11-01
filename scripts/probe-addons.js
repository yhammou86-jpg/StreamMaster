'use strict';

/**
 * Check every addon source from the same client the addon uses.
 *
 * Cloudflare challenges are TLS-fingerprint specific, so curl returning 200
 * proves nothing — only a Node fetch tells you whether a source is usable.
 * Run this after changing a base URL in src/providers/addon.js.
 *
 *   node scripts/probe-addons.js
 */

const { PRESETS } = require('../src/providers/addon');

const CTX = { kind: 'movie', imdbId: 'tt0816692', title: 'Interstellar', year: 2014, genres: [] };

(async () => {
  const rows = await Promise.all(
    PRESETS.map(async (provider) => {
      const started = Date.now();
      try {
        const list = await provider.search(CTX);
        const sized = list.filter((r) => r.size > 0).length;
        return {
          name: provider.name,
          ok: list.length > 0,
          note: `${list.length} rows (${sized} with size)`,
          ms: Date.now() - started,
        };
      } catch (err) {
        return { name: provider.name, ok: false, note: err.reason || err.message, ms: Date.now() - started };
      }
    })
  );

  for (const r of rows) {
    const flag = r.ok ? '\x1b[32mOK  \x1b[0m' : '\x1b[31mFAIL\x1b[0m';
    console.log(`${flag} ${r.name.padEnd(14)} ${String(r.ms + 'ms').padEnd(8)} ${r.note}`);
  }
})();
