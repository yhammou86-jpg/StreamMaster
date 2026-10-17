require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { getRouter } = require('stremio-addon-sdk');
const addonInterface = require('./addon');

const port = process.env.PORT || 7000;
const host = process.env.HOST || '127.0.0.1';

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// In-memory config store (you can replace with database)
let userConfigs = new Map();

// API endpoint to save configuration
app.post('/api/config', (req, res) => {
  try {
    const { apiKey, service, scrapers, minSeeders, cacheTTL } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const encodedKey = Buffer.from(apiKey).toString('base64');

    userConfigs.set(encodedKey, {
      apiKey,
      service: service || 'stremio',
      scrapers: scrapers || ['1337x', 'thepiratebay'],
      minSeeders: minSeeders || 5,
      cacheTTL: cacheTTL || 3600,
      createdAt: new Date().toISOString()
    });

    res.json({ success: true, encodedKey });
  } catch (error) {
    console.error('Config save error:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

// API endpoint to get configuration
app.get('/api/config', (req, res) => {
  // Return default empty config for initial load
  res.json({
    apiKey: '',
    service: 'stremio',
    scrapers: ['1337x', 'thepiratebay'],
    minSeeders: 5,
    cacheTTL: 3600
  });
});

// Serve configuration page at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Serve manifest with encoded API key
app.get('/:encodedKey/manifest.json', (req, res) => {
  const { encodedKey } = req.params;
  const config = userConfigs.get(encodedKey);

  if (!config) {
    return res.status(404).json({ error: 'Configuration not found' });
  }

  const manifest = {
    id: 'com.torbox.stremio',
    version: '1.0.0',
    name: 'Torbox Stremio Addon',
    description: 'Stream torrents and usenet content via Torbox',
    resources: ['stream'],
    types: ['movie', 'series'],
    catalogs: [],
    idPrefixes: ['tt'],
    behaviorHints: {
      configurable: false,
      configurationRequired: false
    }
  };

  res.json(manifest);
});

// Mount Stremio addon routes with encoded key
app.use('/:encodedKey', (req, res, next) => {
  const { encodedKey } = req.params;
  const config = userConfigs.get(encodedKey);

  if (!config) {
    return res.status(404).json({ error: 'Configuration not found' });
  }

  // Attach config to request
  req.userConfig = config;
  next();
}, getRouter(addonInterface));

// Fallback for default manifest (if .env is configured)
if (process.env.TORBOX_API_KEY) {
  app.use('/', getRouter(addonInterface));
}

// Start server
app.listen(port, host, () => {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('  💓 StreamPulse is running!');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
  console.log(`  🌐 Web UI:     http://${host}:${port}`);
  console.log(`  📡 Server:     http://${host}:${port}`);
  console.log('');
  console.log('  💓 Feel the Pulse:');
  console.log(`  1. Open http://${host}:${port} in your browser`);
  console.log(`  2. Enter your debrid API keys`);
  console.log(`  3. Click "Install in Stremio" or copy manifest URL`);
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n\nShutting down gracefully...');
  process.exit(0);
});
