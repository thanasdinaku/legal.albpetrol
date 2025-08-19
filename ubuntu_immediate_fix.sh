#!/bin/bash

echo "=== UBUNTU IMMEDIATE DATA ENTRY FIX ==="

# Kill the existing Node.js process running outside PM2
echo "1. Stopping incorrect Node.js process..."
kill 1911

# Navigate to the correct application directory  
echo "2. Navigating to application directory..."
cd /opt/ceshtje-ligjore

# Check the ecosystem.config.js file exists
echo "3. Checking PM2 configuration..."
ls -la ecosystem.config.js

# Start the application properly with PM2
echo "4. Starting application with PM2..."
pm2 start ecosystem.config.js

# Check PM2 status
echo "5. Checking PM2 status..."
pm2 status

# Check if application responds
echo "6. Testing application..."
sleep 3
curl -s http://localhost:5000/ | head -5

echo "7. Checking PM2 logs for any errors..."
pm2 logs --lines 20

echo ""
echo "=== FIX COMPLETE ==="
echo "Application should now be accessible at: http://10.5.20.31:5000"
echo "Login: it.system@albpetrol.al / Admin2025!"