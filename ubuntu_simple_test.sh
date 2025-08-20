#!/bin/bash

echo "🧪 Simple Ubuntu Server Test"
echo "============================"

# Quick test commands for Ubuntu server

cat << 'TEST_COMMANDS'

# Test application response
echo "🌐 Testing application..."
curl -s http://localhost:5000 | head -20

echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "📋 PM2 Logs (last 10 lines):"
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "🗄️ Database test:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT COUNT(*) FROM users;"

echo ""
echo "📧 Admin users:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT email, role FROM users WHERE role = 'admin';"

echo ""
echo "🔍 Environment check:"
echo "NODE_ENV: $NODE_ENV"
head -5 .env

TEST_COMMANDS

echo ""
echo "📋 Run these test commands on Ubuntu server"