# 🚀 GitHub & Render Deployment Guide

## Step 1: Prepare Your GitHub Repository

### A. Create a GitHub Account (if you don't have one)
1. Go to [github.com](https://github.com)
2. Click "Sign up"
3. Follow the registration process

### B. Create a New Repository

1. Click the **"+"** icon in the top-right → **"New repository"**
2. Fill in the details:
   - **Repository name**: `torboxpro` (or your preferred name)
   - **Description**: "TorboxPro - Next-Gen Stremio Addon with 15+ Scrapers"
   - **Visibility**: Choose Public or Private
   - **DO NOT** initialize with README (you already have one)
3. Click **"Create repository"**

## Step 2: Upload Your Code to GitHub

### Option A: Using Git Command Line

1. **Open Command Prompt or PowerShell** in your TorboxPro folder:
   ```bash
   cd C:\Users\Home\Desktop\TorboxPro
   ```

2. **Initialize Git** (if not already done):
   ```bash
   git init
   ```

3. **Add all files**:
   ```bash
   git add .
   ```

4. **Commit your files**:
   ```bash
   git commit -m "Initial commit: TorboxPro Stremio addon"
   ```

5. **Add your GitHub repository as remote**:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/torboxpro.git
   ```
   ⚠️ Replace `YOUR_USERNAME` with your actual GitHub username!

6. **Push to GitHub**:
   ```bash
   git branch -M main
   git push -u origin main
   ```

### Option B: Using GitHub Desktop (Easier)

1. **Download GitHub Desktop**: [desktop.github.com](https://desktop.github.com)
2. Install and sign in with your GitHub account
3. Click **"File" → "Add local repository"**
4. Select the `C:\Users\Home\Desktop\TorboxPro` folder
5. If it says "not a git repository", click **"Create a repository"**
6. Click **"Publish repository"** button
7. Choose repository name and visibility, then click **"Publish"**

### Option C: Upload via GitHub Web Interface (Simplest)

1. On your GitHub repository page, click **"uploading an existing file"**
2. Drag and drop all files from `C:\Users\Home\Desktop\TorboxPro`
   - **EXCEPT** the `node_modules` folder (it's already in .gitignore)
3. Add commit message: "Initial commit"
4. Click **"Commit changes"**

## Step 3: Deploy to Render (Free Hosting)

### A. Sign Up for Render

1. Go to [render.com](https://render.com)
2. Click **"Get Started"** or **"Sign Up"**
3. Sign up with your **GitHub account** (easiest option)
4. Authorize Render to access your GitHub repositories

### B. Create a New Web Service

1. In Render Dashboard, click **"New +"** → **"Web Service"**
2. Click **"Connect account"** to link GitHub (if not already connected)
3. Find your **torboxpro** repository and click **"Connect"**
4. Configure the service:

   **Basic Settings:**
   - **Name**: `torboxpro` (or any name you prefer)
   - **Region**: Choose closest to you (e.g., Oregon, Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install` (should auto-detect)
   - **Start Command**: `npm start` (should auto-detect)

   **Plan:**
   - Select **"Free"** plan
   - ✅ 750 hours/month free
   - ✅ Auto-sleep after 15 min of inactivity
   - ✅ No credit card required

5. **Environment Variables** (Click "Advanced"):
   Add these variables:
   
   | Key | Value | Notes |
   |-----|-------|-------|
   | `NODE_ENV` | `production` | Required |
   | `HOST` | `0.0.0.0` | Required |
   | `PORT` | (leave blank, auto-generated) | Required |
   | `P2P_MODE` | `true` | Optional: Enable if no API key |
   | `TORBOX_API_KEY` | `your_api_key_here` | Optional: Add if you have one |
   | `ENABLED_SCRAPERS` | `1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv` | Optional |

6. Click **"Create Web Service"**

### C. Wait for Deployment

1. Render will start building your app (takes 2-5 minutes)
2. Watch the logs for any errors
3. Once it shows **"Live"**, your addon is deployed! 🎉

### D. Get Your Addon URL

Your addon will be available at:
```
https://torboxpro.onrender.com
```

Or whatever name you chose: `https://YOUR-APP-NAME.onrender.com`

## Step 4: Install in Stremio

### A. Configure Your Addon

1. Open your deployment URL in a browser: `https://torboxpro.onrender.com`
2. You'll see the beautiful TorboxPro configuration page
3. Configure your settings:
   - Add API key (optional if P2P mode is enabled)
   - Select scrapers
   - Adjust settings
4. Click **"Save Configuration"**

### B. Install in Stremio

**Method 1: Direct Install Button**
1. Click the **"🚀 Install in Stremio"** button
2. Stremio will open automatically
3. Confirm installation

**Method 2: Copy Manifest URL**
1. Go to the **"Manifest URL"** tab
2. Click **"📋 Copy"**
3. Open Stremio → Addons → Community Add-ons
4. Paste the URL and click Install

**Method 3: Manual**
1. Copy your manifest URL from the site
2. In Stremio, go to: Addons → Community Add-ons
3. Paste: `https://torboxpro.onrender.com/YOUR-ENCODED-KEY/manifest.json`
4. Click Install

## Step 5: Start Streaming! 🎬

1. Open Stremio
2. Search for any movie or TV show
3. You should see streams from TorboxPro
4. Enjoy unlimited streaming!

---

## 🛠️ Troubleshooting

### Render Deployment Fails

**Check the build logs** in Render dashboard:
- Node version errors? Add `"engines"` to package.json
- Missing dependencies? Check package.json
- Port binding issues? Make sure `HOST=0.0.0.0` in env vars

### Addon Not Showing Streams

1. Check if Render service is **"Live"** (not sleeping)
2. Open your deployment URL to wake it up
3. Wait 30 seconds for cold start
4. Try searching again in Stremio

### Free Tier Limitations

- **Sleeping**: App sleeps after 15 min of inactivity
- **First request slow**: Takes 30-60 seconds to wake up
- **750 hours/month**: Usually enough for personal use
- **Solution**: Keep the tab open or upgrade to paid plan

### API Key Issues

If using Torbox API:
1. Verify your API key at [torbox.app](https://torbox.app)
2. Make sure it's added in Render environment variables
3. Restart the service after adding env vars

### Scrapers Not Working

1. Check `ENABLED_SCRAPERS` environment variable
2. Some scrapers may be blocked by ISP/region
3. Try enabling P2P mode as fallback
4. Check Render logs for scraper errors

---

## 🔄 Updating Your Addon

### Update Code on GitHub

1. Make changes to your local files
2. Commit and push to GitHub:
   ```bash
   git add .
   git commit -m "Update: description of changes"
   git push origin main
   ```

### Render Auto-Deploy

Render automatically deploys when you push to GitHub!
- Check the Render dashboard to see deployment progress
- New version will be live in 2-5 minutes

---

## 💡 Pro Tips

1. **Custom Domain**: Add your own domain in Render settings (Pro plan)
2. **Environment Variables**: Use Render's env vars for sensitive data
3. **Logs**: Check Render logs to debug issues
4. **Keep Alive**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping your addon every 5 minutes and prevent sleeping
5. **Multiple Regions**: Deploy to multiple regions for redundancy

---

## 📊 What You Get

✅ **GitHub Repository**
- Version control for your code
- Easy collaboration
- Professional portfolio piece

✅ **Render Hosting**
- Free 750 hours/month
- HTTPS included
- Auto-deploy from GitHub
- No credit card required
- Professional dashboard

✅ **Your Own Stremio Addon**
- Available 24/7 online
- Access from any device
- Share with friends
- Customizable configuration

---

## 🎯 Next Steps

1. ⭐ **Star your repository** on GitHub
2. 📝 **Update README.md** with your deployment URL
3. 🔧 **Customize settings** for your preferences
4. 🎬 **Start streaming** and enjoy!
5. 🚀 **Share** with friends and family

---

## 🆘 Need Help?

- **GitHub Issues**: Create an issue in your repository
- **Render Support**: [render.com/docs](https://render.com/docs)
- **Stremio Discord**: Join the community
- **Reddit**: r/StremioAddons

---

**Congratulations! You're now hosting your own Stremio addon! 🎉**

Made with ❤️ for the streaming community
