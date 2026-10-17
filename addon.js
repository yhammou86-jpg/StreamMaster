const { addonBuilder, serveHTTP } = require('stremio-addon-sdk');
const TorboxClient = require('./torbox/client');
const ScraperManager = require('./scrapers');
const NodeCache = require('node-cache');

// Initialize cache
const cache = new NodeCache({
  stdTTL: parseInt(process.env.CACHE_TTL) || 3600,
  checkperiod: parseInt(process.env.CACHE_CHECK_PERIOD) || 600
});

// Helper to get or create Torbox client
function getTorboxClient(apiKey) {
  const key = apiKey || process.env.TORBOX_API_KEY;
  if (!key) return null;
  return new TorboxClient(key, process.env.TORBOX_API_URL);
}

// Helper to get or create scraper manager
function getScraperManager() {
  return new ScraperManager();
}

// Addon manifest
const manifest = {
  id: 'com.streampulse.stremio',
  version: '1.0.0',
  name: process.env.ADDON_NAME || 'StreamPulse',
  description: process.env.ADDON_DESCRIPTION || 'Feel the pulse of unlimited streaming - 6 debrid services, 15+ scrapers, Jackett integration',

  resources: ['stream', 'catalog', 'meta'],
  types: ['movie', 'series'],

  catalogs: [
    {
      type: 'movie',
      id: 'streampulse-movie',
      name: 'StreamPulse Movies',
      extra: [{ name: 'skip', isRequired: false }]
    },
    {
      type: 'series',
      id: 'streampulse-series',
      name: 'StreamPulse Series',
      extra: [{ name: 'skip', isRequired: false }]
    }
  ],

  idPrefixes: ['tt'],

  behaviorHints: {
    configurable: true,
    configurationRequired: false
  }
};

const builder = new addonBuilder(manifest);

/**
 * Stream handler - provides stream links for content
 */
builder.defineStreamHandler(async ({ type, id, config }) => {
  try {
    // Get user config from request (if using web UI) or fall back to env
    const userConfig = config?.userConfig || {};
    const apiKey = userConfig.apiKey || process.env.TORBOX_API_KEY;
    const p2pMode = userConfig.p2pMode || process.env.P2P_MODE === 'true';

    // If P2P mode is enabled and no API key, still allow P2P streaming
    if (!apiKey && !p2pMode) {
      console.log('[No API Key] Enable P2P mode or add API key');
      return { streams: [] };
    }

    const cacheKey = `stream:${type}:${id}:${Buffer.from(apiKey).toString('base64').substring(0, 8)}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      if (process.env.DEBUG === 'true') {
        console.log(`[Cache Hit] ${cacheKey}`);
      }
      return { streams: cached };
    }

    // Parse IMDb ID and extract season/episode for series
    const imdbMatch = id.match(/^(tt\d+)(?::(\d+):(\d+))?$/);
    if (!imdbMatch) {
      return { streams: [] };
    }

    const [, imdbId, season, episode] = imdbMatch;

    console.log(`[Stream Request] ${type} ${imdbId}${season ? ` S${season}E${episode}` : ''}`);

    // Initialize clients with user config
    const torboxClient = getTorboxClient(apiKey);
    const scraperManager = getScraperManager();

    // Search for torrents
    const searchOptions = {
      minSeeders: userConfig.minSeeders || 5,
      maxResults: 50
    };

    const torrents = await scraperManager.searchByImdb(
      imdbId,
      season ? parseInt(season) : null,
      episode ? parseInt(episode) : null
    );

    if (torrents.length === 0) {
      console.log(`[No Results] ${imdbId}`);
      return { streams: [] };
    }

    // Extract info hashes
    const hashes = torrents.map(t => t.infoHash).filter(Boolean);

    // Check which torrents are cached on Torbox (only if API key is provided)
    let cachedTorrents = [];
    if (apiKey && torboxClient) {
      try {
        const cachedResult = await torboxClient.checkCached(hashes);
        cachedTorrents = cachedResult.data || [];
      } catch (error) {
        console.error('[Torbox] Failed to check cached:', error.message);
      }
    }

    // Build stream objects with P2P mode support
    const streams = await buildStreams(torrents, cachedTorrents, p2pMode);

    // Cache based on user config TTL
    const ttl = userConfig.cacheTTL || parseInt(process.env.CACHE_TTL) || 3600;
    cache.set(cacheKey, streams, ttl);

    return { streams };
  } catch (error) {
    console.error('[Stream Handler Error]:', error);
    return { streams: [] };
  }
});

/**
 * Build stream objects from torrents
 */
async function buildStreams(torrents, cachedTorrents, p2pMode = false) {
  const streams = [];

  for (const torrent of torrents) {
    const isCached = cachedTorrents.some(
      hash => hash.toLowerCase() === torrent.infoHash.toLowerCase()
    );

    // Build different streams based on mode
    if (p2pMode) {
      // P2P mode - direct magnet links for WebTorrent/torrent clients
      streams.push({
        name: 'Torbox',
        title: `🔗 P2P | ${formatStreamTitle(torrent, false)}`,
        infoHash: torrent.infoHash,
        sources: [`tracker:${torrent.infoHash}`],
        behaviorHints: {
          bingeGroup: `torbox-p2p-${torrent.infoHash}`,
          notWebReady: false // P2P works in web
        }
      });
    }

    // Debrid mode (if cached or has API key)
    if (isCached || !p2pMode) {
      const stream = {
        name: 'Torbox',
        title: formatStreamTitle(torrent, isCached),
        url: torrent.magnet,
        infoHash: torrent.infoHash,
        behaviorHints: {
          bingeGroup: `torbox-${torrent.infoHash}`,
          notWebReady: !isCached
        }
      };

      if (isCached) {
        stream.externalUrl = `https://torbox.app/torrent/${torrent.infoHash}`;
      }

      streams.push(stream);
    }
  }

  return streams;
}

/**
 * Format stream title with quality and metadata
 */
function formatStreamTitle(torrent, isCached) {
  const parts = [];

  parts.push(`📦 ${torrent.quality}`);

  if (isCached) {
    parts.push('⚡ Cached');
  }

  parts.push(`👤 ${torrent.seeders}`);

  if (torrent.size) {
    parts.push(`💾 ${torrent.size}`);
  }

  parts.push(`🔗 ${torrent.source}`);

  return parts.join(' | ');
}

/**
 * Catalog handler - returns empty for now (can be extended)
 */
builder.defineCatalogHandler(async ({ type, id, extra }) => {
  return { metas: [] };
});

/**
 * Meta handler - returns empty (Stremio will use its own meta)
 */
builder.defineMetaHandler(async ({ type, id }) => {
  return { meta: {} };
});

module.exports = builder.getInterface();
