# 🧪 Test StreamMaster Locally - Complete Windows Guide

## 🎯 Quick Start - Test in 5 Minutes!

Follow these steps to test your addon on your computer right now.

---

## Step 1: Open Command Prompt (2 minutes)

### 1.1 Navigate to Your Project Folder

1. Press **Windows Key + R** (opens Run dialog)
2. Type: `cmd` and press **Enter**
3. A black window opens (Command Prompt)
4. Copy and paste this command:
```bash
cd C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs
```
5. Press **Enter**

You should see:
```
C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs>
```

✅ You're now in your project folder!

---

## Step 2: Install Dependencies (3 minutes)

### 2.1 Install Node.js Packages

In the Command Prompt, type:
```bash
npm install
```

Press **Enter** and wait 2-3 minutes.

**What you'll see:**
- Lots of text scrolling
- Progress bars
- "added XXX packages"

✅ When it says "added" at the end, you're done!

### Troubleshooting:
**If you see "npm is not recognized":**
1. You need to install Node.js first
2. Go to: https://nodejs.org
3. Click "Download LTS"
4. Install it (just click Next, Next, Finish)
5. Close Command Prompt and reopen it
6. Try `npm install` again

---

## Step 3: Create Your Configuration (2 minutes)

### 3.1 Create .env File

**Option A: Using Command Prompt (Easier)**
```bash
copy .env.example .env
```
Press **Enter**

**Option B: Using File Explorer**
1. Open the outputs folder in File Explorer
2. Find `.env.example`
3. Right-click it → Copy
4. Right-click in empty space → Paste
5. Rename the copy to `.env` (remove `.example`)

### 3.2 Add Your API Key (Optional)

**If you have a Torbox API key:**
1. Open `.env` file (right-click → Open with → Notepad)
2. Find the line: `TORBOX_API_KEY=your_torbox_api_key_here`
3. Replace `your_torbox_api_key_here` with your actual key
4. Save and close (Ctrl+S, then close)

**Don't have an API key?**
- No problem! Enable P2P mode instead:
1. Open `.env` in Notepad
2. Find: `P2P_MODE=false`
3. Change to: `P2P_MODE=true`
4. Save and close

---

## Step 4: Start the Server (30 seconds)

### 4.1 Run the Server

In Command Prompt, type:
```bash
npm start
```

Press **Enter**

**What you should see:**
```
═══════════════════════════════════════════════════
  🚀 Torbox Stremio Addon is running!
═══════════════════════════════════════════════════

  🌐 Web UI:     http://127.0.0.1:7000
  📡 Server:     http://127.0.0.1:7000

  📝 Setup Instructions:
  1. Open http://127.0.0.1:7000 in your browser
  2. Enter your Torbox API key
  3. Click "Install in Stremio" or copy manifest URL
```

✅ **Your addon is now running!**

**Keep this window open!** Don't close it while testing.

---

## Step 5: Test the Web UI (2 minutes)

### 5.1 Open in Browser

1. Open your web browser (Chrome, Edge, Firefox)
2. Go to: **http://localhost:7000**
3. You should see your beautiful StreamMaster UI! 🎉

### 5.2 Try the Premium UI

Visit: **http://localhost:7000/premium.html**

You'll see:
- Animated gradient background
- Glassmorphism cards
- Real-time stats (15+ Scrapers, 100K+ Torrents/Day)
- Beautiful feature highlights
- Scraper grid with status indicators

### 5.3 Configure Your Settings

1. Scroll down to "API Configuration"
2. Enter your Torbox API key (or skip if using P2P)
3. Click "💾 Save Configuration"
4. You should see: "✨ Configuration saved successfully!"

---

## Step 6: Test the Manifest (1 minute)

### 6.1 Check Manifest URL

In your browser, go to:
```
http://localhost:7000/manifest.json
```

You should see JSON output like:
```json
{
  "id": "com.torbox.stremio",
  "version": "1.0.0",
  "name": "Torbox Stremio Addon",
  "description": "Stream torrents and usenet content via Torbox",
  "resources": ["stream"],
  "types": ["movie", "series"]
}
```

