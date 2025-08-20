#!/bin/bash

echo "🚀 Deploying Albpetrol Legal System from Git Repository"
echo "======================================================"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

# Configuration
APP_DIR="/opt/ceshtje-ligjore"
LOG_DIR="$APP_DIR/logs"

# Create application directory
mkdir -p $APP_DIR
cd $APP_DIR

echo "📦 Installing dependencies..."
npm install

echo "🔨 Building application..."
npm run build

echo "📝 Setting up environment configuration..."
if [ ! -f .env ]; then
    echo "Creating .env from template..."
    cp .env.template .env
    echo ""
    echo "⚠️  IMPORTANT: Please edit .env file with your specific configuration:"
    echo "   - Database credentials"
    echo "   - Email SMTP settings"
    echo "   - Session secret"
    echo ""
    echo "📝 Edit the file: nano .env"
    echo ""
    read -p "Press Enter after editing .env file to continue..."
fi

echo "🗄️ Setting up database schema..."
npx drizzle-kit push

echo "📧 Updating admin email to it.system@albpetrol.al..."
psql -d albpetrol_legal_db -U albpetrol_user << 'SQL_EOF'
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;
SQL_EOF

echo "📁 Creating logs directory..."
mkdir -p $LOG_DIR

echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

echo "💾 Saving PM2 configuration..."
pm2 save

echo "🔧 Setting up PM2 startup..."
pm2 startup

echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
pm2 status

echo ""
echo "🌐 Application should be running at:"
echo "   - http://localhost:5000"
echo "   - http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "🔧 Useful commands:"
echo "   pm2 status                    - Check application status"
echo "   pm2 logs albpetrol-legal      - View application logs"
echo "   pm2 restart albpetrol-legal   - Restart application"
echo ""
echo "📧 Admin login: it.system@albpetrol.al"
echo ""
echo "🔄 To update in the future:"
echo "   cd $APP_DIR"
echo "   ./update.sh"