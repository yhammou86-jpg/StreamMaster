# Torbox Stremio Addon - Web Configuration

## 🌐 Web-Based Setup (Recommended)

The easiest way to get started is using the web configuration interface!

### Quick Start

1. **Start the server:**
   ```bash
   npm install
   npm start
   ```

2. **Open the web UI:**
   ```
   http://localhost:7000
   ```

3. **Configure your addon:**
   - Enter your Torbox API key
   - Choose your scrapers
   - Adjust settings (optional)
   - Click "Save Configuration"

4. **Install in Stremio:**
   - Click "Install in Stremio" button (Direct Install)
   - OR copy the Manifest URL and paste it in Stremio
   - OR download the configuration file for self-hosting

## Web UI Features

### Step 1: Installation Method

**Direct Install** (Easiest)
- Select your streaming service (Stremio/Kodi)
- Click one button to install
- Opens directly in your app

**Manifest URL** (Manual)
- Copy the generated manifest URL
- Paste into Stremio manually
- Good for troubleshooting

**Download Config** (Self-Hosted)
- Downloads a `.env` file with your settings
- Use for running your own server
- Full control over configuration

### Step 2: Torbox Configuration

- Enter your Torbox API key
- Get your key from [torbox.app](https://torbox.app) → Settings → API
- Configuration is saved securely

### Step 3: Advanced Settings (Optional)

**Enabled Scrapers:**
- ✅ 1337x
- ✅ The Pirate Bay
- ⬜ RARBG (coming soon)
- ⬜ TorrentGalaxy (coming soon)

**Minimum Seeders:**
- Filter out torrents with low availability
- Default: 5 seeders

**Cache Duration:**
- How long to cache search results
- Default: 3600 seconds (1 hour)

## How It Works

1. You configure your API key through the web interface
2. Each configuration gets a unique manifest URL
3. This URL is tied to your specific settings
4. Stremio uses this URL to fetch streams with your configuration

## No API Key? No Problem!

If you don't have a Torbox API key yet:
1. Visit [torbox.app](https://torbox.app)
2. Create a free account
3. Go to Settings → API
4. Copy your API key
5. Paste it in the web UI

## Troubleshooting

### "Configuration not found" error
- Make sure you saved your configuration first
- The manifest URL changes if you update settings
- Re-copy the URL after any changes

### Can't access web UI
- Check if port 7000 is available
- Try changing PORT in `.env` file
- Make sure the server is running (`npm start`)

### Direct Install not working
- Make sure Stremio is installed
- Try the Manifest URL method instead
- Check browser popup blockers

## Screenshots

The web interface includes:
- 🎨 Modern dark theme (similar to Duck Streams)
- 📱 Mobile responsive design
- ⚡ Real-time configuration updates
- 📋 One-click copy for manifest URLs
- 💾 Download configuration option

---

For more details, see the main [README.md](README.md)
