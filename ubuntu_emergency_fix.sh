#!/bin/bash

# Ubuntu Legal Case Management System - Emergency Fix Script
# Copy this script content and run on Ubuntu server

echo "=== ALBPETROL LEGAL CASE MANAGEMENT - EMERGENCY FIX ==="
echo "Finding and fixing application..."

# Find the correct application directory
echo "1. Finding application directory..."
find /opt -name "ceshtje*" -type d 2>/dev/null
find /home -name "ceshtje*" -type d 2>/dev/null
find /var -name "ceshtje*" -type d 2>/dev/null

echo ""
echo "2. Checking for Node.js applications..."
ps aux | grep node
pm2 list 2>/dev/null || echo "PM2 not installed or no processes"

echo ""
echo "3. Checking what's running on port 5000..."
netstat -tulpn | grep :5000 || echo "Nothing running on port 5000"
lsof -i :5000 2>/dev/null || echo "Port 5000 not in use"

echo ""
echo "4. Checking PostgreSQL status..."
systemctl status postgresql --no-pager -l

echo ""
echo "5. Checking system resources..."
free -h
df -h /

echo ""
echo "6. Checking recent system logs..."
journalctl --since "10 minutes ago" --no-pager | tail -20

echo ""
echo "=== NEXT STEPS ==="
echo "Based on the output above:"
echo "1. Note the correct application directory path"
echo "2. Check if PostgreSQL is running"
echo "3. Look for any error messages in logs"
echo "4. Check if port 5000 is available"
echo ""
echo "Then navigate to the correct directory and restart the application"