'use strict';

const knaben = require('./knaben');
const yts = require('./yts');
const eztv = require('./eztv');
const solid = require('./solid');
const nyaa = require('./nyaa');
const apibay = require('./apibay');
const animetosho = require('./animetosho');
const therarbg = require('./therarbg');
const prowlarr = require('./prowlarr');

/** Order matters only for display priority when scores tie. */
const ALL = [knaben, yts, eztv, solid, nyaa, apibay, animetosho, therarbg, prowlarr];

const BY_ID = Object.fromEntries(ALL.map((p) => [p.id, p]));

module.exports = { ALL, BY_ID };
