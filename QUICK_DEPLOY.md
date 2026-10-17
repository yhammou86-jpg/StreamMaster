# ⚡ QUICK DEPLOY - 5 Minutes to Live!

## 🎯 Fastest Path: GitHub → Render

### Prerequisites
- ✅ GitHub account
- ✅ This project folder on your computer

---

## 📤 Step 1: Push to GitHub (2 minutes)

### Using GitHub Desktop (Easiest):
1. Download: [desktop.github.com](https://desktop.github.com)
2. Sign in with GitHub
3. **File → Add Local Repository**
4. Select: `C:\Users\Home\Desktop\TorboxPro`
5. Click **"Publish repository"**
6. ✅ Done!

### Using Git Command Line:
```bash
cd C:\Users\Home\Desktop\TorboxPro
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/torboxpro.git
git push -u origin main
```

---

## 🚀 Step 2: Deploy to Render (3 minutes)

1. Go to: [render.com](https://render.com)
2. **Sign up with GitHub** (one click)
3. **New + → Web Service**
4. **Connect your repository**: `torboxpro`
5. Settings:
   - **Runtime**: Node
   - **Build**: `npm install` (auto-detected)
   - **Start**: `npm start` (auto-detected)
   - **Plan**: FREE
6. **Environment Variables** (click Advanced):
   ```
   NODE_ENV = production
   HOST = 0.0.0.0
   P2P_MODE = true
   ```
7. Click **"Create Web Service"**
8. ⏳ Wait 2-5 minutes for build
9. ✅ Live at: `https://your-app-name.onrender.com`

---

## 🎬 Step 3: Install in Stremio (30 seconds)

1. Open: `https://your-app-name.onrender.com`
2. Configure settings (or skip if using P2P)
3. Click **"🚀 Install in Stremio"**
4. Confirm in Stremio
5. ✅ Start streaming!

---

## 💡 Pro Tips

**Wake Up Service:**
- First request takes 30-60 seconds (cold start)
- Open the URL once to wake it up
- Use [UptimeRobot](https://uptimerobot.com) to prevent sleeping

**API Keys (Optional):**
- Torbox: [torbox.app](https://torbox.app/settings/api)
- Add in Render Environment Variables
- Restart service after adding

**Customization:**
- All settings in the web UI
- Changes saved per configuration
- No need to redeploy

---

## 🆘 Quick Fixes

**"Application Error":**
→ Check Render logs, wait for build to complete

**"No streams appearing":**
→ Open your Render URL to wake service
→ Wait 30-60 seconds, try again

**"GitHub push rejected":**
→ Make sure you created the repository first
→ Check the remote URL is correct

---

## 📊 What's Included

✅ 15+ torrent scrapers
✅ P2P mode (no debrid needed)
✅ Beautiful web UI
✅ Free hosting (750 hrs/month)
✅ Auto-deploy on git push
✅ HTTPS included
✅ 24/7 availability

---

## 🎯 Result

```
YOUR CODE → GitHub → Render → Stremio → UNLIMITED STREAMING! 🎉
```

**Total Time: ~5 minutes**
**Cost: $0 (Free forever)**
**Streams: Unlimited**

---

## 📚 Need More Details?

See: [GITHUB_DEPLOYMENT_GUIDE.md](GITHUB_DEPLOYMENT_GUIDE.md)

---

**Happy Streaming! 🎬**
