#!/bin/bash

# ========================================
# Replit to Ubuntu Server Sync Script
# ========================================

echo "🔄 REPLIT → UBUNTU SERVER SYNCHRONIZATION"
echo "=========================================="
echo ""

# Configuration
UBUNTU_SERVER="10.5.20.29"
UBUNTU_USER="root"
UBUNTU_PATH="/opt/ceshtje-ligjore"
GITHUB_REPO="thanasdinaku/legal.albpetrol.git"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}STEP 1: Check Git Status${NC}"
echo "-------------------------------------------"
git status
echo ""

echo -e "${YELLOW}STEP 2: Show Recent Commits${NC}"
echo "-------------------------------------------"
git log --oneline -5
echo ""

echo -e "${YELLOW}STEP 3: Commit and Push to GitHub${NC}"
echo "-------------------------------------------"
echo "Do you want to commit current changes? (y/n)"
read -r commit_choice

if [ "$commit_choice" = "y" ]; then
    echo "Enter commit message (or press Enter for default):"
    read -r commit_msg
    
    if [ -z "$commit_msg" ]; then
        commit_msg="Sync from Replit - $(date '+%Y-%m-%d %H:%M:%S')"
    fi
    
    git add .
    git commit -m "$commit_msg"
    git push origin main
    
    echo -e "${GREEN}✅ Pushed to GitHub${NC}"
else
    echo "Skipping commit..."
fi
echo ""

echo -e "${YELLOW}STEP 4: SSH Commands for Ubuntu Server${NC}"
echo "-------------------------------------------"
echo "Copy and run these commands on your Ubuntu server:"
echo ""
echo -e "${GREEN}cd /opt/ceshtje-ligjore${NC}"
echo -e "${GREEN}git stash  # Backup local changes${NC}"
echo -e "${GREEN}git pull origin main${NC}"
echo -e "${GREEN}npm install${NC}"
echo -e "${GREEN}npm run build${NC}"
echo -e "${GREEN}pm2 restart albpetrol-legal${NC}"
echo -e "${GREEN}pm2 logs albpetrol-legal --lines 20${NC}"
echo ""

echo -e "${YELLOW}STEP 5: Automatic Deployment (Optional)${NC}"
echo "-------------------------------------------"
echo "Would you like to SSH and deploy automatically? (y/n)"
read -r deploy_choice

if [ "$deploy_choice" = "y" ]; then
    echo "Connecting to Ubuntu server..."
    ssh ${UBUNTU_USER}@${UBUNTU_SERVER} << 'ENDSSH'
        cd /opt/ceshtje-ligjore
        echo "📥 Pulling latest changes..."
        git stash
        git pull origin main
        
        echo "📦 Installing dependencies..."
        npm install
        
        echo "🔨 Building application..."
        npm run build
        
        echo "🔄 Restarting PM2..."
        pm2 restart albpetrol-legal
        
        echo "✅ Deployment complete!"
        echo ""
        echo "📊 Application Status:"
        pm2 list
        
        echo ""
        echo "📝 Recent Logs:"
        pm2 logs albpetrol-legal --lines 20 --nostream
ENDSSH
    
    echo -e "${GREEN}✅ Deployment completed!${NC}"
else
    echo "Skipping automatic deployment..."
fi

echo ""
echo -e "${GREEN}=========================================="
echo "🎉 Synchronization Process Complete!"
echo "==========================================${NC}"
