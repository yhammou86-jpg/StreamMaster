'use strict';

/**
 * Source health telemetry.
 *
 * Public trackers fail constantly and asymmetrically — a source that is dead
 * from a Hetzner box may be fine from AWS. Rather than guess, Hydra records how
 * every provider actually behaved and surfaces it, so users can see which
 * sources work *for them* and switch the dead ones off.
 *
 * Per-instance and in-memory: this is a diagnostic, not a database.
 */

const MAX_SAMPLES = 40;

const stats = new Map();

function blank(id) {
  return { id, ok: 0, fail: 0, empty: 0, results: 0, totalMs: 0, lastOk: 0, lastError: '' };
}

function record(id, { ok, ms, count, error }) {
  let s = stats.get(id);
  if (!s) {
    s = blank(id);
    stats.set(id, s);
  }
  s.totalMs += Number(ms) || 0;
  if (ok) {
    s.ok += 1;
    s.lastOk = Date.now();
    s.results += Number(count) || 0;
    if (!count) s.empty += 1;
  } else {
    s.fail += 1;
    s.lastError = String(error || 'failed').slice(0, 120);
  }
  if (s.ok + s.fail > MAX_SAMPLES) {
    // Decay so a provider that recovered is not punished forever.
    s.ok = Math.round(s.ok * 0.9);
    s.fail = Math.round(s.fail * 0.9);
    s.totalMs = Math.round(s.totalMs * 0.9);
  }
}

function snapshot() {
  const out = [];
  for (const s of stats.values()) {
    const calls = s.ok + s.fail;
    out.push({
      id: s.id,
      calls,
      ok: s.ok,
      fail: s.fail,
      empty: s.empty,
      results: s.results,
      avgMs: calls ? Math.round(s.totalMs / calls) : 0,
      successRate: calls ? Math.round((s.ok / calls) * 100) : null,
      lastOk: s.lastOk || null,
      lastError: s.lastError || null,
    });
  }
  return out.sort((a, b) => (b.successRate ?? -1) - (a.successRate ?? -1));
}

module.exports = { record, snapshot };
