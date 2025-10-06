#!/bin/bash

# Mobile Menu Icon Deployment Script
# Adds three vertical dots menu icon positioned next to the title

echo "🔧 Deploying mobile menu icon (3 vertical dots next to title)..."
echo "================================================================"

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# Backup the original file
echo "📦 Creating backup..."
cp client/src/components/header.tsx client/src/components/header.tsx.backup

# Update the header - replace Button component with plain button
echo "✅ Updating header with integrated menu icon..."

# Fix 1: Change from space-x-3 to min-w-0 (no gap)
sed -i 's/flex items-center space-x-3/flex items-center min-w-0/g' client/src/components/header.tsx

# Fix 2: Replace Button component with plain button (remove import usage)
sed -i 's/<Button/<button/g' client/src/components/header.tsx
sed -i 's/<\/Button>/<\/button>/g' client/src/components/header.tsx

# Fix 3: Update button styling
sed -i 's/variant="ghost"/\/\* removed variant \*\//g' client/src/components/header.tsx
sed -i 's/size="sm"/\/\* removed size \*\//g' client/src/components/header.tsx
sed -i 's/className="lg:hidden p-2 hover:bg-gray-100 min-h-\[40px\] min-w-\[40px\]"/className="lg:hidden p-1 mr-2 hover:opacity-70 active:opacity-50 transition-opacity"/g' client/src/components/header.tsx

# Fix 4: Update icon styling
sed -i 's/fa-bars text-2xl text-gray-700/fa-ellipsis-v text-2xl text-gray-900/g' client/src/components/header.tsx

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
        echo "================================================================"
        echo "✅ Mobile menu icon deployed successfully!"
        echo "================================================================"
        echo ""
        echo "📱 Test the fix:"
        echo "   1. Open https://legal.albpetrol.al on mobile"
        echo "   2. Look next to the title - you'll see ⋮ (3 vertical dots)"
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