✅ **If you see this, your addon is working!**

---

## Step 7: Add to Stremio (2 minutes)

### 7.1 Install in Stremio

**Option A: Direct Install (Easiest)**
1. In the web UI, click **"🚀 Install in Stremio"**
2. Stremio will open automatically
3. Click "Install" in Stremio

**Option B: Manual Install**
1. Open **Stremio** on your PC
2. Click the **Addons** icon (puzzle piece, top right)
3. Click **"Community Add-ons"** at the top
4. In the text box at the bottom, paste:
```
http://localhost:7000/manifest.json
```
5. Press **Enter**
6. Click **"Install"**

✅ **Your addon is now in Stremio!**

---

## Step 8: Test Streaming (2 minutes)

### 8.1 Search for Content

1. In Stremio, click **"Discover"**
2. Search for any movie (e.g., "Inception")
3. Click on the movie
4. Scroll down to **"Available Streams"**

### 8.2 What You Should See

Look for streams labeled **"Torbox"** with:
- 📦 Quality (4K, 1080p, 720p)
- ⚡ Cached (if using debrid)
- 👤 Seeders count
- 💾 File size
- 🔗 Source name

### 8.3 Test Playback

1. Click on any stream
2. It should start playing!

✅ **If video plays, everything works perfectly!**

---

## 🎉 Success! You're Testing Locally!

Your addon is now:
- ✅ Running on your PC
- ✅ Accessible in your browser
- ✅ Working with Stremio
- ✅ Ready to find streams!

---

## 🔧 Advanced Testing

### Test Multi-Debrid (If You Have Multiple Services)

1. Open `.env` in Notepad
2. Add more API keys:
```env
REALDEBRID_API_KEY=your_realdebrid_key
ALLDEBRID_API_KEY=your_alldebrid_key
PREMIUMIZE_API_KEY=your_premiumize_key
```
3. Save and close
4. In Command Prompt, press **Ctrl+C** to stop server
5. Type `npm start` again to restart
6. Now it checks ALL your debrid services!

### Test Jackett Integration (Advanced)

**If you have Jackett installed:**
1. Open `.env` in Notepad
2. Add:
```env
JACKETT_URL=http://localhost:9117
JACKETT_API_KEY=your_jackett_api_key
```
3. Save, restart server
4. Now you're scraping from Jackett too!

### Test Different Scrapers

1. Open `.env` in Notepad
2. Find: `ENABLED_SCRAPERS=...`
3. Add or remove scrapers (comma-separated):
```env
ENABLED_SCRAPERS=1337x,thepiratebay,yts,eztv,nyaa
```
4. Save, restart server

---

## 🛠️ Troubleshooting

### "Cannot find module" Error

**Solution:**
```bash
npm install
```
Run this again to install missing packages.

### Port 7000 Already in Use

**Solution:**
1. Open `.env`
2. Change `PORT=7000` to `PORT=8000`
3. Save and restart
4. Access at: http://localhost:8000

### "npm start" Does Nothing

**Solution:**
Make sure you're in the correct folder:
```bash
cd C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs
```

### Server Crashes Immediately

**Solution:**
Check your `.env` file for syntax errors:
- No spaces around `=`
- Quotes not needed
- Each setting on its own line

### No Streams in Stremio

**Possible causes:**
1. **No API key and P2P disabled**
   - Solution: Enable `P2P_MODE=true` in `.env`

2. **Wrong API key**
   - Solution: Check your Torbox account for correct key

3. **Scrapers not configured**
   - Solution: Check `ENABLED_SCRAPERS` in `.env`

4. **Server not running**
   - Solution: Make sure Command Prompt window is still open with server running

---

## 📊 Checking Logs

### See What's Happening

In the Command Prompt window (where server is running), you'll see:
- `[Stream Request]` - When Stremio asks for streams
- `[Cache Hit]` - When cached data is used
- `[1337x] Search` - When scrapers run
- `[Torbox]` - Debrid service activity
- `[No Results]` - If nothing found

