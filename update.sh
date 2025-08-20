#!/bin/bash

echo "🔄 Updating Albpetrol Legal System"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in application directory"
    echo "Please run this script from /opt/ceshtje-ligjore"
    exit 1
fi

echo "📥 Pulling latest changes from GitHub..."
git fetch origin
git pull origin main

if [ $? -ne 0 ]; then
    echo "❌ Git pull failed. Please check for conflicts."
    exit 1
fi

echo "📦 Installing/updating dependencies..."
npm install

echo "🔨 Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the logs."
    exit 1
fi

echo "🗄️ Updating database schema..."
npx drizzle-kit push

echo "🔄 Restarting application..."
pm2 restart albpetrol-legal

# Wait a moment for the application to start
sleep 3

echo ""
echo "✅ Update completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🔧 Check logs if needed:"
echo "   pm2 logs albpetrol-legal"

# Display the last few log lines to verify everything is working
echo ""
echo "📋 Latest logs:"
pm2 logs albpetrol-legal --lines 5 --nostream