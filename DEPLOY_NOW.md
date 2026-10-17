# 🚀 Quick Deployment Guide

## 📁 Your Files Location

All your addon files are located in:
```
C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs\
```

**Project Structure:**
```
torbox-stremio-addon/
├── src/                          # Source code
│   ├── index.js                  # Main server file
│   ├── addon.js                  # Stremio addon logic
│   ├── torbox/
│   │   └── client.js            # Torbox API wrapper
│   └── scrapers/                # 8 powerful scrapers!
│       ├── 1337x.js
│       ├── thepiratebay.js
│       ├── torrentgalaxy.js
│       ├── rarbg.js
│       ├── yts.js
│       ├── eztv.js
│       ├── nyaa.js
│       └── torrentdownloads.js
├── public/
│   └── index.html               # Web configuration UI
├── package.json                 # Dependencies
├── Procfile                     # For Heroku/Railway
├── render.yaml                  # For Render deployment
├── .env.example                 # Environment template
├── .gitignore                   # Git ignore rules
├── README.md                    # Main documentation
├── DEPLOYMENT.md                # Full deployment guide
├── WEB_SETUP.md                 # Web UI guide
└── QUICK_START.md               # Quick start guide
```

---

## 🎯 Easiest Deployment Methods

### Method 1: Railway (Recommended - Easiest!)

**Time: 5 minutes | Cost: $5 free credit**

#### Step 1: Prepare Your Code
```bash
# Navigate to your outputs folder
cd "C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs"

# Initialize git (if not already)
git init
git add .
git commit -m "🚀 Initial commit - Torbox addon with 8 scrapers"
```

