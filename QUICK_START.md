# Quick Start Guide

Get your Torbox Stremio addon running in 5 minutes!

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Configure Your API Key

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Get your Torbox API key:
   - Go to https://torbox.app
   - Log in to your account
   - Navigate to Settings → API
   - Copy your API key

3. Edit `.env` and paste your API key:
   ```env
   TORBOX_API_KEY=your_actual_api_key_here
   ```

## Step 3: Start the Server

```bash
npm start
```

You should see this output:
```
═══════════════════════════════════════════════════
  🚀 Torbox Stremio Addon is running!
═══════════════════════════════════════════════════

  📡 Server:     http://127.0.0.1:7000
  🔗 Manifest:   http://127.0.0.1:7000/manifest.json
```

## Step 4: Add to Stremio

1. **Open Stremio** on your device
2. Click the **puzzle icon** (Addons) in the top right
3. Click **"Community Add-ons"** at the top
4. In the addon URL field, paste:
   ```
   http://127.0.0.1:7000/manifest.json
   ```
5. Click **Install**

## Step 5: Start Streaming!

1. Browse for any movie or TV show in Stremio
2. Click on it to view details
3. Scroll down to see available streams
4. Look for streams from "Torbox" with the ⚡ icon (cached = instant streaming)
5. Click play and enjoy!

## Tips

- **⚡ Cached streams** are instantly available
- **Higher seeders (👤)** usually mean better availability
- **Quality indicator (📦)** shows 4K, 1080p, 720p, etc.
- The addon will automatically scrape multiple sources

## Troubleshooting

### No streams appear?
- Wait a few seconds for scraping to complete
- Enable debug mode: set `DEBUG=true` in `.env` and restart
- Check console output for errors

### Port 7000 already in use?
- Change `PORT=7000` to another number in `.env` (e.g., `PORT=8000`)
- Update the manifest URL in Stremio accordingly

### API key not working?
- Double-check you copied it correctly (no extra spaces)
- Verify your Torbox account is active
- Generate a new API key if needed

## Next Steps

- Read the full [README.md](README.md) for advanced configuration
- Customize which scrapers to use via `ENABLED_SCRAPERS` in `.env`
- Adjust cache duration with `CACHE_TTL` for better performance

---

**Happy streaming! 🎬**
