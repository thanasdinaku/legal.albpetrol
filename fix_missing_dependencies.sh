#!/bin/bash

echo "🔧 Fixing Missing Dependencies Issue"
echo "==================================="

cat << 'DEPENDENCY_FIX'

# The error shows @neondatabase/serverless is missing
# This happens because esbuild bundles the code but excludes external packages

cd /opt/ceshtje-ligjore

# 1. Install missing production dependencies
echo "1. Installing missing production dependencies..."
npm install @neondatabase/serverless --save

# 2. Install all other dependencies that might be missing
echo "2. Installing all dependencies..."
npm install --production

# 3. Check if the package is now available
echo "3. Checking if Neon package is installed..."
npm list @neondatabase/serverless

# 4. Rebuild with proper dependencies
echo "4. Rebuilding application..."
npm run build

# 5. Stop and restart PM2
echo "5. Restarting PM2..."
pm2 stop albpetrol-legal
pm2 start ecosystem.config.cjs

# 6. Wait and check logs
echo "6. Checking if application starts successfully..."
sleep 5
pm2 logs albpetrol-legal --lines 10 --nostream

# 7. Test port binding
echo "7. Testing port binding..."
ss -tlnp | grep 5000

# 8. Test application response
echo "8. Testing application response..."
curl -I http://localhost:5000

# 9. Test through Nginx
echo "9. Testing through Nginx..."
curl -I http://localhost

DEPENDENCY_FIX

echo ""
echo "Run these commands to fix the missing dependencies"