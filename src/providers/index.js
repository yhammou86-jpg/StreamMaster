'use strict';

const knaben = require('./knaben');
const yts = require('./yts');
const eztv = require('./eztv');
const bitsearch = require('./bitsearch');
const nyaa = require('./nyaa');
const apibay = require('./apibay');
const animetosho = require('./animetosho');
const therarbg = require('./therarbg');
const prowlarr = require('./prowlarr');
const torznab = require('./torznab');

/** Order matters only for display priority when scores tie. */
const ALL = [knaben, yts, eztv, bitsearch, nyaa, apibay, animetosho, therarbg, prowlarr, torznab];

const BY_ID = Object.fromEntries(ALL.map((p) => [p.id, p]));

module.exports = { ALL, BY_ID };
