#!/bin/bash

echo "🚀 CaseRecord System - Ubuntu 22.04 Deployment Script"
echo "======================================================"
echo "Albanian Legal Case Management System"
echo "Repository: https://github.com/thanasdinaku/legal.albpetrol"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

# Configuration
REPO_URL="https://github.com/thanasdinaku/legal.albpetrol.git"
APP_DIR="/opt/ceshtje-ligjore"
DB_NAME="albpetrol_legal_db"
DB_USER="albpetrol_user"
DB_PASS="SecurePass2025"
ADMIN_EMAIL="it.system@albpetrol.al"

echo "📋 Configuration:"
echo "   Repository: $REPO_URL"
echo "   App Directory: $APP_DIR"
echo "   Database: $DB_NAME"
echo "   Admin Email: $ADMIN_EMAIL"
echo ""
read -p "Press Enter to continue..."

# Update system
echo "🔄 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20 LTS
echo "📦 Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt-get install -y nodejs git curl build-essential

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
echo "⚙️ Installing PM2..."
npm install -g pm2

# Setup PostgreSQL
echo "🔐 Setting up PostgreSQL database..."
sudo -u postgres psql << SQL_SETUP
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
ALTER USER $DB_USER CREATEDB;
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
\c $DB_NAME
GRANT ALL ON SCHEMA public TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO $DB_USER;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO $DB_USER;
SQL_SETUP

# Configure PostgreSQL authentication
echo "🔑 Configuring PostgreSQL authentication..."
PG_HBA=$(find /etc/postgresql -name pg_hba.conf | head -1)
sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" "$PG_HBA"
systemctl restart postgresql

# Create application directory
echo "📁 Creating application directory..."
mkdir -p $APP_DIR
cd $APP_DIR

# Clone repository
echo "📥 Cloning repository from GitHub..."
if [ -d ".git" ]; then
    echo "Repository exists, pulling latest changes..."
    git pull origin main
else
    echo "Cloning fresh repository..."
    git clone $REPO_URL .
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create production environment file
echo "📝 Creating production .env file..."
cat > .env << ENV_FILE
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SESSION_SECRET=$(openssl rand -base64 32)
REPL_ID=ceshtje-ligjore
REPLIT_DOMAINS=legal.albpetrol.al,localhost
ISSUER_URL=https://replit.com/oidc

# Email configuration
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=$ADMIN_EMAIL
SMTP_PASS=UPDATE_THIS_PASSWORD
SMTP_FROM=$ADMIN_EMAIL
EMAIL_FROM=$ADMIN_EMAIL

# Albania timezone
TZ=Europe/Tirane
ENV_FILE

# Build application
echo "🔨 Building application..."
npm run build

# Setup database schema
echo "🗄️ Setting up database schema..."
export DATABASE_URL="postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME"
npm run db:push

# Create logs directory
mkdir -p logs

# Create PM2 ecosystem configuration
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.cjs << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: '5000',
      TZ: 'Europe/Tirane'
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
PM2_CONFIG

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

# Setup PM2 startup
echo "🔧 Setting up PM2 auto-start..."
pm2 startup systemd -u root --hp /root

# Install Nginx
echo "🌐 Installing Nginx..."
apt-get install -y nginx

# Configure Nginx
cat > /etc/nginx/sites-available/ceshtje-ligjore << 'NGINX_CONFIG'
server {
    listen 80;
    server_name legal.albpetrol.al _;

    client_max_body_size 100M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
NGINX_CONFIG

# Enable Nginx site
ln -sf /etc/nginx/sites-available/ceshtje-ligjore /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# Create management scripts
echo "📝 Creating management scripts..."

# Update script
cat > update.sh << 'UPDATE_SCRIPT'
#!/bin/bash
echo "🔄 Updating CaseRecord System..."
cd /opt/ceshtje-ligjore
git pull origin main
npm install
npm run build
npm run db:push
pm2 restart albpetrol-legal
echo "✅ Update completed!"
pm2 status
UPDATE_SCRIPT
chmod +x update.sh

# Backup script
cat > backup.sh << 'BACKUP_SCRIPT'
#!/bin/bash
BACKUP_DIR="/opt/ceshtje-ligjore/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=SecurePass2025 pg_dump -U albpetrol_user albpetrol_legal_db > "$BACKUP_DIR/backup_$TIMESTAMP.sql"
echo "✅ Database backup created: $BACKUP_DIR/backup_$TIMESTAMP.sql"
# Keep only last 7 backups
ls -t $BACKUP_DIR/backup_*.sql | tail -n +8 | xargs -r rm
BACKUP_SCRIPT
chmod +x backup.sh

# Verification script
cat > verify.sh << 'VERIFY_SCRIPT'
#!/bin/bash
echo "🔍 CaseRecord System Status"
echo "================================"
echo ""
echo "📊 PM2 Status:"
pm2 status
echo ""
echo "🌐 Application:"
curl -I http://localhost:5000 2>&1 | head -5
echo ""
echo "🗄️  Database:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database();" 2>&1
echo ""
echo "🌐 Nginx:"
systemctl status nginx | head -5
VERIFY_SCRIPT
chmod +x verify.sh

# Set timezone
echo "🕐 Setting system timezone to Europe/Tirane..."
timedatectl set-timezone Europe/Tirane

# Final checks
echo ""
echo "=================================================="
echo "✅ CaseRecord System Deployed Successfully!"
echo "=================================================="
echo ""
sleep 3

echo "📊 PM2 Status:"
pm2 status
echo ""

echo "🌐 Testing Application..."
sleep 2
curl -I http://localhost:5000 2>&1 | head -5
echo ""

echo "=================================================="
echo "🎉 Deployment Complete!"
echo "=================================================="
echo ""
echo "🌐 Access URLs:"
echo "   http://localhost:5000"
echo "   http://$(hostname -I | awk '{print $1}'):5000"
echo ""
echo "🔐 Admin:"
echo "   Email: $ADMIN_EMAIL"
echo ""
echo "⚙️  Commands:"
echo "   pm2 status              - Check status"
echo "   pm2 logs                - View logs"
echo "   pm2 restart albpetrol-legal - Restart"
echo "   ./update.sh             - Update from GitHub"
echo "   ./backup.sh             - Backup database"
echo "   ./verify.sh             - Verify system"
echo ""
echo "⚠️  IMPORTANT:"
echo "   1. Edit .env and update SMTP_PASS"
echo "   2. Then run: pm2 restart albpetrol-legal"
echo ""
echo "📁 Directory: $APP_DIR"
echo "🗄️  Database: $DB_NAME"
echo "🕐 Timezone: Europe/Tirane"
echo ""
