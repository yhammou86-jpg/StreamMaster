'use strict';

/**
 * Config codec.
 *
 * A Stremio addon is stateless: everything the server needs must travel in the
 * URL. We therefore serialise the user's configuration into a compact,
 * URL-safe blob that is prefixed onto the addon base URL.
 *
 *   d1<base64url(deflateRaw(json))>   default, ~90 bytes for a typical config
 *   e1<base64url(iv|tag|ciphertext)>  AES-256-GCM, enabled by CONFIG_SECRET
 *
 * The "e1" mode is the interesting one: it means a leaked URL does not leak the
 * user's TorBox API key in plaintext, and the config is opaque to anyone
 * sniffing the manifest URL. Set CONFIG_SECRET in your Vercel env to turn it on.
 */

const zlib = require('node:zlib');
const crypto = require('node:crypto');

function b64url(buf) {
  return Buffer.from(buf)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function unb64url(str) {
  let s = String(str).replace(/-/g, '+').replace(/_/g, '/');
  while (s.length % 4) s += '=';
  return Buffer.from(s, 'base64');
}

function secretKey() {
  const secret = process.env.CONFIG_SECRET;
  if (!secret || secret.length < 8) return null;
  return crypto.createHash('sha256').update(secret).digest();
}

function encode(config) {
  const json = Buffer.from(JSON.stringify(config), 'utf8');
  const raw = zlib.deflateRawSync(json, { level: 9 });
  const key = secretKey();
  if (!key) return 'd1' + b64url(raw);

  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const enc = Buffer.concat([cipher.update(raw), cipher.final()]);
  return 'e1' + b64url(Buffer.concat([iv, cipher.getAuthTag(), enc]));
}

function decode(blob) {
  if (!blob || typeof blob !== 'string') return null;
  const s = blob.trim();
  try {
    if (s.startsWith('e1')) {
      const key = secretKey();
      if (!key) return null;
      const buf = unb64url(s.slice(2));
      if (buf.length < 29) return null;
      const iv = buf.subarray(0, 12);
      const tag = buf.subarray(12, 28);
      const data = buf.subarray(28);
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAuthTag(tag);
      const out = Buffer.concat([decipher.update(data), decipher.final()]);
      return JSON.parse(zlib.inflateRawSync(out).toString('utf8'));
    }
    if (s.startsWith('d1')) {
      return JSON.parse(zlib.inflateRawSync(unb64url(s.slice(2))).toString('utf8'));
    }
    // Tolerate a raw base64url JSON blob (hand-written / legacy URLs).
    const raw = unb64url(s).toString('utf8');
    if (raw.trim().startsWith('{')) return JSON.parse(raw);
    return null;
  } catch {
    return null;
  }
}

module.exports = { encode, decode, b64url, unb64url };
