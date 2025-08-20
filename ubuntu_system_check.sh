#!/bin/bash

echo "🔍 Ubuntu System Health Check"
echo "============================="

cat << 'HEALTH_CHECK'

# Complete system health check for Ubuntu deployment

cd /opt/ceshtje-ligjore

echo "1. PM2 Status Check:"
pm2 status

echo ""
echo "2. Application Logs (last 20 lines):"
pm2 logs albpetrol-legal --lines 20 --nostream

echo ""
echo "3. Port Binding Check:"
ss -tlnp | grep 5000

echo ""
echo "4. Direct Server Test:"
curl -I http://localhost:5000

echo ""
echo "5. Nginx Proxy Test:"
curl -I http://localhost

echo ""
echo "6. API Health Test:"
curl -s http://localhost:5000/api/health | head -200

echo ""
echo "7. File Structure Check:"
ls -la dist/
ls -la dist/public/

echo ""
echo "8. System Resources:"
free -h
df -h /opt/ceshtje-ligjore

echo ""
echo "9. Process Information:"
ps aux | grep -E "(node|pm2|nginx)" | head -10

echo ""
echo "10. Error Log Check:"
tail -10 /var/log/nginx/error.log

HEALTH_CHECK

echo ""
echo "Run this script on Ubuntu to diagnose any issues"