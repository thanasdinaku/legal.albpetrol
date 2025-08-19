#!/bin/bash

echo "=== UBUNTU COMPLETE APPLICATION FIX ==="
echo "Run these exact commands on your Ubuntu server:"
echo ""

echo "# 1. Navigate to correct directory"
echo "cd /opt/ceshtje-ligjore"
echo ""

echo "# 2. Kill the old Node.js process that's not managed by PM2"
echo "kill 1911"
echo "ps aux | grep node"
echo ""

echo "# 3. Check what build scripts are available"
echo "npm run"
echo ""

echo "# 4. Build the application (try different commands)"
echo "# Try these one by one until one works:"
echo "npm run build"
echo "# OR if build doesn't exist:"
echo "npx vite build"
echo "# OR if it's already built:"
echo "ls -la dist/"
echo ""

echo "# 5. Start with PM2 directly"
echo "pm2 delete albpetrol-legal 2>/dev/null"
echo "pm2 start dist/index.js --name albpetrol-legal --instances 1"
echo ""

echo "# 6. Check status"
echo "pm2 status"
echo "pm2 logs albpetrol-legal --lines 10"
echo ""

echo "# 7. Test the application"
echo "curl -I http://localhost:5000/"
echo "netstat -tulpn | grep :5000"
echo ""

echo "# 8. If still not working, check environment"
echo "cat .env"
echo "ls -la dist/"
echo ""

echo "=== COPY AND PASTE THESE COMMANDS ==="
echo "cd /opt/ceshtje-ligjore && kill 1911 && npm run && pm2 delete albpetrol-legal && pm2 start dist/index.js --name albpetrol-legal && pm2 status"