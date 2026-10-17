# 🚀 Deployment Guide - Host Your Torbox Addon Online

This guide covers multiple hosting options to get your Torbox Stremio addon online and accessible 24/7.

## Table of Contents
- [Quick Comparison](#quick-comparison)
- [Railway (Recommended)](#railway-recommended)
- [Render](#render)
- [Heroku](#heroku)
- [DigitalOcean App Platform](#digitalocean-app-platform)
- [AWS Elastic Beanstalk](#aws-elastic-beanstalk)
- [VPS/VDS Hosting](#vpsvds-hosting)
- [Domain & HTTPS Setup](#domain--https-setup)

---

## Quick Comparison

| Platform | Free Tier | Ease of Use | Auto-Deploy | HTTPS | Best For |
|----------|-----------|-------------|-------------|-------|----------|
| **Railway** | $5/month credit | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Beginners |
| **Render** | 750 hrs/month | ⭐⭐⭐⭐⭐ | ✅ | ✅ | Free hosting |
| **Heroku** | Limited free | ⭐⭐⭐⭐ | ✅ | ✅ | Production |
| **DigitalOcean** | $200 credit | ⭐⭐⭐⭐ | ✅ | ✅ | Scaling |
| **AWS** | 12 months free | ⭐⭐⭐ | ✅ | ✅ | Enterprise |
| **VPS** | From $5/month | ⭐⭐ | ❌ | Manual | Full control |

---

## Railway (Recommended)

Railway is the easiest option with great free credits for new users.

### Step 1: Prepare Your Code

1. Make sure you have a GitHub account and push your code to a repository:
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/torbox-addon.git
git push -u origin main
```

2. Add a `Procfile` (Railway auto-detects but this helps):
```bash
echo "web: npm start" > Procfile
```

### Step 2: Deploy to Railway

1. Go to [railway.app](https://railway.app) and sign up with GitHub
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your torbox-addon repository
4. Railway will auto-detect Node.js and deploy

### Step 3: Configure Environment Variables

1. In your Railway project, go to **Variables** tab
2. Add these variables:
```
TORBOX_API_KEY=your_api_key_here
PORT=7000
HOST=0.0.0.0
ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
```

3. Click "Deploy" to restart with new variables

### Step 4: Get Your URL

1. Go to **Settings** → **Domains**
2. Click "Generate Domain"
3. You'll get a URL like: `https://your-app.up.railway.app`
4. Use this URL in your Stremio manifest!

**Cost:** $5 free credit, then ~$5-10/month

---

## Render

Render offers a generous free tier perfect for personal use.

### Step 1: Prepare for Render

1. Push your code to GitHub (see Railway step 1)

2. Create a `render.yaml` (optional but recommended):
```yaml
services:
  - type: web
    name: torbox-addon
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: PORT
        value: 7000
      - key: HOST
        value: 0.0.0.0
      - key: TORBOX_API_KEY
        sync: false
      - key: ENABLED_SCRAPERS
        value: 1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
```

### Step 2: Deploy on Render

1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Fill in:
   - **Name:** torbox-addon
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`

### Step 3: Add Environment Variables

1. Scroll to **Environment Variables**
2. Add your variables:
```
TORBOX_API_KEY = your_api_key_here
PORT = 7000
HOST = 0.0.0.0
```

3. Click "Create Web Service"

### Step 4: Access Your Addon

Your addon will be available at: `https://torbox-addon.onrender.com`

**Free Tier:** 750 hours/month (enough for personal use)
**Note:** Free tier sleeps after 15 mins of inactivity, first request takes ~30s to wake up

---

## Heroku

Heroku is battle-tested and reliable for production apps.

### Step 1: Install Heroku CLI

```bash
# macOS
brew install heroku/brew/heroku

# Windows (download installer)
# https://devcenter.heroku.com/articles/heroku-cli

# Linux
curl https://cli-assets.heroku.com/install.sh | sh
```

### Step 2: Prepare Your App

1. Add a `Procfile`:
```bash
echo "web: npm start" > Procfile
```

2. Make sure `package.json` has the start script:
```json
{
  "scripts": {
    "start": "node src/index.js"
  }
}
```

### Step 3: Deploy to Heroku

```bash
# Login to Heroku
heroku login

# Create new app
heroku create torbox-addon

# Set environment variables
heroku config:set TORBOX_API_KEY=your_api_key_here
heroku config:set HOST=0.0.0.0
heroku config:set PORT=\$PORT
heroku config:set ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv

# Deploy
git push heroku main

# Open in browser
heroku open
```

Your addon will be at: `https://torbox-addon.herokuapp.com`

**Cost:** Free tier limited, Eco dynos start at $5/month

---

## DigitalOcean App Platform

Great for scaling and professional hosting with $200 credit for new users.

### Step 1: Prepare Repository

1. Push code to GitHub
2. Ensure `package.json` has proper `start` script

### Step 2: Create App

1. Go to [DigitalOcean App Platform](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repository
4. Choose the repository and branch

### Step 3: Configure

1. **Resources:**
   - Type: Web Service
   - Name: torbox-addon
   - Build Command: `npm install`
   - Run Command: `npm start`

2. **Environment Variables:**
```
TORBOX_API_KEY=your_api_key_here
HOST=0.0.0.0
PORT=8080
ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
```

3. **Plan:** Select Basic ($5/month) or Professional

4. Click "Next" → "Create Resources"

Your app will be at: `https://torbox-addon-xxxxx.ondigitalocean.app`

**Cost:** $5/month, includes $200 credit for new users

---

## AWS Elastic Beanstalk

For enterprise-grade hosting with full AWS ecosystem integration.

### Step 1: Install EB CLI

```bash
pip install awsebcli --upgrade
```

### Step 2: Initialize EB App

```bash
# Navigate to your project
cd torbox-stremio-addon

# Initialize Elastic Beanstalk
eb init -p node.js torbox-addon --region us-east-1

# Create environment
eb create torbox-addon-env

# Set environment variables
eb setenv TORBOX_API_KEY=your_api_key_here HOST=0.0.0.0 ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv

# Deploy
eb deploy
```

### Step 3: Configure

1. Create `.ebextensions/nodecommand.config`:
```yaml
option_settings:
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "npm start"
```

2. Access your app:
```bash
eb open
```

Your addon will be at: `http://torbox-addon-env.xxxxxxxx.us-east-1.elasticbeanstalk.com`

**Cost:** Free tier for 12 months, then ~$20-30/month

---

## VPS/VDS Hosting

For maximum control using providers like Vultr, Linode, or Hetzner.

### Step 1: Create a VPS

1. Sign up at [Vultr](https://vultr.com), [Linode](https://linode.com), or [Hetzner](https://hetzner.com)
2. Create a new server:
   - OS: Ubuntu 22.04 LTS
   - Size: 1GB RAM minimum ($5-6/month)
   - Location: Closest to your users

### Step 2: Initial Server Setup

SSH into your server:
```bash
ssh root@your_server_ip

# Update system
apt update && apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt install -y nodejs

# Install PM2 (process manager)
npm install -g pm2

# Install nginx (for reverse proxy)
apt install -y nginx

# Create app user
adduser --disabled-password torbox
```

### Step 3: Deploy Your App

```bash
# Switch to app user
su - torbox

# Clone your repository
git clone https://github.com/yourusername/torbox-addon.git
cd torbox-addon

# Install dependencies
npm install

# Create .env file
nano .env
# (Add your configuration)

# Start with PM2
pm2 start src/index.js --name torbox-addon
pm2 save
pm2 startup
```

### Step 4: Configure Nginx

```bash
# Exit to root user
exit

# Create nginx config
nano /etc/nginx/sites-available/torbox-addon
```

Add this configuration:
```nginx
server {
    listen 80;
    server_name your_domain.com;

    location / {
        proxy_pass http://localhost:7000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable and restart:
```bash
ln -s /etc/nginx/sites-available/torbox-addon /etc/nginx/sites-enabled/
nginx -t
systemctl restart nginx
```

### Step 5: Add HTTPS (Optional but Recommended)

```bash
# Install Certbot
apt install -y certbot python3-certbot-nginx

# Get SSL certificate
certbot --nginx -d your_domain.com

# Auto-renewal is configured automatically
```

**Cost:** $5-6/month for basic VPS

---

## Domain & HTTPS Setup

### Custom Domain (Any Platform)

1. **Buy a domain** from Namecheap, Google Domains, or Cloudflare

2. **Add DNS records:**
   - Type: CNAME
   - Name: @ (or subdomain like `addon`)
   - Value: your-hosting-url.com

3. **Configure in hosting platform:**
   - Railway: Settings → Domains → Add Custom Domain
   - Render: Settings → Custom Domains
   - Heroku: Settings → Domains → Add domain

### Cloudflare (Free CDN + SSL)

1. Transfer your domain to Cloudflare or update nameservers
2. Add your hosting URL as a CNAME record
3. Enable **SSL/TLS** → Full (Strict)
4. Enable **Always Use HTTPS**
5. Optional: Enable **Caching** for better performance

---

## Post-Deployment Checklist

✅ **Test your addon:**
```
https://your-domain.com/manifest.json
```

✅ **Add to Stremio:**
- Open Stremio → Addons
- Paste your manifest URL
- Install and test streaming

✅ **Monitor uptime:**
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Ping your addon every 5 minutes

✅ **Set up logging** (optional):
- Railway/Render: Built-in logs
- VPS: `pm2 logs torbox-addon`

✅ **Enable auto-updates** (optional for VPS):
```bash
# Create update script
nano /home/torbox/update.sh
```

```bash
#!/bin/bash
cd /home/torbox/torbox-addon
git pull
npm install
pm2 restart torbox-addon
```

```bash
chmod +x /home/torbox/update.sh

# Add cron job (daily at 3 AM)
crontab -e
0 3 * * * /home/torbox/update.sh
```

---

## Troubleshooting

### Port Issues
If deployment fails with port errors, ensure:
- `HOST=0.0.0.0` (not 127.0.0.1)
- `PORT` uses platform's environment variable

### Scraper Timeouts
If scrapers time out:
- Increase `SCRAPER_TIMEOUT=30000`
- Reduce `ENABLED_SCRAPERS` to fewer sources

### Memory Issues
If app crashes with memory errors:
- Upgrade to larger instance
- Reduce `CACHE_TTL` to use less memory

### SSL Certificate Errors
If HTTPS doesn't work:
- Wait 10-15 minutes for DNS propagation
- Check DNS records are pointing correctly
- Ensure port 80 and 443 are open (VPS)

---

## Recommended Setup

**For beginners:** Railway or Render (easiest setup)
**For free hosting:** Render (best free tier)
**For production:** DigitalOcean or Heroku (reliable)
**For full control:** VPS with PM2 and Nginx (most flexible)

---

## Need Help?

- Check hosting platform logs for errors
- Test locally first: `npm start`
- Ensure all environment variables are set
- Verify your Torbox API key is valid

**Your Torbox addon will beat Debridio with 8 scrapers and P2P mode!** 🚀
