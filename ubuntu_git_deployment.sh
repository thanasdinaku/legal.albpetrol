#!/bin/bash

echo "🚀 Git-based Ubuntu Deployment for Albpetrol Legal System"
echo "========================================================="
echo ""

# Configuration
REPO_URL="https://github.com/thanasdinaku/ceshtje_ligjore.git"
APP_DIR="/opt/ceshtje-ligjore"
APP_USER="albpetrol"
DB_NAME="albpetrol_legal_db"
DB_USER="albpetrol_user"

echo "📋 This script will:"
echo "   1. Clone/pull from GitHub repository"
echo "   2. Install dependencies"
echo "   3. Build the application"
echo "   4. Setup database"
echo "   5. Configure PM2"
echo "   6. Start the application"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

echo "🔧 UBUNTU SERVER DEPLOYMENT COMMANDS:"
echo "====================================="
echo ""

cat << 'DEPLOYMENT_SCRIPT'
#!/bin/bash

# Update system packages
apt update && apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs git

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Create application user
useradd -m -s /bin/bash albpetrol || true

# Setup PostgreSQL
sudo -u postgres createuser --superuser albpetrol_user || true
sudo -u postgres createdb albpetrol_legal_db || true
sudo -u postgres psql -c "ALTER USER albpetrol_user PASSWORD 'SecurePassword123!';" || true

# Create application directory
mkdir -p /opt/ceshtje-ligjore
cd /opt/ceshtje-ligjore

# Stop existing PM2 processes
pm2 stop albpetrol-legal || true
pm2 delete albpetrol-legal || true

# Clone/update repository
if [ -d ".git" ]; then
    echo "📥 Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    echo "📥 Cloning repository..."
    git clone https://github.com/thanasdinaku/ceshtje_ligjore.git .
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🔨 Building application..."
npm run build

# Setup environment variables
cat > .env << 'ENV_EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://albpetrol_user:SecurePassword123!@localhost:5432/albpetrol_legal_db
SESSION_SECRET=very_secure_session_secret_change_this_in_production
REPL_ID=your_repl_id
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31
ISSUER_URL=https://replit.com/oidc

# Email configuration for it.system@albpetrol.al
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=your_email_password_here
EMAIL_FROM=it.system@albpetrol.al
ENV_EOF

# Create ecosystem.config.cjs for PM2
cat > ecosystem.config.cjs << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '5000'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    watch: false
  }]
};
PM2_EOF

# Create logs directory
mkdir -p logs

# Setup database schema
echo "🗄️ Setting up database..."
npx drizzle-kit push

# Update admin email to it.system@albpetrol.al
echo "📧 Updating admin email..."
psql -d albpetrol_legal_db -U albpetrol_user << 'SQL_EOF'
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;
SQL_EOF

# Set correct permissions
chown -R albpetrol:albpetrol /opt/ceshtje-ligjore

# Start application with PM2
echo "🚀 Starting application..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status

echo ""
echo "✅ Deployment completed successfully!"
echo "🌐 Application URL: http://$(hostname -I | awk '{print $1}'):5000"
echo "📧 Admin email: it.system@albpetrol.al"
echo "🔧 Check logs: pm2 logs albpetrol-legal"
echo ""
echo "🔄 To update in the future, run:"
echo "   cd /opt/ceshtje-ligjore"
echo "   git pull origin main"
echo "   npm install"
echo "   npm run build"
echo "   pm2 restart albpetrol-legal"

DEPLOYMENT_SCRIPT