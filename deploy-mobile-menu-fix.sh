#!/bin/bash

# Mobile Menu Icon Enhancement Deployment Script
# Adds three vertical dots menu icon for mobile devices

echo "🔧 Deploying mobile menu icon (3 vertical dots)..."
echo "=================================================="

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# Backup the original file
echo "📦 Creating backup..."
cp client/src/components/header.tsx client/src/components/header.tsx.backup

# Update mobile menu button with vertical dots icon
echo "✅ Adding vertical dots menu icon..."
sed -i 's/className="lg:hidden"/className="lg:hidden p-2 hover:bg-gray-100 min-h-[40px] min-w-[40px]"\n              data-testid="button-mobile-menu"\n              aria-label="Open menu"/g' client/src/components/header.tsx
sed -i 's/<i className="fas fa-bars text-xl"><\/i>/<i className="fas fa-ellipsis-v text-2xl text-gray-700"><\/i>/g' client/src/components/header.tsx

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
        echo "✅ Mobile menu icon deployed successfully!"
        echo "=================================================="
        echo ""
        echo "📱 Test the fix:"
        echo "   1. Open https://legal.albpetrol.al on mobile"
        echo "   2. Look at top-left corner - you'll see ⋮ (3 vertical dots)"
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
