#!/bin/bash

echo "Quick Ubuntu Server Health Check"
echo "================================"

cat << 'QUICK_CHECK'

# Check if PM2 is running
echo "PM2 Status:"
pm2 status

# Check if application responds
echo "Application Response:"
curl -s -I http://localhost:5000 || echo "Application not responding"

# Check database connection
echo "Database Connection:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database();" || echo "Database connection failed"

# Check if admin user exists
echo "Admin User Check:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT email FROM users WHERE role = 'admin';" || echo "Cannot check admin user"

# Check recent logs
echo "Recent Logs:"
pm2 logs albpetrol-legal --lines 5 --nostream

QUICK_CHECK