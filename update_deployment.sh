#!/bin/bash

echo "🔄 Quick Update Script for Ubuntu Server"
echo "========================================"
echo ""

cat << 'UPDATE_SCRIPT'
#!/bin/bash

# Quick update script for Ubuntu server
cd /opt/ceshtje-ligjore

echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

echo "📦 Installing/updating dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "🗄️ Updating database schema..."
npx drizzle-kit push

echo "🔄 Restarting application..."
pm2 restart albpetrol-legal

echo "✅ Update completed!"
echo "🔧 Check status: pm2 status"
echo "📋 Check logs: pm2 logs albpetrol-legal"

UPDATE_SCRIPT

echo ""
echo "📋 Usage Instructions:"
echo "====================="
echo ""
echo "1. Save the deployment script above as 'deploy.sh' on your Ubuntu server"
echo "2. Make it executable: chmod +x deploy.sh"
echo "3. Run as root: sudo ./deploy.sh"
echo ""
echo "🔄 For future updates:"
echo "   - Just run the update script above"
echo "   - Or manually: git pull && npm install && npm run build && pm2 restart albpetrol-legal"
echo ""
echo "📧 Don't forget to:"
echo "   - Update SMTP credentials in .env file"
echo "   - Configure your GitHub repository access if private"
echo "   - Setup Nginx reverse proxy if needed"