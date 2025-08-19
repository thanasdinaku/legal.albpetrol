#!/bin/bash

echo "=== UBUNTU FORM LOADING FIX ==="
echo "Copy this script to your Ubuntu server and run it"

echo ""
echo "1. Navigate to application directory:"
echo "cd /opt/ceshtje-ligjore"

echo ""
echo "2. Check current PM2 status:"
echo "pm2 status"
echo "pm2 logs albpetrol-legal --lines 10"

echo ""
echo "3. Check if frontend build is corrupted:"
echo "ls -la dist/"
echo "du -sh dist/"

echo ""
echo "4. Rebuild the frontend if needed:"
echo "npm run build"

echo ""
echo "5. Restart PM2 with fresh build:"
echo "pm2 restart albpetrol-legal"

echo ""
echo "6. Check browser console for JavaScript errors:"
echo "Open Chrome DevTools (F12) and check for errors"

echo ""
echo "7. If form still not loading, rebuild from source:"
echo "npm install"
echo "npm run build"
echo "pm2 restart albpetrol-legal"

echo ""
echo "8. Alternative: Check if TypeScript compilation errors:"
echo "npx tsc --noEmit"

echo ""
echo "=== IMMEDIATE COMMANDS TO RUN ==="
echo "cd /opt/ceshtje-ligjore"
echo "pm2 logs albpetrol-legal --lines 20"
echo "npm run build"
echo "pm2 restart albpetrol-legal"