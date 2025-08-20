#!/bin/bash

echo "🚀 Deploying REAL Replit Application to Ubuntu Server"
echo "================================================"
echo ""
echo "This script deploys the actual Replit application, not a recreation."
echo ""

# Server details
SERVER="10.5.20.31"
USER="admuser"

# Check if deployment package exists
if [ ! -d "ubuntu_deployment_real" ]; then
    echo "❌ Error: ubuntu_deployment_real directory not found!"
    echo "Please run this script from the Replit project root."
    exit 1
fi

echo "📁 Deployment package contents:"
ls -la ubuntu_deployment_real/
echo ""

echo "🔧 MANUAL DEPLOYMENT COMMANDS FOR UBUNTU SERVER:"
echo "================================================"
echo ""
echo "1. Copy the entire 'ubuntu_deployment_real' folder to your Ubuntu server"
echo ""
echo "2. On Ubuntu server, run as root:"
echo ""

cat << 'UBUNTU_COMMANDS'
# Navigate to application directory
cd /opt/ceshtje-ligjore

# Stop existing PM2 process
pm2 stop albpetrol-legal || true
pm2 delete albpetrol-legal || true

# Backup current installation (optional)
mv dist dist_backup_$(date +%Y%m%d_%H%M%S) || true

# Copy the real Replit application files
cp -r /path/to/ubuntu_deployment_real/* .

# Install production dependencies
npm install --production

# Setup environment variables
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://albpetrol_user:your_password@localhost:5432/albpetrol_legal_db
SESSION_SECRET=your_very_secure_session_secret_here
REPL_ID=your_repl_id
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31
ISSUER_URL=https://replit.com/oidc

# Email configuration for it.system@albpetrol.al
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=your_email_password
EMAIL_FROM=it.system@albpetrol.al
ENV_EOF

# Create logs directory
mkdir -p logs

# Push database schema (creates/updates all tables)
npx drizzle-kit push

# Update admin email to it.system@albpetrol.al
chmod +x update_email_to_it_system.sh
./update_email_to_it_system.sh

# Start application with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Check status
pm2 status
pm2 logs albpetrol-legal

echo ""
echo "✅ Real Replit application deployed successfully!"
echo "🌐 Test: http://10.5.20.31:5000"
echo "📧 Admin email: it.system@albpetrol.al"
echo "🔧 Check PM2 logs: pm2 logs albpetrol-legal"
UBUNTU_COMMANDS

echo ""
echo "================================================"
echo ""
echo "📋 What's being deployed:"
echo "   ✅ Real React application with all components"
echo "   ✅ Complete Express.js backend with all routes"
echo "   ✅ Database schema with all tables"
echo "   ✅ Authentication system with 2FA support"
echo "   ✅ Email integration for it.system@albpetrol.al"
echo "   ✅ User management and role system"
echo "   ✅ Data entry and export functionality"
echo "   ✅ Albanian language interface"
echo "   ✅ All shadcn/ui components and styling"
echo ""
echo "🎯 This is your actual Replit application, not a copy!"
echo ""
echo "📖 For detailed instructions, see: ubuntu_deployment_real/REAL_DEPLOYMENT_GUIDE.md"