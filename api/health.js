'use strict';

const { handleHealth } = require('../src/app');
const { send, allowOptions } = require('../src/vercel');

module.exports = async (req, res) => {
  if (allowOptions(req, res)) return;
  send(res, handleHealth());
};
