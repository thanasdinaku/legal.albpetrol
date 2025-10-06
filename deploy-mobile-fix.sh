#!/bin/bash

# Mobile Dropdown Fix Deployment Script
# This script updates the Select component for proper mobile display

echo "🔧 Deploying mobile dropdown fix to production..."
echo "=================================================="

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# Backup the original file
echo "📦 Creating backup..."
cp client/src/components/ui/select.tsx client/src/components/ui/select.tsx.backup

# Fix 1: Update SelectContent width for mobile
echo "✅ Fix 1: Updating SelectContent for mobile width..."
sed -i 's/min-w-\[8rem\]/w-[calc(100vw-2rem)] sm:w-auto min-w-[calc(100vw-2rem)] sm:min-w-[var(--radix-select-trigger-width)] max-w-[calc(100vw-2rem)] sm:max-w-md/g' client/src/components/ui/select.tsx

# Fix 2: Update SelectItem alignment and padding
echo "✅ Fix 2: Updating SelectItem alignment..."
sed -i 's/items-center rounded-sm py-1\.5/items-start rounded-sm py-2/g' client/src/components/ui/select.tsx

# Fix 3: Update checkmark position
echo "✅ Fix 3: Updating checkmark position..."
sed -i 's/absolute left-2 flex h-3\.5 w-3\.5 items-center justify-center">/absolute left-2 flex h-3.5 w-3.5 items-center justify-center mt-0.5">/g' client/src/components/ui/select.tsx

# Fix 4: Update SelectItemText for text wrapping
echo "✅ Fix 4: Adding text wrapping to SelectItemText..."
sed -i 's/<SelectPrimitive\.ItemText>{children}<\/SelectPrimitive\.ItemText>/<SelectPrimitive.ItemText className="whitespace-normal break-words leading-relaxed">\n      {children}\n    <\/SelectPrimitive.ItemText>/g' client/src/components/ui/select.tsx

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
        echo "✅ Mobile dropdown fix deployed successfully!"
        echo "=================================================="
        echo ""
        echo "📱 Test the fix:"
        echo "   1. Open https://legal.albpetrol.al on mobile"
        echo "   2. Add or edit a case"
        echo "   3. Select court dropdown - full text should be visible"
        echo ""
        echo "🔙 Backup saved at: client/src/components/ui/select.tsx.backup"
        echo ""
        
        # Show recent logs
        echo "📋 Recent logs:"
        pm2 logs albpetrol-legal --lines 20 --nostream
    else
        echo "❌ Failed to restart application"
        echo "🔙 Restoring backup..."
        mv client/src/components/ui/select.tsx.backup client/src/components/ui/select.tsx
        exit 1
    fi
else
    echo "❌ Build failed!"
    echo "🔙 Restoring backup..."
    mv client/src/components/ui/select.tsx.backup client/src/components/ui/select.tsx
    exit 1
fi