#### Step 2: Create GitHub Repository
1. Go to [github.com/new](https://github.com/new)
2. Name it: `torbox-stremio-addon`
3. Don't initialize with README (we have one)
4. Click "Create repository"

#### Step 3: Push to GitHub
```bash
# Add your GitHub repo (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/torbox-stremio-addon.git
git branch -M main
git push -u origin main
```

#### Step 4: Deploy on Railway
1. Go to [railway.app](https://railway.app)
2. Click **"Start a New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `torbox-stremio-addon` repository
5. Railway will automatically detect Node.js and deploy!

#### Step 5: Add Environment Variables
In Railway dashboard:
1. Click your project → **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these (one by one):

```
TORBOX_API_KEY=your_actual_api_key_here
HOST=0.0.0.0
PORT=$PORT
P2P_MODE=false
ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
CACHE_TTL=3600
DEBUG=false
```

#### Step 6: Generate Domain
1. Go to **"Settings"** → **"Domains"**
2. Click **"Generate Domain"**
3. You'll get: `https://torbox-stremio-addon-production.up.railway.app`

#### Step 7: Test Your Addon
Visit your URL + `/manifest.json`:
```
https://your-app-name.up.railway.app/manifest.json
```

You should see your addon manifest! ✅

---

### Method 2: Render (100% Free!)

**Time: 5 minutes | Cost: FREE (750 hours/month)**

#### Step 1-3: Same as Railway Above
Push your code to GitHub first.

#### Step 4: Deploy on Render
1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Web Service"**
3. Click **"Connect GitHub"** and authorize
4. Select your `torbox-stremio-addon` repository
5. Fill in:
   - **Name:** `torbox-addon`
   - **Region:** Oregon (US West) or closest to you
   - **Branch:** `main`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free

#### Step 5: Add Environment Variables
Scroll down to **"Environment Variables"** and click **"Add Environment Variable"**:

```
TORBOX_API_KEY = your_actual_api_key_here
HOST = 0.0.0.0
PORT = 10000
P2P_MODE = false
ENABLED_SCRAPERS = 1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
CACHE_TTL = 3600
```

#### Step 6: Create Web Service
Click **"Create Web Service"** and wait 2-3 minutes.

Your addon will be at:
```
https://torbox-addon.onrender.com
```

⚠️ **Note:** Free tier sleeps after 15 min of inactivity. First request takes ~30 seconds to wake up.

---

### Method 3: Heroku (Production-Ready)

**Time: 10 minutes | Cost: $5/month (Eco dynos)**

#### Step 1: Install Heroku CLI

**Windows:**
Download from [devcenter.heroku.com/articles/heroku-cli](https://devcenter.heroku.com/articles/heroku-cli)

**macOS:**
```bash
brew install heroku/brew/heroku
```

**Linux:**
```bash
curl https://cli-assets.heroku.com/install.sh | sh
```

#### Step 2: Login and Create App
```bash
# Navigate to your project
cd "C:\Users\Home\AppData\Local\Claude-3p\local-agent-mode-sessions\39688757\00000000\ec29cd0b\outputs"

# Login to Heroku
heroku login

# Create new app (choose unique name)
heroku create torbox-addon-YOUR-NAME

# Set environment variables
heroku config:set TORBOX_API_KEY=your_actual_api_key_here
heroku config:set HOST=0.0.0.0
heroku config:set ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
heroku config:set P2P_MODE=false
heroku config:set CACHE_TTL=3600

# Push to Heroku
git push heroku main

# Open your addon
heroku open
```

Your addon will be at:
```
https://torbox-addon-YOUR-NAME.herokuapp.com
```

---

## 🌐 Add to Stremio

Once deployed, use your addon:

### Option 1: Web UI Configuration
1. Visit your deployed URL: `https://your-app.com`
2. Enter your Torbox API key
3. Configure scrapers and P2P mode
4. Click **"Install in Stremio"**

### Option 2: Manual Installation
1. Copy your manifest URL: `https://your-app.com/manifest.json`
2. Open **Stremio** → Click **Addons** (puzzle icon)
3. Click **"Community Add-ons"**
4. Paste manifest URL
5. Click **"Install"**

---

## 📝 Quick Checklist

Before deploying, make sure you have:

- ✅ GitHub account
- ✅ Git installed on your PC
- ✅ Torbox API key (get from [torbox.app](https://torbox.app))
- ✅ Railway/Render/Heroku account

After deploying:

- ✅ Test manifest URL: `https://your-app.com/manifest.json`
- ✅ Test web UI: `https://your-app.com`
- ✅ Add to Stremio and test streaming
- ✅ Enable P2P mode if you don't have Torbox

---

## 🔧 Troubleshooting

### "Application Error" on first visit
- Wait 30 seconds for cold start
- Check environment variables are set
- View logs: Railway/Render dashboard has "Logs" tab

### Can't find manifest.json
- Make sure PORT and HOST are set correctly
- Railway: `PORT=$PORT` and `HOST=0.0.0.0`
- Render: `PORT=10000` and `HOST=0.0.0.0`

### No streams showing in Stremio
- Check scrapers are enabled: `ENABLED_SCRAPERS=1337x,thepiratebay,...`
- Enable P2P mode if no Torbox API: `P2P_MODE=true`
- View server logs for errors

### Git push fails
```bash
# If git push fails, try:
git push -f origin main
# Or for Heroku:
git push -f heroku main
```

---

## 💡 Pro Tips

1. **Use Railway for testing** - Easiest setup, great for beginners
2. **Use Render for free hosting** - Perfect for personal use
3. **Use Heroku for production** - Most reliable for 24/7 uptime
4. **Enable all 8 scrapers** - More sources = better results
5. **Enable P2P mode** - Great for users without debrid service
6. **Monitor your addon** - Use [uptimerobot.com](https://uptimerobot.com) (free)

---

## 📞 Need Help?

If you get stuck:

1. **Check deployment logs:**
   - Railway: Project → Deployments → Click deployment → View logs
   - Render: Dashboard → Your service → Logs tab
   - Heroku: `heroku logs --tail`

2. **Test locally first:**
```bash
cd outputs
npm install
npm start
# Visit http://localhost:7000
```

3. **Common issues:**
   - Port binding: Use `HOST=0.0.0.0` not `127.0.0.1`
   - Missing env vars: Double-check all variables are set
   - API key: Get fresh key from torbox.app

---

## 🎉 You're Ready!

Your addon has:
- ✅ 8 powerful scrapers (beats Debridio!)
- ✅ P2P mode for free streaming
- ✅ Beautiful web configuration UI
- ✅ Ready for deployment

Choose your hosting method above and get started! 🚀
