#!/bin/bash

echo "📊 Ubuntu Server Status Check"
echo "============================="

# Commands to check current status on Ubuntu server

cat << 'STATUS_COMMANDS'

# Check PM2 status
echo "🔧 PM2 Status:"
pm2 status

echo ""
echo "📋 Recent PM2 Logs:"
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "🌐 Application Response Test:"
curl -I http://localhost:5000

echo ""
echo "🗄️ Database Connection Test:"
PGPASSWORD=SecurePassword123! psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database(), current_user;"

echo ""
echo "📧 Admin User Check:"
PGPASSWORD=SecurePassword123! psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT email, role FROM users WHERE role = 'admin' OR is_default_admin = true;"

echo ""
echo "🔍 Application Files:"
ls -la dist/

echo ""
echo "📁 Environment Configuration:"
echo "NODE_ENV: $NODE_ENV"
echo "PORT: $PORT"

STATUS_COMMANDS

echo ""
echo "📋 Run these commands on Ubuntu server to check status"