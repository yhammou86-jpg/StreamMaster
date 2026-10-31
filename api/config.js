'use strict';

const { handleConfig } = require('../src/app');
const { flat, send, allowOptions } = require('../src/vercel');

module.exports = async (req, res) => {
  if (allowOptions(req, res)) return;
  try {
    const body = req.method === 'POST' ? req.body : null;
    send(res, await handleConfig({ query: flat(req.query), body }));
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err && err.message) });
  }
};
