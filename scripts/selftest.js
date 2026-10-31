'use strict';

/**
 * Self-test — `npm test`. No framework, no dependencies.
 *
 * Covers the pure logic (codec, config, parser, ranking) plus a live smoke test
 * of the HTTP handlers. Exits non-zero on failure so it can gate a deploy.
 */

const assert = require('node:assert');

const { encode, decode } = require('../src/codec');
const { normalize } = require('../src/config');
const { parseRelease, matchesEpisode } = require('../src/parse');
const { scoreItem, passesFilters } = require('../src/rank');
const { handleManifest, handleHealth, handleConfig } = require('../src/app');

let passed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed += 1;
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${name}\n`);
  } catch (err) {
    failures.push({ name, err });
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${name}\n      ${err.message}\n`);
  }
}

async function testAsync(name, fn) {
  try {
    await fn();
    passed += 1;
    process.stdout.write(`  \x1b[32m✓\x1b[0m ${name}\n`);
  } catch (err) {
    failures.push({ name, err });
    process.stdout.write(`  \x1b[31m✗\x1b[0m ${name}\n      ${err.message}\n`);
  }
}

/* ---------------------------------------------------------------- codec */
console.log('\ncodec');

test('round-trips a config', () => {
  const cfg = normalize({ key: 'abc123', mode: 'hybrid', max: 55 });
  const blob = encode(cfg);
  assert.ok(blob.startsWith('d1'), 'expected d1 prefix');
  assert.deepStrictEqual(decode(blob), cfg);
});

test('stays short enough for a URL', () => {
  const blob = encode(normalize({ key: 'x'.repeat(40) }));
  assert.ok(blob.length < 400, `blob was ${blob.length} chars`);
});

test('rejects garbage instead of throwing', () => {
  assert.strictEqual(decode('not-a-real-blob'), null);
  assert.strictEqual(decode(''), null);
  assert.strictEqual(decode(null), null);
});

test('encrypts when CONFIG_SECRET is set', () => {
  process.env.CONFIG_SECRET = 'test-secret-value';
  const cfg = normalize({ key: 'super-secret-key' });
  const blob = encode(cfg);
  assert.ok(blob.startsWith('e1'), 'expected e1 prefix');
  assert.ok(!blob.includes('super-secret'), 'key must not appear in plaintext');
  assert.deepStrictEqual(decode(blob), cfg);
  delete process.env.CONFIG_SECRET;
});

/* --------------------------------------------------------------- config */
console.log('\nconfig');

test('clamps out-of-range values', () => {
  const cfg = normalize({ max: 9999, minSeed: -40 });
  assert.strictEqual(cfg.max, 100);
  assert.strictEqual(cfg.minSeed, 0);
});

test('drops unknown providers and resolutions', () => {
  const cfg = normalize({ providers: { bogus: true }, res: ['8k'] });
  assert.strictEqual(cfg.providers.bogus, undefined);
  assert.deepStrictEqual(cfg.res, ['4k', '1080p', '720p', '480p']);
});

test('disables debrid-only mode without a key', () => {
  const cfg = normalize({ mode: 'debrid', key: '' });
  assert.strictEqual(cfg.mode, 'hybrid');
});

/* ---------------------------------------------------------------- parse */
console.log('\nrelease parser');

test('detects 4K REMUX', () => {
  const p = parseRelease('Inception.2010.2160p.UHD.BluRay.REMUX.HDR.HEVC.DTS-HD.MA.7.1-FGT');
  assert.strictEqual(p.resolution, '4k');
  assert.strictEqual(p.source, 'REMUX');
  assert.strictEqual(p.codec, 'x265');
  assert.strictEqual(p.hdr, true);
  assert.strictEqual(p.group, 'FGT');
});

test('detects season and episode', () => {
  const p = parseRelease('Breaking.Bad.S01E01.1080p.WEB.h264-EDITH');
  assert.strictEqual(p.season, 1);
  assert.strictEqual(p.episode, 1);
  assert.strictEqual(p.source, 'WEB');
});

test('flags CAM rips', () => {
  assert.strictEqual(parseRelease('Movie.2024.CAM.1080p.x264').isCam, true);
  assert.strictEqual(parseRelease('Movie.2024.HDCAM.x264').isCam, true);
});

