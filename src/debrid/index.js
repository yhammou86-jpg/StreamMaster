'use strict';

/**
 * Debrid provider abstraction.
 *
 * Every service is reduced to two operations, which is all a stream addon
 * actually needs:
 *
 *   checkCached(key, hashes)  -> Set<infohash>  (which are instant)
 *   resolve(key, hash, hint)  -> string         (a direct HTTPS URL)
 *
 * Adding a service means writing those two functions. TorBox is verified
 * end-to-end; Real-Debrid follows the documented v1 API and is marked beta in
 * the UI because it could not be exercised without a live account.
 */

const torbox = require('./torbox');
const realdebrid = require('./realdebrid');

const SERVICES = {
  torbox: {
    id: 'torbox',
    name: 'TorBox',
    status: 'stable',
    signup: 'https://torbox.app/subscription',
    keys: 'https://torbox.app/settings',
    maxHashes: 100,
    ...torbox,
  },
  realdebrid: {
    id: 'realdebrid',
    name: 'Real-Debrid',
    status: 'beta',
    signup: 'https://real-debrid.com/?id=hydra',
    keys: 'https://real-debrid.com/apitoken',
    maxHashes: 40,
    ...realdebrid,
  },
};

const ORDER = ['torbox', 'realdebrid'];

function get(id) {
  return SERVICES[id] || SERVICES.torbox;
}

function list() {
  return ORDER.map((id) => {
    const s = SERVICES[id];
    return { id: s.id, name: s.name, status: s.status, signup: s.signup, keys: s.keys };
  });
}

module.exports = { get, list, SERVICES };
