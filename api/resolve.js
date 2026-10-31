'use strict';

const { handleResolve } = require('../src/app');
const { flat, send, allowOptions } = require('../src/vercel');

module.exports = async (req, res) => {
  if (allowOptions(req, res)) return;
  try {
    send(res, await handleResolve(flat(req.query)));
  } catch (err) {
    res.status(502).send(`Hydra resolve error: ${String(err && err.message)}`);
  }
};
