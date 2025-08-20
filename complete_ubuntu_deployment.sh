#!/bin/bash

echo "🚀 Complete Ubuntu Deployment for Albpetrol Legal System"
echo "======================================================="
echo ""

# Run on Ubuntu server as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Not in application directory"
    echo "Please run from /opt/ceshtje-ligjore"
    exit 1
fi

echo "📥 Pulling latest changes from GitHub..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "📝 Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.template .env
    echo ""
    echo "⚠️  Created .env from template. Please edit with your settings:"
    echo "   nano .env"
    echo ""
    echo "Required settings:"
    echo "   - DATABASE_URL (PostgreSQL connection)"
    echo "   - SMTP credentials for it.system@albpetrol.al"
    echo "   - SESSION_SECRET"
    echo ""
    read -p "Press Enter after editing .env file..."
fi

echo "🗄️ Setting up database schema..."
npx drizzle-kit push

echo "📧 Updating admin email to it.system@albpetrol.al..."
psql -d albpetrol_legal_db -U albpetrol_user << 'SQL_EOF' || echo "Database update will be done manually"
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;

SELECT id, email, role, is_default_admin 
FROM users 
WHERE role = 'admin' OR is_default_admin = true;
SQL_EOF

echo "📁 Creating logs directory..."
mkdir -p logs

echo "🔄 Stopping existing PM2 processes..."
pm2 stop albpetrol-legal || true
pm2 delete albpetrol-legal || true

echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

echo "💾 Saving PM2 configuration..."
pm2 save

echo "🔧 Setting up PM2 auto-start..."
pm2 startup || echo "PM2 startup configuration may need manual setup"

echo ""
echo "✅ Deployment completed!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Application URLs:"
echo "   - http://localhost:5000"
echo "   - http://$(hostname -I | awk '{print $1}'):5000"
echo "   - http://legal.albpetrol.al (if Cloudflare tunnel configured)"
echo ""
echo "📧 Admin email: it.system@albpetrol.al"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status                    - Check status"
echo "   pm2 logs albpetrol-legal      - View logs"
echo "   pm2 restart albpetrol-legal   - Restart app"
echo "   ./update.sh                   - Update from Git"
echo ""
echo "🔍 Testing application..."

# Test if application responds
sleep 5
if curl -s http://localhost:5000 > /dev/null; then
    echo "✅ Application is responding on port 5000"
else
    echo "⚠️  Application may not be fully started yet. Check with: pm2 logs albpetrol-legal"
fi