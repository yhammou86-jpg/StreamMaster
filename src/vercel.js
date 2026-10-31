'use strict';

/** Shared glue for the Vercel function wrappers. */

function first(value) {
  return Array.isArray(value) ? value[0] : value;
}

function flat(query) {
  const out = {};
  for (const [k, v] of Object.entries(query || {})) out[k] = first(v);
  return out;
}

function send(res, result) {
  res.status(result.status || 200);
  for (const [k, v] of Object.entries(result.headers || {})) {
    try {
      res.setHeader(k, v);
    } catch {
      /* ignore invalid header */
    }
  }
  res.send(result.body === undefined ? '' : result.body);
}

function allowOptions(req, res) {
  if (req.method === 'OPTIONS') {
    res.status(204);
    res.setHeader('access-control-allow-origin', '*');
    res.setHeader('access-control-allow-methods', 'GET,POST,OPTIONS');
    res.setHeader('access-control-allow-headers', '*');
    res.end();
    return true;
  }
  return false;
}

module.exports = { first, flat, send, allowOptions };
