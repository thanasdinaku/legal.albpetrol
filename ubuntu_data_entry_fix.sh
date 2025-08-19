#!/bin/bash

# Ubuntu Legal Case Management System - Data Entry Fix Script
# Run this script on your Ubuntu server (10.5.20.31) as root

echo "=== ALBPETROL LEGAL CASE MANAGEMENT - EMERGENCY DATA ENTRY FIX ==="
echo "Checking system status and fixing data entry issues..."

# Check if logged in as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo bash ubuntu_data_entry_fix.sh"
    exit 1
fi

echo ""
echo "1. Checking application status..."
cd /opt/ceshtje-ligjore/ceshtje-ligjore

# Check PM2 status
pm2 status

echo ""
echo "2. Checking if application is running..."
curl -s http://localhost:5000/ | head -5 || echo "Application not responding"

echo ""
echo "3. Restarting the application..."
pm2 restart albpetrol-legal

echo ""
echo "4. Checking database connection..."
sudo -u postgres psql ceshtje_ligjore -c "SELECT COUNT(*) FROM data_entries;" || echo "Database connection issue"

echo ""
echo "5. Checking application logs for errors..."
pm2 logs albpetrol-legal --lines 20

echo ""
echo "6. If application still not working, rebuilding..."
npm run build

echo ""
echo "7. Final restart with fresh PM2 process..."
pm2 delete albpetrol-legal 2>/dev/null || true
pm2 start ecosystem.config.js

echo ""
echo "8. Testing the application again..."
sleep 5
curl -s http://localhost:5000/ | head -5

echo ""
echo "9. Checking final status..."
pm2 status
pm2 logs albpetrol-legal --lines 5

echo ""
echo "=== STATUS SUMMARY ==="
echo "Application URL: http://10.5.20.31:5000"
echo "Admin Login: it.system@albpetrol.al / Admin2025!"
echo ""
echo "If the system is still not working, run:"
echo "  pm2 logs albpetrol-legal"
echo "  systemctl status postgresql"
echo "  journalctl -u postgresql -n 20"
echo ""
echo "Contact: thanas.dinaku@albpetrol.al"
echo "=== FIX COMPLETE ==="