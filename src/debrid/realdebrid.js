'use strict';

/**
 * Real-Debrid client (API v1) — https://api.real-debrid.com/rest/1.0
 *
 * Status: beta. The flow follows the documented API, but it has not been
 * exercised against a live account. Everything is defensive: a failure returns
 * a clear error rather than a broken player.
 *
 * RD differs from TorBox in one important way: `unrestrict/link` takes a link
 * from the torrent's `links` array, not a file id. So we must select the exact
 * file we want *before* the links are generated, otherwise a multi-file torrent
 * hands back the wrong episode.
 */

const { request } = require('../http');
const cache = require('../cache');
const { magnet } = require('../trackers');

const BASE = 'https://api.real-debrid.com/rest/1.0';
const CHUNK = 20;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function call(path, key, { method = 'GET', form, timeout = 9000 } = {}) {
  const headers = { authorization: `Bearer ${key}` };
  let body;

  if (form) {
    body = new URLSearchParams(form).toString();
    headers['content-type'] = 'application/x-www-form-urlencoded';
    method = 'POST';
  }

  const res = await request(`${BASE}${path}`, { method, headers, body, timeout });

  if (!res.ok) {
    let detail = '';
    try {
      const j = JSON.parse(res.text);
      detail = j.error || j.error_code || '';
    } catch {
      /* non-JSON error body */
    }
    const err = new Error(`Real-Debrid ${res.status}${detail ? `: ${detail}` : ''}`);
    err.status = res.status;
    throw err;
  }

  try {
    return JSON.parse(res.text);
  } catch {
    throw new Error('Real-Debrid returned invalid JSON');
  }
}

/**
 * @returns {Promise<Set<string>>} lowercase infohashes that are instant
 */
async function checkCached(hashes, key) {
  const unique = [...new Set(hashes.filter((h) => /^[a-f0-9]{40}$/i.test(h)).map((h) => h.toUpperCase()))];
  const cached = new Set();
  if (!unique.length) return cached;

  for (let i = 0; i < unique.length; i += CHUNK) {
    const batch = unique.slice(i, i + CHUNK);
    try {
      const data = await call(`/torrents/instantAvailability/${batch.join('/')}`, key, {
        timeout: 8000,
      });
      for (const hash of batch) {
        const entry = data && data[hash];
        // `rd` is an array of file-maps; empty array means "not cached".
        if (entry && Array.isArray(entry.rd) && entry.rd.length > 0) {
          cached.add(hash.toLowerCase());
        }
      }
    } catch {
      // One bad batch must not invalidate the rest.
    }
  }
  return cached;
}

function pickFileId(files, hint) {
  if (!Array.isArray(files) || !files.length) return null;
  const videos = files.filter((f) => /\.(mkv|mp4|m4v|avi|mov|webm|ts|m2ts)$/i.test(f.path || ''));

  if (hint) {
    const h = hint.toLowerCase();
    const exact = files.find((f) => String(f.path || '').toLowerCase().includes(h));
    if (exact) return exact.id;
  }
  const pool = videos.length ? videos : files;
  return pool.slice().sort((a, b) => (b.bytes || 0) - (a.bytes || 0))[0].id;
}

async function resolve(key, hash, hint, opts = {}) {
  const allowUncached = !!opts.allowUncached;
  const cacheKey = `rd:${hash}:${key.slice(-10)}`;

  let rec = cache.get(cacheKey);
  if (!rec) {
    const added = await call('/torrents/addMagnet', key, {
      form: { magnet: magnet(hash, hint || 'video') },
      timeout: 12000,
    });
    if (!added || !added.id) throw new Error('Real-Debrid did not return a torrent id');

    let info = await call(`/torrents/info/${added.id}`, key, { timeout: 9000 });
    const fileId = pickFileId(info && info.files, hint);
    if (!fileId) {
      const err = new Error('Real-Debrid could not read the torrent file list yet.');
      err.status = 503;
      throw err;
    }

    await call(`/torrents/selectFiles/${added.id}`, key, { form: { files: String(fileId) } });

    const deadline = Date.now() + (allowUncached ? 12000 : 5000);
    while (Date.now() < deadline) {
      info = await call(`/torrents/info/${added.id}`, key, { timeout: 9000 });
      if (info && Array.isArray(info.links) && info.links.length) break;
      if (info && info.status === 'magnet_error') throw new Error('Real-Debrid rejected the magnet');
      await sleep(700);
    }

    if (!info || !info.links || !info.links.length) {
      const err = new Error('Real-Debrid is still preparing this file. Try again shortly.');
      err.status = 503;
      throw err;
    }

    rec = { id: added.id, link: info.links[0] };
    cache.set(cacheKey, rec, 45 * 60 * 1000);
  }

  const unlocked = await call('/unrestrict/link', key, {
    form: { link: rec.link },
    timeout: 12000,
  });
  if (!unlocked || !unlocked.download) throw new Error('Real-Debrid did not return a download link');
  return unlocked.download;
}

async function userInfo(key) {
  return call('/user', key, { timeout: 8000 });
}

module.exports = { checkCached, resolve, userInfo };