test('matches episodes correctly', () => {
  const ep = parseRelease('Show.S02E05.720p.HDTV.x264-GROUP');
  assert.strictEqual(matchesEpisode(ep, 2, 5), true);
  assert.strictEqual(matchesEpisode(ep, 2, 6), false);
  assert.strictEqual(matchesEpisode(ep, 3, 5), false);
});

/* ---------------------------------------------------------------- rank */
console.log('\nranking');

const cfg = normalize({ mode: 'p2p' });

function item(name, seeders, size = 2e9) {
  const parsed = parseRelease(name);
  return { infoHash: 'a'.repeat(40), title: name, size, seeders, parsed, cached: false, score: 0 };
}

test('4K outranks 1080p at similar seed counts', () => {
  const a = item('Movie.2024.2160p.WEB-DL.x265', 50);
  const b = item('Movie.2024.1080p.WEB-DL.x265', 50);
  assert.ok(scoreItem(a, cfg) > scoreItem(b, cfg));
});

test('a 1-seeder 4K does not beat a healthy 1080p', () => {
  const a = item('Movie.2024.2160p.WEB-DL.x265', 1);
  const b = item('Movie.2024.1080p.WEB-DL.x264', 90);
  assert.ok(scoreItem(b, cfg) > scoreItem(a, cfg), 'liveness penalty failed');
});

test('cached beats everything', () => {
  const a = item('Movie.2024.720p.HDTV.x264', 0);
  a.cached = true;
  const b = item('Movie.2024.2160p.REMUX.x265', 500);
  assert.ok(scoreItem(a, cfg) > scoreItem(b, cfg));
});

test('filters CAM when asked', () => {
  const cam = item('Movie.2024.CAM.1080p.x264', 900);
  assert.strictEqual(passesFilters(cam, normalize({ noCam: true })), false);
  assert.strictEqual(passesFilters(cam, normalize({ noCam: false })), true);
});

test('filters by resolution', () => {
  const r720 = item('Movie.2024.720p.WEB-DL.x264', 50);
  assert.strictEqual(passesFilters(r720, normalize({ res: ['1080p'] })), false);
});

/* ------------------------------------------------------------ handlers */
console.log('\nhandlers');

const headers = { host: 'hydra.test', 'x-forwarded-proto': 'https' };

test('manifest is valid Stremio JSON', () => {
  const res = handleManifest({}, headers);
  assert.strictEqual(res.status, 200);
  const m = JSON.parse(res.body);
  assert.strictEqual(m.id, 'community.hydrastream');
  assert.deepStrictEqual(m.resources, ['stream']);
  assert.deepStrictEqual(m.types, ['movie', 'series']);
  assert.deepStrictEqual(m.idPrefixes, ['tt']);
  assert.ok(m.logo.startsWith('https://hydra.test'));
});

test('health lists every provider', () => {
  const body = JSON.parse(handleHealth().body);
  assert.strictEqual(body.ok, true);
  assert.ok(body.providers.length >= 10);
});

test('config endpoint encodes a blob', async () => {
  const res = await handleConfig({ body: { action: 'encode', config: { mode: 'p2p' } } });
  const body = JSON.parse(res.body);
  assert.strictEqual(body.ok, true);
  assert.ok(decode(body.blob));
});

/* ---------------------------------------------------------------- live */
console.log('\nlive scrape (network)');

testAsync('returns real streams for a known movie', async () => {
  const blob = encode(normalize({ mode: 'p2p', providers: { knaben: true, yts: true } }));
  const res = await require('../src/app').handleStream({ c: blob, type: 'movie', id: 'tt1375666' }, headers);
  const body = JSON.parse(res.body);
  assert.ok(Array.isArray(body.streams), 'streams must be an array');
  assert.ok(body.streams.length > 0, 'expected at least one stream');
  for (const s of body.streams) {
    assert.ok(s.name && s.title, 'stream needs name + title');
    assert.ok(s.url || s.infoHash, 'stream needs url or infoHash');
  }
});

/* -------------------------------------------------------------- report */
const total = passed + failures.length;
console.log(`\n${failures.length ? '\x1b[31m' : '\x1b[32m'}${passed}/${total} passed\x1b[0m\n`);
if (failures.length) process.exit(1);
