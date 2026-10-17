# 💓 StreamPulse - Feel the Pulse of Unlimited Streaming

<div align="center">

![StreamPulse Logo](https://via.placeholder.com/150x150/FF1493/FFFFFF?text=💓+SP)

**The Ultimate All-in-One Stremio Addon**

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](https://github.com/yourusername/streampulse-addon)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Stremio](https://img.shields.io/badge/Stremio-Compatible-purple.svg)](https://stremio.com)

*Where every heartbeat brings unlimited entertainment*

[Features](#-features) • [Quick Start](#-quick-start) • [Installation](#-installation) • [Documentation](#-documentation)

</div>

---

## 💓 What is StreamPulse?

**StreamPulse** is the most comprehensive Stremio addon ever created, combining the power of **every major streaming solution** into one seamless experience.

### The Pulse of Streaming
Like a heartbeat that keeps everything alive, StreamPulse keeps your entertainment flowing with:
- **6 Debrid Services** - RealDebrid, AllDebrid, Premiumize, Torbox, DebridLink, Put.io
- **15+ Direct Scrapers** - Maximum content discovery
- **Jackett/Prowlarr** - Private tracker access
- **P2P Mode** - Stream without debrid services
- **Smart AI Ranking** - Best quality, always

---

## 🚀 Features

### 🌟 Multi-Debrid Support
Connect **all your debrid accounts** simultaneously:
- ✅ **RealDebrid** - Most popular
- ✅ **AllDebrid** - Great alternative  
- ✅ **Premiumize** - Premium quality
- ✅ **Torbox** - Fast & reliable
- ✅ **DebridLink** - European friendly
- ✅ **Put.io** - Cloud storage

**Why it matters:** StreamPulse checks ALL services for cached content, giving you 6x more instant streams!

### 🎯 15+ Powerful Scrapers
- **Movies**: 1337x, The Pirate Bay, TorrentGalaxy, RARBG, YTS
- **TV Shows**: EZTV, specialized trackers
- **Anime**: Nyaa, dedicated sources
- **General**: LimeTorrents, Zooqle, Torrentz2, TorrentDownloads
- **And more...**

### 🔧 Jackett & Prowlarr Integration
Access **1000+ indexers** including:
- Private trackers
- Scene releases
- Exclusive content
- High-quality verified torrents

### 💎 Revolutionary Features
- **🤖 AI Quality Ranking** - Smart algorithm scores every torrent
- **⚡ Instant Availability** - Checks all debrid services simultaneously
- **🔄 Auto Fallback** - Switches sources automatically on failure
- **💬 Auto Subtitles** - Fetches from OpenSubtitles
- **🔗 P2P Mode** - Stream without any debrid service
- **📊 Real-Time Stats** - Live monitoring dashboard
- **🎨 Premium UI** - Beautiful glassmorphism design

---

## ⚡ Quick Start

### 1. Install Node.js
Download from [nodejs.org](https://nodejs.org) (LTS version)

### 2. Clone or Download
```bash
git clone https://github.com/yourusername/streampulse-addon.git
cd streampulse-addon
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Configure
```bash
cp .env.example .env
```
Edit `.env` and add your API keys (optional for P2P mode)

### 5. Start Server
```bash
npm start
```

### 6. Add to Stremio
Open Stremio and install using: `http://localhost:7000/manifest.json`

**That's it!** Start streaming with unlimited sources! 🎉

---

## 📦 Installation

### Option 1: Local (Recommended for Testing)
Perfect for personal use and testing:
```bash
npm install
npm start
# Visit http://localhost:7000
```

### Option 2: Deploy Online (24/7 Access)
Deploy to any platform:
- **Railway** - Easiest (see [DEPLOY_NOW.md](DEPLOY_NOW.md))
- **Render** - Free tier available
- **Heroku** - Production ready
- **VPS** - Full control

See complete deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## 🎨 Beautiful Web UI

StreamPulse features a stunning premium interface:
- **Glassmorphism Design** - Modern translucent cards
- **Animated Gradients** - Dynamic backgrounds
- **Real-Time Stats** - Live scraper monitoring
- **Dark Mode** - Optimized for comfort
- **Responsive** - Works on all devices

Access at: `http://localhost:7000/premium.html`

---

## ⚙️ Configuration

### Basic Setup (.env file)
```env
# === DEBRID SERVICES (Add as many as you have) ===
TORBOX_API_KEY=your_key_here
REALDEBRID_API_KEY=your_key_here
ALLDEBRID_API_KEY=your_key_here
PREMIUMIZE_API_KEY=your_key_here

# === INDEXER PLATFORMS ===
JACKETT_URL=http://localhost:9117
JACKETT_API_KEY=your_key_here
PROWLARR_URL=http://localhost:9696
PROWLARR_API_KEY=your_key_here

# === SCRAPERS (15+) ===
ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv,nyaa

# === FEATURES ===
P2P_MODE=false
AUTO_QUALITY=true
FETCH_SUBTITLES=true
CACHED_PRIORITY=true
```

### Advanced Settings
See [CONFIGURATION.md](CONFIGURATION.md) for complete options.

---

## 🎯 Use Cases

### 😊 Free Users
```
✅ Enable P2P mode
✅ Use 15+ scrapers
✅ Stream via WebTorrent
✅ No cost
```

### 💎 Single Debrid Users
```
✅ Add one debrid API key
✅ Get cached instant streams
✅ Fallback to scrapers
✅ Best value
```

### 🚀 Power Users
```
✅ Add ALL 6 debrid services
✅ Configure Jackett/Prowlarr
✅ Enable all 15+ scrapers
✅ Maximum availability
✅ NEVER miss content
```

---

## 📊 StreamPulse vs Competition

| Feature | StreamPulse | Torrentio | Debridio | Jackettio |
|---------|-------------|-----------|----------|-----------|
| **Debrid Services** | **6** 🏆 | 3 | 1 | 0 |
| **Scrapers** | **15+** 🏆 | 2-3 | 4-6 | 0* |
| **Jackett** | **✅** 🏆 | ❌ | ❌ | ✅ |
| **Prowlarr** | **✅** 🏆 | ❌ | ❌ | ✅ |
| **P2P Mode** | **✅** 🏆 | ❌ | ❌ | ❌ |
| **Premium UI** | **✅** 🏆 | ❌ | ❌ | ❌ |
| **AI Ranking** | **✅** 🏆 | ❌ | ❌ | ❌ |
| **Auto Subtitles** | **✅** 🏆 | ❌ | ❌ | ❌ |

*Jackettio relies on external Jackett server

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         STREAMPULSE LAYERS              │
├─────────────────────────────────────────┤
│ Layer 1: Multi-Debrid Check (6)        │
│  → Instant cached streams ⚡            │
├─────────────────────────────────────────┤
│ Layer 2: Jackett/Prowlarr              │
│  → Private trackers, 1000+ indexers     │
├─────────────────────────────────────────┤
│ Layer 3: Direct Scrapers (15+)         │
│  → Public trackers, parallel scraping   │
├─────────────────────────────────────────┤
│ Layer 4: P2P Fallback                  │
│  → WebTorrent, always works             │
└─────────────────────────────────────────┘
```

---

## 📚 Documentation

- [**LOCAL_TESTING.md**](LOCAL_TESTING.md) - Test on your PC
- [**GITHUB_WINDOWS_GUIDE.md**](GITHUB_WINDOWS_GUIDE.md) - Upload to GitHub
- [**DEPLOY_NOW.md**](DEPLOY_NOW.md) - Quick deployment guide
- [**DEPLOYMENT.md**](DEPLOYMENT.md) - Complete hosting guide
- [**STREAMMASTER_VISION.md**](STREAMMASTER_VISION.md) - Technical details
- [**PREMIUM_FEATURES.md**](PREMIUM_FEATURES.md) - Advanced features

---

## 🛠️ Development

### Project Structure
```
streampulse-addon/
├── src/
│   ├── addon.js              # Main addon logic
│   ├── index.js              # Server entry
│   ├── debrid/
│   │   └── multi-manager.js  # 6 debrid services
│   ├── indexer/
│   │   └── manager.js        # Jackett/Prowlarr
│   ├── scrapers/
│   │   ├── 1337x.js
│   │   ├── thepiratebay.js
│   │   └── ... (15+ scrapers)
│   └── torbox/
│       └── client.js
├── public/
│   ├── index.html            # Basic UI
│   └── premium.html          # Premium UI
├── package.json
├── .env.example
└── README.md
```

### Tech Stack
- **Node.js** - Runtime
- **Express** - Web server
- **Stremio SDK** - Addon framework
- **Axios** - HTTP requests
- **Cheerio** - Web scraping
- **Node-Cache** - Caching system

---

## 🤝 Contributing

Contributions are welcome! Here's how:

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Add New Scrapers
See `src/scrapers/base.js` for the base class. Create a new scraper by extending it!

---

## 🐛 Troubleshooting

### No Streams Appearing?
- Check `.env` file is configured
- Enable `P2P_MODE=true` if no debrid service
- Verify `ENABLED_SCRAPERS` has sources listed
- Check server logs for errors

### Addon Not Installing?
- Ensure server is running (`npm start`)
- Check URL is `http://localhost:7000/manifest.json`
- Try clearing Stremio cache

### Slow Performance?
- Reduce `ENABLED_SCRAPERS` count
- Increase `CACHE_TTL` value
- Use fewer debrid services
- Enable caching

See [LOCAL_TESTING.md](LOCAL_TESTING.md) for complete troubleshooting guide.

---

## 📜 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## ⚠️ Legal Notice

StreamPulse is for educational purposes. Users are responsible for ensuring they have legal rights to access content. The developers do not host, store, or distribute any content.

---

## 🙏 Acknowledgments

Built with amazing open-source projects:
- [Stremio Addon SDK](https://github.com/Stremio/stremio-addon-sdk)
- Inspired by Torrentio, Debridio, Jackettio, AIOStreams

Special thanks to the Stremio community!

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/streampulse-addon/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/streampulse-addon/discussions)
- **Reddit**: r/StremioAddons

---

<div align="center">

### 💓 StreamPulse - Feel the Pulse

**Where Every Heartbeat Brings Unlimited Entertainment**

Made with ❤️ by the streaming community

[⭐ Star on GitHub](https://github.com/yourusername/streampulse-addon) • [📖 Documentation](DEPLOY_NOW.md) • [🚀 Deploy Now](DEPLOYMENT.md)

---

**StreamPulse v1.0.0** | *Redefining Streaming Excellence*

</div>
