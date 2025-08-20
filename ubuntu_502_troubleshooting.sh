#!/bin/bash

echo "🩺 Ubuntu 502 Error Troubleshooting"
echo "==================================="

cat << 'TROUBLESHOOT_COMMANDS'

# Quick troubleshooting commands for 502 error

# Step 1: Check if application is running
echo "=== Step 1: Application Status ==="
pm2 status
echo ""
echo "Checking port 5000:"
ss -tlnp | grep 5000
echo ""

# Step 2: Test direct application access
echo "=== Step 2: Direct Application Test ==="
curl -v http://localhost:5000
echo ""

# Step 3: Check PM2 logs for errors
echo "=== Step 3: Application Logs ==="
pm2 logs albpetrol-legal --lines 20 --nostream
echo ""

# Step 4: Check Nginx error logs
echo "=== Step 4: Nginx Error Logs ==="
tail -20 /var/log/nginx/error.log
echo ""

# Step 5: Check Nginx access logs
echo "=== Step 5: Nginx Access Logs ==="
tail -10 /var/log/nginx/access.log
echo ""

# Step 6: Test Nginx configuration
echo "=== Step 6: Nginx Configuration Test ==="
nginx -t
echo ""

# Step 7: Show Nginx sites
echo "=== Step 7: Nginx Sites ==="
ls -la /etc/nginx/sites-enabled/
echo ""

# Quick fixes if application is not running:

echo "=== Quick Fixes ==="
echo "If PM2 shows 'stopped' or 'errored', run:"
echo "cd /opt/ceshtje-ligjore"
echo "pm2 restart albpetrol-legal"
echo ""
echo "If port 5000 is not listening, check environment:"
echo "cat .env | grep PORT"
echo ""
echo "If Nginx config has errors, recreate it:"
echo "See fix_nginx_502_error.sh for complete Nginx configuration"

TROUBLESHOOT_COMMANDS

echo ""
echo "Run these commands to diagnose the 502 error"