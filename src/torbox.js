'use strict';

/**
 * TorBox API client — written against the official OpenAPI spec
 * (https://api.torbox.app/openapi.json).
 *
 * Three calls matter for streaming:
 *   checkcached  -> one request, up to 100 hashes, tells us what is instant
 *   createtorrent-> registers a magnet in the user's account (instant if cached)
 *   requestdl    -> mints a direct HTTPS link for a single file
 *
 * Only `checkcached` happens while building the stream list. `createtorrent`
 * and `requestdl` are deferred to the moment the user presses play, which keeps
 * the listing fast and avoids polluting the account with 40 dead torrents.
 */

const { request, json } = require('./http');

const BASE = 'https://api.torbox.app/v1/api';
const VIDEO_EXT = /\.(mkv|mp4|m4v|avi|mov|webm|ts|m2ts|mpg|mpeg|wmv|flv)$/i;

function authHeaders(key) {
  return { authorization: `Bearer ${key}` };
}

/** Minimal multipart encoder (no dependencies). */
function multipart(fields) {
  const boundary = `----Hydra${Date.now().toString(16)}${Math.random().toString(16).slice(2)}`;
  const parts = [];
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    parts.push(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${String(value)}\r\n`
    );
  }
  parts.push(`--${boundary}--\r\n`);
  return {
    body: Buffer.from(parts.join(''), 'utf8'),
    contentType: `multipart/form-data; boundary=${boundary}`,
  };
}

async function call(path, key, { method = 'GET', timeout = 9000, fields } = {}) {
  const headers = authHeaders(key);
  let body;

  if (fields) {
    const mp = multipart(fields);
    body = mp.body;
    headers['content-type'] = mp.contentType;
    method = 'POST';
  }

  const res = await request(`${BASE}${path}`, { method, headers, body, timeout });
  if (!res.ok) {
    const err = new Error(`TorBox HTTP ${res.status}`);
    err.status = res.status;
    throw err;
  }
  let parsed;
  try {
    parsed = JSON.parse(res.text);
  } catch {
    throw new Error('TorBox returned invalid JSON');
  }
  if (parsed && parsed.success === false) {
    const err = new Error(parsed.detail || parsed.error || 'TorBox request failed');
    err.code = parsed.error;
    throw err;
  }
  return parsed ? parsed.data : null;
}

/**
 * Batch cache probe.
 * @param {string[]} hashes lowercase infohashes (max ~100 per call)
 * @param {string} key TorBox API key
 * @returns {Promise<Set<string>>} set of cached hashes
 */
async function checkCached(hashes, key) {
  const unique = [...new Set(hashes.filter((h) => /^[a-f0-9]{40}$/.test(h)))].slice(0, 100);
  if (!unique.length) return new Set();

  const qs = unique.map((h) => `hash=${h}`).join('&');
  const data = await call(`/torrents/checkcached?${qs}&format=list&list_files=false`, key, {
    timeout: 8000,
  });

  const cached = new Set();
  if (!data) return cached;

  // The API has returned several shapes over time; accept all of them.
  if (Array.isArray(data)) {
    for (const entry of data) {
      if (typeof entry === 'string') cached.add(entry.toLowerCase());
      else if (entry && entry.hash) cached.add(String(entry.hash).toLowerCase());
    }
  } else if (typeof data === 'object') {
    for (const [hash, info] of Object.entries(data)) {
      if (info) cached.add(hash.toLowerCase());
    }
  }
  return cached;
}

/** Register a magnet. Returns the TorBox torrent id. */
async function createTorrent(key, magnet, { cachedOnly = false } = {}) {
  const data = await call('/torrents/createtorrent', key, {
    timeout: 12000,
    fields: {
      magnet,
      add_only_if_cached: cachedOnly ? 'true' : 'false',
      allow_zip: 'false',
      as_queued: 'false',
    },
  });
  const id = data && (data.torrent_id ?? data.torrentId ?? data.id);
  if (!id) throw new Error('TorBox did not return a torrent id');
  return { id, hash: data.hash };
}

async function getTorrent(key, id) {
  const data = await call(`/torrents/mylist?id=${encodeURIComponent(id)}&bypass_cache=true`, key, {
    timeout: 9000,
  });
  if (Array.isArray(data)) return data[0] || null;
  if (data && Array.isArray(data.torrents)) return data.torrents[0] || null;
  return data || null;
}

/**
 * Pick the file the user actually wants to watch.
 * For episodes, prefer a filename matching the requested SxxExx.
 */
function pickFile(files, hint) {
  if (!Array.isArray(files) || !files.length) return null;
  const videos = files.filter((f) => VIDEO_EXT.test(f.name || f.short_name || ''));
  const pool = videos.length ? videos : files;

  if (hint) {
    const h = hint.toLowerCase();
    const exact = pool.find((f) => String(f.name || '').toLowerCase().includes(h));
    if (exact) return exact;
  }
  return pool.slice().sort((a, b) => (Number(b.size) || 0) - (Number(a.size) || 0))[0];
}

async function requestDownload(key, torrentId, fileId) {
  const data = await call(
    `/torrents/requestdl?token=${encodeURIComponent(key)}&torrent_id=${encodeURIComponent(
      torrentId
    )}&file_id=${encodeURIComponent(fileId)}`,
    key,
    { timeout: 12000 }
  );
  const url = typeof data === 'string' ? data : data && (data.url || data.link);
  if (!url) throw new Error('TorBox did not return a download link');
  return url;
}

async function userInfo(key) {
  return call('/user/me', key, { timeout: 8000 });
}

module.exports = {
  checkCached,
  createTorrent,
  getTorrent,
  pickFile,
  requestDownload,
  userInfo,
};
