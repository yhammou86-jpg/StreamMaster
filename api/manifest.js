'use strict';

const { handleManifest } = require('../src/app');
const { flat, send, allowOptions } = require('../src/vercel');

module.exports = async (req, res) => {
  if (allowOptions(req, res)) return;
  try {
    send(res, handleManifest(flat(req.query), req.headers));
  } catch (err) {
    res.status(500).json({ error: String(err && err.message) });
  }
};
