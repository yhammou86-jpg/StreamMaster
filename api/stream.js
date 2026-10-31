'use strict';

const { handleStream } = require('../src/app');
const { flat, send, allowOptions } = require('../src/vercel');

module.exports = async (req, res) => {
  if (allowOptions(req, res)) return;
  try {
    send(res, await handleStream(flat(req.query), req.headers));
  } catch (err) {
    // Never surface a 500 to the player: an empty list degrades gracefully.
    res.status(200).json({ streams: [], error: String(err && err.message) });
  }
};
