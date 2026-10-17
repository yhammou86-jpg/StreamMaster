# 🎓 Complete Beginner's Guide to Render Deployment

> **You can do this!** This guide assumes you know NOTHING about deployment. Just follow along step-by-step.

---

## 📚 Table of Contents
1. [What is Render?](#what-is-render)
2. [What You Need](#what-you-need)
3. [Step-by-Step Deployment](#step-by-step-deployment)
4. [Understanding What's Happening](#understanding-whats-happening)
5. [After Deployment](#after-deployment)
6. [Troubleshooting](#troubleshooting)

---

## 🤔 What is Render?

**Render** is like a **free computer in the cloud** that runs your TorboxPro addon 24/7.

### Why Use Render?
- ✅ **Free tier** - No credit card needed
- ✅ **Always online** - Your addon runs even when your PC is off
- ✅ **Easy setup** - Connects directly to GitHub
- ✅ **HTTPS included** - Secure by default
- ✅ **Auto-updates** - Deploys when you update GitHub

### What's the Free Tier?
- **750 hours per month** (that's about 31 days if your addon is used constantly)
- **Sleeps after 15 minutes** of no activity (wakes up automatically when someone uses it)
- **Takes 30-60 seconds** to wake up from sleep
- **Perfect for personal use!**

---

## 📦 What You Need

Before starting, make sure you have:

1. ✅ **This TorboxPro folder** on your computer
   - Location: `C:\Users\Home\Desktop\TorboxPro`

2. ✅ **GitHub account** with your code uploaded
   - If you haven't done this yet, see `QUICK_DEPLOY.md` Step 1
   - Your repository should be at: `github.com/YOUR_USERNAME/torboxpro`

3. ✅ **10 minutes of time** - That's all it takes!

4. ✅ **Internet connection** - Obviously! 😊

**That's it!** No credit card, no technical knowledge needed.

---

## 🚀 Step-by-Step Deployment

### 🔷 STEP 1: Create a Render Account (2 minutes)

#### 1.1 - Go to Render Website
- Open your browser
- Go to: **https://render.com**
- You should see a clean homepage with "Get Started" or "Sign Up" button

#### 1.2 - Sign Up Using GitHub (EASIEST WAY)
- Click the **"Sign Up"** or **"Get Started"** button
- You'll see several sign-up options
- **Click the "GitHub" button** ⭐ (This is the easiest method!)
- GitHub will open and ask you to authorize Render
- Click **"Authorize Render"**
- ✅ Done! You're now logged into Render

> **Why use GitHub to sign up?** 
> - No need to create a new password
> - Render can automatically access your repositories
> - Makes deployment much easier

#### 1.3 - Complete Your Profile
- Render might ask for your name and email
- Fill it in (takes 30 seconds)
- Click **"Complete"** or **"Continue"**

✅ **Checkpoint**: You should now see the Render Dashboard (a page with "New +" button)

---

### 🔷 STEP 2: Connect Your GitHub Repository (1 minute)

#### 2.1 - Access the Dashboard
- You should see a blue **"New +"** button in the top right
- If you don't see it, click **"Dashboard"** in the menu

#### 2.2 - Create New Web Service
- Click **"New +"** button
- A dropdown menu appears
- Click **"Web Service"**

#### 2.3 - Connect Repository
- You'll see a page titled "Create a new Web Service"
- Under "Connect a repository", you'll see:
  - ✅ Your GitHub account is connected (green checkmark)
  - Or you'll see a button to **"Connect account"**
  
- If you need to connect:
  - Click **"Connect account"**
  - Choose **GitHub**
  - Authorize Render to access your repositories
  - You might need to select which repositories Render can see

#### 2.4 - Find Your Repository
- Scroll through the list or use the search box
- Type: **"torboxpro"** (or whatever you named your repository)
- You should see your repository: `YOUR_USERNAME/torboxpro`
- Click the **"Connect"** button next to it

✅ **Checkpoint**: You should now see a configuration page with lots of fields

---

### 🔷 STEP 3: Configure Your Service (3 minutes)

**Don't panic!** Most fields are already filled in automatically. You just need to check them.

#### 3.1 - Basic Information

**Name** (at the top)
- This is the name of your service
- Default might be: `torboxpro`
- You can change it to anything you like (lowercase, no spaces)
- Examples: `torboxpro`, `my-stremio-addon`, `movie-streams`
- **This will be part of your URL**: `https://YOUR-NAME.onrender.com`
- 📝 **Write down the name you choose!**

**Region**
- Choose the region closest to you
- Options: Oregon (US West), Ohio (US East), Frankfurt (Europe), Singapore (Asia)
- Doesn't matter much for free tier
- 💡 **Pick Oregon if you're in the US, Frankfurt if you're in Europe**

**Branch**
- Should say: **main** or **master**
- ✅ Leave it as is

#### 3.2 - Build Settings

**Runtime**
- Should automatically show: **Node**
- ✅ Leave it as is (Render detected your Node.js app!)

**Build Command**
- Should show: **npm install** or **npm ci**
- ✅ Leave it as is
- This installs all the dependencies your app needs

**Start Command**
- Should show: **npm start**
- ✅ Leave it as is
- This starts your TorboxPro server

✅ **Checkpoint**: All the above should be auto-detected. If they're not, type them in exactly as shown.

---

### 🔷 STEP 4: Choose Free Plan (30 seconds)

Scroll down to the **"Plan"** section.

#### 4.1 - Select Free Tier
- You'll see several plan options
- Look for **"Free"** plan (should be selected by default)
- Shows: **$0/month**
- Includes: 750 hours/month, 0.1 CPU, 512 MB RAM
- ✅ Click on it to select it

**⚠️ Important**: 
- Free tier does NOT require a credit card
- If you see a credit card prompt, you accidentally selected a paid plan
- Go back and select "Free"

---

### 🔷 STEP 5: Add Environment Variables (2 minutes)

**What are Environment Variables?**
> Think of them as settings that tell your app how to run. Like telling it "Hey, you're running in production mode" or "Use this API key".

#### 5.1 - Click "Advanced" Button
- Scroll down a bit
- You'll see a button labeled **"Advanced"** or **"Environment Variables"**
- Click it to expand the section

#### 5.2 - Add Required Variables

You'll see fields to add **Key** and **Value** pairs. Add these THREE required variables:

**Variable 1: NODE_ENV**
- Click **"Add Environment Variable"**
- **Key**: Type `NODE_ENV` (exactly like this, all caps)
- **Value**: Type `production` (lowercase)
- This tells your app it's running on a live server

**Variable 2: HOST**
- Click **"Add Environment Variable"** again
- **Key**: Type `HOST` (all caps)
- **Value**: Type `0.0.0.0` (four zeros with dots)
- This tells your app to accept connections from the internet

**Variable 3: P2P_MODE**
- Click **"Add Environment Variable"** again
- **Key**: Type `P2P_MODE` (all caps)
- **Value**: Type `true` (lowercase)
- This enables peer-to-peer streaming without needing a Torbox API key

#### 5.3 - Optional: Add Torbox API Key (if you have one)

**If you have a Torbox API key:**
- Click **"Add Environment Variable"** again
- **Key**: Type `TORBOX_API_KEY` (all caps)
- **Value**: Paste your Torbox API key
- This lets you use Torbox debrid service

**Don't have a Torbox API key?**
- ✅ Skip this! P2P mode will work without it.

#### 5.4 - Optional: Customize Scrapers

**Want to choose which scrapers to use?**
- Click **"Add Environment Variable"**
- **Key**: Type `ENABLED_SCRAPERS`
- **Value**: Type `1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv`
- You can add or remove scraper names (separated by commas, no spaces)

**Don't care about customization?**
- ✅ Skip this! Default scrapers will be used.

✅ **Checkpoint**: You should have at least 3 environment variables added (NODE_ENV, HOST, P2P_MODE)

---

### 🔷 STEP 6: Deploy! (1 click)

#### 6.1 - Review Everything
Quick checklist:
- ✅ Name is set
- ✅ Runtime is "Node"
- ✅ Build Command is "npm install"
- ✅ Start Command is "npm start"
- ✅ Plan is "Free"
- ✅ At least 3 environment variables added

#### 6.2 - Create the Service
- Scroll to the very bottom
- You'll see a big blue button
- It says **"Create Web Service"**
- 🖱️ **Click it!**

#### 6.3 - Wait for Deployment
- You'll see a logs screen with text scrolling
- This is your app being built
- You'll see things like:
  ```
  ==> Cloning from https://github.com/...
  ==> Running 'npm install'
  ==> Installing dependencies...
  ==> Build successful
  ==> Starting service...
  ```

**How long does this take?**
- First deployment: **3-5 minutes**
- You'll see a progress indicator at the top
- Status will change from "Building" → "Deploying" → "Live"

**What to look for:**
- ✅ **Green "Live" badge** at the top = SUCCESS! 🎉
- ❌ **Red "Build failed" or "Deploy failed"** = Something's wrong (see troubleshooting)

✅ **Checkpoint**: When you see **"Live"** in green at the top, your addon is deployed!

---

### 🔷 STEP 7: Get Your URL (30 seconds)

#### 7.1 - Find Your Service URL
- At the top of the page, you'll see your service name
- Below it, there's a URL in blue
- It looks like: **https://torboxpro.onrender.com**
- Or: **https://YOUR-NAME.onrender.com**

#### 7.2 - Save Your URL
- 📝 **Write it down** or copy it
- Click the URL to open it in a new tab
- You should see your TorboxPro configuration page! 🎉

**What if the page doesn't load?**
- Wait 30 seconds and try again (first request can be slow)
- Check if the status is "Live" in Render dashboard
- See troubleshooting section below

✅ **Checkpoint**: You can open your URL and see the TorboxPro interface

---

## 🎯 Understanding What's Happening

### What Did We Just Do?

1. **Created a Render account** - Like making a Gmail account
2. **Connected GitHub** - Gave Render access to your code
3. **Configured the service** - Told Render how to run your app
4. **Set environment variables** - Gave your app its settings
5. **Deployed** - Render copied your code and started running it

### What's Render Doing Right Now?

- 🖥️ **Running your code** on their servers
- 🌐 **Giving you a URL** so anyone can access it
- 🔄 **Monitoring** your app and restarting it if it crashes
- 💤 **Putting it to sleep** after 15 min of no activity (to save resources)
- ⏰ **Waking it up** automatically when someone accesses it

### How Does Free Tier Work?

**Active (Being Used):**
- ⚡ Your addon is running and responding instantly
- 🕐 Every hour it's active counts toward your 750 hours

**Sleeping (Not Being Used):**
- 💤 After 15 minutes of no requests, Render puts it to sleep
- 💰 While sleeping, it doesn't count toward your 750 hours
- ⏱️ Takes 30-60 seconds to wake up when someone visits

**Example:**
- You use your addon for 1 hour a day
- It sleeps the other 23 hours
- Monthly usage: ~30 hours (way under the 750 limit!)
- Cost: **$0** 🎉

---

## 🎬 After Deployment

### Installing in Stremio

#### Method 1: Using the Web Interface (Easiest)

1. **Open your Render URL** in a browser
   - Example: `https://torboxpro.onrender.com`
   - Wait for it to load (might take 30 seconds first time)

2. **Configure your settings** (optional)
   - Enter API key if you have one (or skip if using P2P)
   - Select which scrapers you want
   - Adjust any other settings

3. **Click "Save Configuration"**
   - Wait for success message

4. **Go to "Direct Install" tab**
   - Click the big green **"🚀 Install in Stremio"** button
   - Stremio app will open automatically
   - Click **"Install"** in Stremio
   - ✅ Done!

#### Method 2: Manual Installation

1. **Get your manifest URL**
   - Open your Render URL
   - Go to "Manifest URL" tab
   - Copy the URL shown
   - Should look like: `https://torboxpro.onrender.com/YOUR-KEY/manifest.json`

2. **Open Stremio**
   - Click on the **puzzle piece icon** (🧩) or go to **"Addons"**
   - Scroll down to **"Community Add-ons"**
   - You'll see a text box

3. **Install the addon**
   - Paste your manifest URL into the box
   - Click **"Install"**
   - Wait for confirmation
   - ✅ Done!

#### Method 3: Direct URL (Advanced)

Open Stremio and paste this URL into community addons:
```
https://YOUR-APP-NAME.onrender.com/manifest.json
```
Replace `YOUR-APP-NAME` with your actual Render service name.

### Testing Your Addon

1. **Open Stremio**
2. **Search for a popular movie** (e.g., "Inception", "The Dark Knight")
3. **Click on the movie**
4. **Wait 5-10 seconds** for streams to load
5. **Look for TorboxPro streams**
   - They'll be labeled with your addon name
   - Try clicking one to start streaming

**First time using?**
- May take 60 seconds to load (waking up from sleep)
- Be patient!
- Once awake, streams load in 5-10 seconds

---

## 🔧 Troubleshooting

### Problem 1: "Application Error" or "Service Unavailable"

**What this means:**
Your app is starting up or crashed.

**Solutions:**
1. **Wait 60 seconds** - Service might be waking up
2. **Check Render dashboard**:
   - Go to render.com/dashboard
   - Click on your service
   - Look at the logs (see below)
3. **Check the status**:
   - Should show green "Live"
   - If red, click on it to see error details

### Problem 2: No Streams Appearing in Stremio

**What this means:**
Your addon is installed but not working properly.

**Solutions:**
1. **Wake up your service**:
   - Open your Render URL in a browser
   - Wait 30 seconds
   - Try again in Stremio

2. **Check if addon is installed**:
   - Stremio → Addons → My Addons
   - Look for TorboxPro or your addon name
   - If not there, reinstall it

3. **Try a different movie/show**:
   - Some content might not have torrents available
   - Try popular titles first

4. **Check P2P mode**:
   - If no API key, make sure P2P_MODE=true in Render env variables

### Problem 3: "Build Failed" or "Deploy Failed"

**What this means:**
Render couldn't build or start your app.

**Solutions:**
1. **Check the logs** (see "Reading Logs" below)
2. **Common causes**:
   - Missing environment variables
   - Wrong build/start commands
   - Port binding issues

3. **Fix checklist**:
   - ✅ NODE_ENV = production
   - ✅ HOST = 0.0.0.0
   - ✅ Build Command = npm install
   - ✅ Start Command = npm start

4. **Redeploy**:
   - Make changes in Render settings
   - Click "Manual Deploy" → "Deploy latest commit"

### Problem 4: Service Keeps Sleeping

**What this means:**
This is normal on free tier!

**Solutions:**
1. **Accept it**: First wake-up takes 30-60 seconds, then it's fast
2. **Keep it awake**:
   - Visit your URL once every 10 minutes
   - Or use a service like **UptimeRobot** (free):
     - Go to uptimerobot.com
     - Add your Render URL as a monitor
     - Set interval to 5 minutes
     - It will ping your service to keep it awake

3. **Upgrade to paid plan** ($7/month):
   - No sleeping
   - Instant responses always

### Problem 5: "Can't Connect to Repository"

**What this means:**
Render can't access your GitHub repo.

**Solutions:**
1. **Check repository visibility**:
   - Go to GitHub → Your repository → Settings
   - Make sure it's **Public** or Render has access

2. **Reconnect GitHub**:
   - Render Dashboard → Account Settings
   - Disconnect and reconnect GitHub
   - Re-authorize access

3. **Repository name typo**:
   - Double-check you selected the correct repo

---

## 📊 Reading Logs (Important!)

Logs show what your app is doing. **This is the #1 tool for troubleshooting.**

### How to Access Logs

1. Go to **render.com/dashboard**
2. Click on your **service name**
3. Click on **"Logs"** tab (left sidebar)
4. You'll see real-time text output

### What to Look For

**Good Signs (Everything Working):**
```
==> Build successful
==> Starting service...
Server listening on port 10000
💓 StreamPulse is running!
```

**Bad Signs (Something Wrong):**
```
Error: Cannot find module...
  → Missing dependency, run npm install locally first

Port 7000 is already in use
  → Make sure HOST=0.0.0.0 in env variables

TORBOX_API_KEY is not defined
  → Add API key or enable P2P_MODE

npm ERR! code ELIFECYCLE
  → Build failed, check package.json
```

### How to Use Logs

1. **Scroll to the bottom** - Most recent messages
2. **Look for red "Error"** messages
3. **Read the error message** - It usually tells you what's wrong
4. **Google the error** if you don't understand it
5. **Fix the issue** and redeploy

---

## 🎓 Common Questions

### Q: Do I need a credit card?
**A:** No! Free tier requires no payment information.

### Q: How many people can use my addon?
**A:** As many as you want, but:
- Free tier has limited resources
- Might be slow if 100+ people use it simultaneously
- Perfect for personal use or sharing with friends

### Q: Can I update my code later?
**A:** Yes! Just push to GitHub and Render auto-deploys.
```bash
git add .
git commit -m "Updated something"
git push
```
Wait 3-5 minutes and changes are live!

### Q: What if I run out of 750 hours?
**A:** Very unlikely for personal use. But if you do:
- Service will stop working
- Upgrade to paid plan ($7/month for unlimited)
- Or wait until next month (resets on the 1st)

### Q: Can I use a custom domain?
**A:** Yes, but requires paid plan ($7/month).

### Q: Is my data/API key safe?
**A:** Yes!
- Environment variables are encrypted
- Connections use HTTPS
- Only you can see your env variables

### Q: Can I delete my service?
**A:** Yes! Settings → Danger Zone → Delete Service

### Q: How do I see how many hours I've used?
**A:** Render Dashboard → Billing → Usage
Shows hours used this month.

---

## 🎯 Next Steps After Deployment

### 1. Test Thoroughly
- Try different movies and TV shows
- Test different quality options
- Make sure everything works

### 2. Bookmark Your URL
- Save it in your browser
- You'll need it to configure settings

### 3. Share (Optional)
- Give your Render URL to friends
- They can configure their own settings
- Each user gets their own configuration

### 4. Monitor Performance
- Check Render logs occasionally
- Look for errors
- Monitor your hour usage

### 5. Keep It Updated
- Update your GitHub repo when you make changes
- Render auto-deploys updates
- Check changelog for new features

---

## 📚 Additional Resources

### Render Documentation
- **Getting Started**: https://render.com/docs/web-services
- **Environment Variables**: https://render.com/docs/environment-variables
- **Free Tier Details**: https://render.com/docs/free

### Video Tutorials (YouTube)
Search for: "Deploy Node.js app to Render" for visual guides

### Community Help
- **Render Community**: community.render.com
- **Stremio Reddit**: r/StremioAddons
- **GitHub Issues**: Your repository issues page

---

## 🎉 Congratulations!

You've successfully deployed your TorboxPro addon to Render! 

**What you've accomplished:**
- ✅ Created a Render account
- ✅ Deployed a live web service
- ✅ Configured environment variables
- ✅ Got your addon running 24/7
- ✅ Learned cloud deployment basics

**You're now a cloud deployment pro!** 🚀

This skill applies to:
- Deploying other Node.js apps
- Understanding cloud hosting
- Managing web services
- Using environment variables

---

## 💝 Remember

- **Be patient** - First wake-up takes time
- **Check logs** - They tell you everything
- **Free tier is powerful** - Perfect for personal use
- **Have fun** - You're now streaming with your own addon!

---

**Need help?** Open an issue on GitHub or check Render community forums.

**Happy Streaming!** 🎬🍿

---

*Last updated: October 2026*
*Made with ❤️ for beginners*
