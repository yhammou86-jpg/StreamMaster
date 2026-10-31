'use strict';

/**
 * Trackers handed to the client for P2P playback.
 *
 * The addon never touches the swarm itself — it just returns an infohash plus a
 * tracker list and lets Stremio's built-in streaming server (or Nuvio's P2P
 * engine) do the work. Zero bandwidth cost, and it keeps us inside every host's
 * free tier.
 */

const TRACKERS = [
  'udp://tracker.opentrackr.org:1337/announce',
  'udp://open.tracker.cl:1337/announce',
  'udp://open.demonii.com:1337/announce',
  'udp://tracker.openbittorrent.com:6969/announce',
  'udp://exodus.desync.com:6969/announce',
  'udp://tracker.torrent.eu.org:451/announce',
  'udp://tracker.moeking.me:6969/announce',
  'udp://explodie.org:6969/announce',
  'udp://tracker1.bt.moack.co.kr:80/announce',
  'udp://tracker.theoks.net:6969/announce',
  'udp://tracker.dler.org:6969/announce',
  'udp://opentracker.i2p.rocks:6969/announce',
  'udp://p4p.arenabg.com:1337/announce',
  'https://tracker.tamersunion.org:443/announce',
];

function sources(extra) {
  const list = extra && extra.length ? extra : TRACKERS;
  return list.map((t) => `tracker:${t}`);
}

function magnet(infoHash, name, extra) {
  const dn = encodeURIComponent(name || 'video');
  const tr = (extra && extra.length ? extra : TRACKERS)
    .map((t) => `&tr=${encodeURIComponent(t)}`)
    .join('');
  return `magnet:?xt=urn:btih:${infoHash}&dn=${dn}${tr}`;
}

module.exports = { TRACKERS, sources, magnet };