**Enable more logs:**
1. Open `.env`
2. Change `DEBUG=false` to `DEBUG=true`
3. Restart server
4. You'll see much more detail!

---

## 🎯 Quick Reference

### URLs to Remember
- **Web UI**: http://localhost:7000
- **Premium UI**: http://localhost:7000/premium.html
- **Manifest**: http://localhost:7000/manifest.json
- **API Test**: http://localhost:7000/api/config

### Key Commands
```bash
# Start server
npm start

# Stop server
Ctrl + C

# Install packages
npm install

# Check version
node --version
npm --version
```

### File Locations
```
Project folder:
C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs\

Configuration:
.env (in project folder)

Logs:
Command Prompt window
```

---

## 🚀 Next Steps After Testing

### Once Everything Works Locally:

1. **Upload to GitHub**
   - Read: `GITHUB_WINDOWS_GUIDE.md`
   - Get your code online

2. **Deploy to Cloud**
   - Read: `DEPLOY_NOW.md`
   - Make it accessible 24/7

3. **Share with Friends**
   - Give them your cloud URL
   - They can use your addon!

---

## 💡 Pro Tips

### Tip 1: Keep Server Running
- Minimize Command Prompt window (don't close!)
- Server must run for Stremio to access it
- Close when you're done testing

### Tip 2: Test Different Content
Try searching for:
- **Movies**: "Inception", "The Matrix"
- **TV Shows**: "Breaking Bad", "Game of Thrones"
- **Anime**: "Attack on Titan", "One Piece"

### Tip 3: Check Quality
- 4K streams = best quality, larger files
- 1080p = great quality, reasonable size
- 720p = good quality, smaller files

### Tip 4: Use P2P Mode
If you don't have debrid:
- `P2P_MODE=true` in `.env`
- Restart server
- Streams work via WebTorrent
- No cost!

---

## 📸 What You Should See

### Command Prompt (Server Running)
```
C:\...\outputs> npm start

> torbox-stremio-addon@1.0.0 start
> node src/index.js

═══════════════════════════════════════════════════
  🚀 Torbox Stremio Addon is running!
═══════════════════════════════════════════════════

  🌐 Web UI:     http://127.0.0.1:7000
```

### Browser (Web UI)
```
╔════════════════════════════════════════╗
║     TorboxPro [Next-Gen]              ║
║  The Ultimate Streaming Addon          ║
║     with 15+ Scrapers                  ║
╠════════════════════════════════════════╣
║  [15+]    [100K+]   [99.9%]   [P2P]  ║
║  Scrapers Torrents  Uptime   Enabled  ║
╚════════════════════════════════════════╝

[⚡ Quick Install] [API Config] [Scrapers]
```

### Stremio (Addon Installed)
```
Addons > My Addons
✓ Torbox Stremio Addon (v1.0.0)
  Status: Active
  Manifest: http://localhost:7000/manifest.json
```

---

## ✅ Testing Checklist

Mark these off as you complete them:

- [ ] Command Prompt opened
- [ ] Navigated to project folder
- [ ] Ran `npm install`
- [ ] Created `.env` file
- [ ] Added API key (or enabled P2P)
- [ ] Started server with `npm start`
- [ ] Opened http://localhost:7000 in browser
- [ ] Saw the premium UI
- [ ] Configured settings in web UI
- [ ] Checked manifest.json
- [ ] Installed addon in Stremio
- [ ] Searched for content in Stremio
- [ ] Saw Torbox streams appear
- [ ] Clicked a stream
- [ ] Video played successfully
- [ ] **EVERYTHING WORKS!** 🎉

---

## 🎊 Congratulations!

If you made it here, your StreamMaster addon is:
- ✅ **Installed**
- ✅ **Running**
- ✅ **Working**
- ✅ **Streaming**

**Next:** Deploy it online so it works 24/7!

---

**You're now testing locally like a pro!** 🚀

Need help with any step? Just ask!
