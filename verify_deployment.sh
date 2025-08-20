#!/bin/bash

echo "🔍 Verifying Albpetrol Legal System Deployment"
echo "=============================================="
echo ""

# Check application status
echo "📊 PM2 Application Status:"
pm2 status

echo ""
echo "🌐 Testing Application Response:"

# Test local connection
if curl -s -I http://localhost:5000 | head -1 | grep -q "200 OK"; then
    echo "✅ Application responds on localhost:5000"
else
    echo "❌ Application not responding on localhost:5000"
fi

# Test external IP
EXTERNAL_IP=$(hostname -I | awk '{print $1}')
if curl -s -I http://$EXTERNAL_IP:5000 | head -1 | grep -q "200 OK"; then
    echo "✅ Application responds on $EXTERNAL_IP:5000"
else
    echo "❌ Application not responding on $EXTERNAL_IP:5000"
fi

echo ""
echo "🗄️ Database Connection Test:"
psql -d albpetrol_legal_db -U albpetrol_user -c "SELECT COUNT(*) as user_count FROM users;" 2>/dev/null || echo "❌ Database connection failed"

echo ""
echo "📧 Admin User Configuration:"
psql -d albpetrol_legal_db -U albpetrol_user -c "SELECT email, role, is_default_admin FROM users WHERE role = 'admin' OR is_default_admin = true;" 2>/dev/null || echo "❌ Cannot check admin users"

echo ""
echo "📋 Recent Application Logs:"
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "🔧 System Information:"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"
echo "PM2: $(pm2 --version)"
echo "Git: $(git --version)"

echo ""
echo "📁 Application Files:"
ls -la dist/ 2>/dev/null || echo "❌ dist/ directory not found"

echo ""
echo "🌐 Access URLs:"
echo "   Local: http://localhost:5000"
echo "   Network: http://$EXTERNAL_IP:5000"
echo "   Domain: http://legal.albpetrol.al (if Cloudflare configured)"

echo ""
echo "✅ Verification completed!"