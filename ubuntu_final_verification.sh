#!/bin/bash

echo "=== UBUNTU FINAL VERIFICATION COMMANDS ==="
echo "Run these commands to complete the fix:"

echo ""
echo "1. Kill the old Node.js process and verify PM2 status:"
echo "kill 1911"
echo "pm2 status"
echo ""

echo "2. Navigate to the correct directory and check files:"
echo "cd /opt/ceshtje-ligjore"
echo "ls -la"
echo "pwd"
echo ""

echo "3. Test the application:"
echo "curl -s http://localhost:5000/ | head -10"
echo "curl -s http://localhost:5000/api/auth/user"
echo ""

echo "4. Check PM2 logs for any errors:"
echo "pm2 logs albpetrol-legal --lines 20"
echo ""

echo "5. If there are any issues, restart PM2:"
echo "pm2 restart albpetrol-legal"
echo "pm2 save"
echo ""

echo "6. Final verification:"
echo "netstat -tulpn | grep :5000"
echo "ps aux | grep node"
echo ""

echo "=== EXPECTED RESULTS ==="
echo "- PM2 should show 'albpetrol-legal' running"
echo "- Port 5000 should be active with PM2 process"
echo "- Application should respond with HTML content"
echo "- Login should work at: http://10.5.20.31:5000"
echo "- Admin credentials: it.system@albpetrol.al / Admin2025!"