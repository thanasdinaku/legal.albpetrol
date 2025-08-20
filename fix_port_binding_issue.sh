#!/bin/bash

echo "🔧 Fixing Port Binding Issue"
echo "============================"

cat << 'PORT_FIX'

# The application shows as online in PM2 but isn't listening on port 5000
# This usually means there's an error in the application startup

# 1. Check PM2 logs for startup errors
echo "1. Checking PM2 logs for errors..."
pm2 logs albpetrol-legal --lines 50 --nostream

echo ""
echo "2. Check current working directory and files..."
cd /opt/ceshtje-ligjore
pwd
ls -la dist/

echo ""
echo "3. Check if the main application file exists..."
ls -la dist/index.js

echo ""
echo "4. Check environment variables..."
cat .env

echo ""
echo "5. Try running the application directly to see errors..."
cd /opt/ceshtje-ligjore
NODE_ENV=production node dist/index.js

# If that fails, try with tsx
echo "6. If direct node fails, try with tsx..."
npx tsx dist/index.js

PORT_FIX

echo ""
echo "Run these commands to diagnose the port binding issue"