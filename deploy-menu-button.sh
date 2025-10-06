#!/bin/bash

# Mobile Menu Button Deployment Script for Ubuntu Server
# Adds grey visible menu button next to page title

echo "🚀 Deploying mobile menu button to Ubuntu server..."
echo "================================================================"

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# Backup the original file
echo "📦 Creating backup..."
cp client/src/components/header.tsx client/src/components/header.tsx.backup.$(date +%Y%m%d_%H%M%S)

# Update the header with grey menu button
echo "✅ Updating header.tsx with grey menu button..."

# Find and replace the mobile menu button section
cat > /tmp/header_update.txt << 'EOF'
          {onMenuToggle && (
            <button
              onClick={onMenuToggle}
              className="mr-3 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-colors"
              data-testid="button-mobile-menu"
              aria-label="Open menu"
            >
              <i className="fas fa-bars text-lg"></i>
            </button>
          )}
EOF

# Use sed to replace the button section
sed -i '/onMenuToggle && (/,/^          )}$/c\
          {onMenuToggle && (\
            <button\
              onClick={onMenuToggle}\
              className="mr-3 px-3 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 active:bg-gray-400 transition-colors"\
              data-testid="button-mobile-menu"\
              aria-label="Open menu"\
            >\
              <i className="fas fa-bars text-lg"></i>\
            </button>\
          )}' client/src/components/header.tsx

# Verify the change was made
if grep -q "bg-gray-200 text-gray-800" client/src/components/header.tsx; then
    echo "✅ Header updated successfully!"
else
    echo "❌ Failed to update header - restoring backup..."
    cp client/src/components/header.tsx.backup.* client/src/components/header.tsx
    exit 1
fi

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
        echo "✅ Mobile menu button deployed successfully!"
        echo "================================================================"
        echo ""
        echo "📱 Changes applied:"
        echo "   - Grey menu button with hamburger icon (☰)"
        echo "   - No text label - icon only"
        echo "   - Hover effects in grey tones"
        echo "   - Positioned next to page title"
        echo ""
        echo "🌐 Test at: https://legal.albpetrol.al"
        echo ""
        echo "🔙 Backup saved with timestamp"
        echo ""
        
        # Show recent logs
        echo "📋 Recent application logs:"
        pm2 logs albpetrol-legal --lines 15 --nostream
    else
        echo "❌ Failed to restart application"
        exit 1
    fi
else
    echo "❌ Build failed!"
    exit 1
fi
