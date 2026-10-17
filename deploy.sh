#!/bin/bash

echo "🚀 Torbox Stremio Addon - Quick Deployment Script"
echo "=================================================="
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed. Please install git first."
    exit 1
fi

# Check if we're in a git repo
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
    git add .
    git commit -m "🚀 Initial commit - Torbox addon with 8 scrapers and P2P mode"
    echo "✅ Git repository initialized"
else
    echo "✅ Git repository already exists"
fi

echo ""
echo "Choose your deployment platform:"
echo "1) Railway (Easiest - $5 free credit)"
echo "2) Render (Free - 750 hrs/month)"
echo "3) Heroku (Production - $5/month)"
echo "4) Exit"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚂 Railway Deployment"
        echo "===================="
        echo ""
        echo "Steps to deploy on Railway:"
        echo "1. Push your code to GitHub first"
        echo "2. Go to https://railway.app"
        echo "3. Click 'New Project' → 'Deploy from GitHub repo'"
        echo "4. Select this repository"
        echo "5. Add environment variables in Railway dashboard"
        echo ""
        read -p "Have you created a GitHub repository? (y/n): " github_ready

        if [ "$github_ready" = "y" ]; then
            read -p "Enter your GitHub repository URL: " github_url
            echo ""
            echo "📤 Adding GitHub remote..."
            git remote add origin "$github_url" 2>/dev/null || git remote set-url origin "$github_url"

            echo "📤 Pushing to GitHub..."
            git push -u origin main

            echo ""
            echo "✅ Code pushed to GitHub!"
            echo ""
            echo "Next steps:"
            echo "1. Go to https://railway.app and sign in"
            echo "2. Click 'New Project' → 'Deploy from GitHub repo'"
            echo "3. Select your repository"
            echo "4. Add these environment variables in Railway:"
            echo "   TORBOX_API_KEY=your_key_here"
            echo "   HOST=0.0.0.0"
            echo "   PORT=\$PORT"
            echo "   ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv"
            echo "5. Generate a domain in Settings → Domains"
        else
            echo ""
            echo "Please create a GitHub repository first:"
            echo "1. Go to https://github.com/new"
            echo "2. Create a repository named 'torbox-stremio-addon'"
            echo "3. Run this script again"
        fi
        ;;

    2)
        echo ""
        echo "🎨 Render Deployment"
        echo "===================="
        echo ""
        read -p "Have you created a GitHub repository? (y/n): " github_ready

        if [ "$github_ready" = "y" ]; then
            read -p "Enter your GitHub repository URL: " github_url
            echo ""
            echo "📤 Adding GitHub remote..."
            git remote add origin "$github_url" 2>/dev/null || git remote set-url origin "$github_url"

            echo "📤 Pushing to GitHub..."
            git push -u origin main

            echo ""
            echo "✅ Code pushed to GitHub!"
            echo ""
            echo "✅ render.yaml file already created!"
            echo ""
            echo "Next steps:"
            echo "1. Go to https://render.com and sign in"
            echo "2. Click 'New +' → 'Web Service'"
            echo "3. Connect your GitHub repository"
            echo "4. Render will auto-detect render.yaml"
            echo "5. Add your TORBOX_API_KEY in environment variables"
            echo "6. Click 'Create Web Service'"
            echo ""
            echo "Your addon will be at: https://torbox-stremio-addon.onrender.com"
        else
            echo ""
            echo "Please create a GitHub repository first:"
            echo "1. Go to https://github.com/new"
            echo "2. Create a repository named 'torbox-stremio-addon'"
            echo "3. Run this script again"
        fi
        ;;

    3)
        echo ""
        echo "🟣 Heroku Deployment"
        echo "===================="
        echo ""

        # Check if Heroku CLI is installed
        if ! command -v heroku &> /dev/null; then
            echo "❌ Heroku CLI is not installed."
            echo ""
            echo "Please install it first:"
            echo "macOS: brew install heroku/brew/heroku"
            echo "Windows: https://devcenter.heroku.com/articles/heroku-cli"
            echo "Linux: curl https://cli-assets.heroku.com/install.sh | sh"
            exit 1
        fi

        echo "✅ Heroku CLI found"
        echo ""
        echo "🔐 Logging in to Heroku..."
        heroku login

        echo ""
        read -p "Enter a name for your Heroku app (e.g., torbox-addon-yourname): " app_name

        echo ""
        echo "📦 Creating Heroku app..."
        heroku create "$app_name"

        echo ""
        read -p "Enter your Torbox API key: " api_key

        echo ""
        echo "⚙️ Setting environment variables..."
        heroku config:set TORBOX_API_KEY="$api_key"
        heroku config:set HOST=0.0.0.0
        heroku config:set ENABLED_SCRAPERS=1337x,thepiratebay,torrentgalaxy,rarbg,yts,eztv
        heroku config:set P2P_MODE=false
        heroku config:set CACHE_TTL=3600

        echo ""
        echo "📤 Deploying to Heroku..."
        git push heroku main

        echo ""
        echo "✅ Deployment complete!"
        echo ""
        echo "🌐 Opening your addon..."
        heroku open
        ;;

    4)
        echo "👋 Goodbye!"
        exit 0
        ;;

    *)
        echo "❌ Invalid choice"
        exit 1
        ;;
esac

echo ""
echo "=================================================="
echo "🎉 Deployment process initiated!"
echo ""
echo "📖 For detailed instructions, check DEPLOYMENT.md"
echo "🚀 Once deployed, visit your addon URL to configure"
echo "🎬 Add to Stremio using: https://your-app.com/manifest.json"
echo "=================================================="
