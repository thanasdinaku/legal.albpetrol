#!/bin/bash

# Mobile Menu Icon Enhancement Deployment Script
# Makes the hamburger menu more visible on mobile devices

echo "🔧 Deploying mobile menu icon enhancement..."
echo "=================================================="

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# Backup the original file
echo "📦 Creating backup..."
cp client/src/components/header.tsx client/src/components/header.tsx.backup

# Enhance mobile menu button visibility
echo "✅ Enhancing mobile menu button..."
sed -i 's/className="lg:hidden"/className="lg:hidden p-2 hover:bg-gray-100"\n              data-testid="button-mobile-menu"/g' client/src/components/header.tsx
sed -i 's/<i className="fas fa-bars text-xl"><\/i>/<i className="fas fa-bars text-2xl text-gray-700"><\/i>/g' client/src/components/header.tsx

# Build the application
echo ""
echo "🏗️  Building application..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Restart PM2 process
    echo "🔄 Restarting application..."
    pm2 restart albpetrol-legal
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "=================================================="
        echo "✅ Mobile menu icon enhancement deployed!"
        echo "=================================================="
        echo ""
        echo "📱 Test the fix:"
        echo "   1. Open https://legal.albpetrol.al on mobile"
        echo "   2. Look at top-left corner - you'll see the menu icon"
        echo "   3. Tap it to open the sidebar navigation"
        echo ""
        echo "🔙 Backup saved at: client/src/components/header.tsx.backup"
        echo ""
        
        # Show recent logs
        echo "📋 Recent logs:"
        pm2 logs albpetrol-legal --lines 20 --nostream
    else
        echo "❌ Failed to restart application"
        echo "🔙 Restoring backup..."
        mv client/src/components/header.tsx.backup client/src/components/header.tsx
        exit 1
    fi
else
    echo "❌ Build failed!"
    echo "🔙 Restoring backup..."
    mv client/src/components/header.tsx.backup client/src/components/header.tsx
    exit 1
fi
