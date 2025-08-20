#!/bin/bash

echo "🔄 Rebuild and Restart Application"
echo "=================================="

cat << 'REBUILD_COMMANDS'

# Complete rebuild and restart process

cd /opt/ceshtje-ligjore

# 1. Stop PM2 completely
echo "1. Stopping PM2..."
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal

# 2. Clean and rebuild
echo "2. Cleaning and rebuilding..."
rm -rf dist/
rm -rf node_modules/.cache
npm run build

# 3. Check if build created the files
echo "3. Checking build output..."
ls -la dist/
cat dist/index.js | head -20

# 4. Test the application directly first
echo "4. Testing application directly..."
timeout 10s node dist/index.js &
sleep 3
curl -I http://localhost:5000 || echo "Direct test failed"
pkill -f "node dist/index.js"

# 5. If direct test works, start with PM2
echo "5. Starting with PM2..."
pm2 start ecosystem.config.cjs

# 6. Check PM2 status and logs
echo "6. Checking PM2 status..."
sleep 3
pm2 status
pm2 logs albpetrol-legal --lines 10 --nostream

# 7. Test port binding
echo "7. Testing port binding..."
ss -tlnp | grep 5000
curl -I http://localhost:5000

REBUILD_COMMANDS

echo ""
echo "Run these commands to completely rebuild and restart"