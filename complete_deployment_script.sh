#!/bin/bash

echo "🚀 Complete Albpetrol Legal System Deployment Script"
echo "=================================================="
echo "This script deploys the Albanian Legal Case Management System"
echo "from GitHub to Ubuntu 24.04.3 LTS with full Git integration"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo "❌ Please run as root: sudo bash $0"
    exit 1
fi

# Configuration
REPO_URL="https://github.com/thanasdinaku/ceshtje_ligjore.git"
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

# Update system
echo "🔄 Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18+
echo "📦 Installing Node.js..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs git curl

# Install PostgreSQL
echo "🗄️ Installing PostgreSQL..."
apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
echo "⚙️ Installing PM2..."
npm install -g pm2

# Setup PostgreSQL
echo "🔐 Setting up PostgreSQL database..."
sudo -u postgres psql << SQL_SETUP
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
sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
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

# Configure Git identity
echo "🔧 Configuring Git identity..."
git config --global user.name "Ubuntu Server"
git config --global user.email "server@albpetrol.al"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install drizzle-kit locally
echo "🛠️ Installing drizzle-kit..."
npm install drizzle-kit --save-dev

# Create production environment file
echo "📝 Creating production .env file..."
cat > .env << ENV_FILE
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SESSION_SECRET=albpetrol_legal_system_super_secure_session_secret_2025
REPL_ID=ceshtje-ligjore
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31,localhost
ISSUER_URL=https://replit.com/oidc

# Email configuration for $ADMIN_EMAIL
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=$ADMIN_EMAIL
SMTP_PASS=UPDATE_THIS_PASSWORD
EMAIL_FROM=$ADMIN_EMAIL
ENV_FILE

# Build application
echo "🔨 Building application..."
npm run build

# Setup database schema
echo "🗄️ Setting up database schema..."
PGPASSWORD=$DB_PASS npx drizzle-kit push

# Create database tables and admin user
echo "👤 Creating admin user..."
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME << SQL_ADMIN
-- Create sessions table
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "profileImageUrl" VARCHAR,
    role VARCHAR DEFAULT 'user',
    "isDefaultAdmin" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insert admin user
INSERT INTO users (id, email, "firstName", "lastName", role, "isDefaultAdmin") 
VALUES ('admin-system', '$ADMIN_EMAIL', 'IT', 'System', 'admin', true)
ON CONFLICT (id) DO UPDATE SET 
    email = '$ADMIN_EMAIL',
    role = 'admin',
    "isDefaultAdmin" = true;

-- Show created admin user
SELECT id, email, role, "isDefaultAdmin" FROM users WHERE role = 'admin';
SQL_ADMIN

# Create PM2 ecosystem configuration
echo "⚙️ Creating PM2 configuration..."
cat > ecosystem.config.cjs << PM2_CONFIG
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
PM2_CONFIG

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Start application with PM2
echo "🚀 Starting application with PM2..."
pm2 start ecosystem.config.cjs

# Save PM2 configuration
echo "💾 Saving PM2 configuration..."
pm2 save

# Setup PM2 startup
echo "🔧 Setting up PM2 auto-start..."
pm2 startup

# Create update script
echo "📝 Creating update script..."
cat > update.sh << 'UPDATE_SCRIPT'
#!/bin/bash
echo "🔄 Updating Albpetrol Legal System..."
cd /opt/ceshtje-ligjore
git pull origin main
npm install
npm run build
PGPASSWORD=SecurePass2025 npx drizzle-kit push
pm2 restart albpetrol-legal
echo "✅ Update completed!"
pm2 status
UPDATE_SCRIPT

chmod +x update.sh

# Create verification script
echo "📝 Creating verification script..."
cat > verify.sh << 'VERIFY_SCRIPT'
#!/bin/bash
echo "🔍 Verifying Albpetrol Legal System..."
echo "PM2 Status:"
pm2 status
echo ""
echo "Application Response:"
curl -I http://localhost:5000
echo ""
echo "Database Connection:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database();"
echo ""
echo "Admin Users:"
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT email, role FROM users WHERE role = 'admin';"
VERIFY_SCRIPT

chmod +x verify.sh

# Final status check
echo ""
echo "✅ Deployment completed successfully!"
echo ""
echo "📊 Application Status:"
sleep 3
pm2 status

echo ""
echo "🌐 Testing application response..."
curl -I http://localhost:5000

echo ""
echo "🗄️ Database verification..."
PGPASSWORD=$DB_PASS psql -h localhost -U $DB_USER -d $DB_NAME -c "SELECT email, role FROM users WHERE role = 'admin';"

echo ""
echo "=================================================="
echo "✅ Albpetrol Legal System Deployment Complete!"
echo "=================================================="
echo ""
echo "🌐 Application URLs:"
echo "   - http://localhost:5000"
echo "   - http://$(hostname -I | awk '{print $1}'):5000"
echo "   - http://legal.albpetrol.al (configure Cloudflare tunnel)"
echo ""
echo "🔐 Admin Access:"
echo "   Email: $ADMIN_EMAIL"
echo "   Role: admin"
echo "   Password: Check application logs for 2FA setup"
echo ""
echo "🔧 Management Commands:"
echo "   pm2 status                    - Check application status"
echo "   pm2 logs albpetrol-legal      - View logs"
echo "   pm2 restart albpetrol-legal   - Restart application"
echo "   ./update.sh                   - Update from GitHub"
echo "   ./verify.sh                   - Verify deployment"
echo ""
echo "📁 Application directory: $APP_DIR"
echo "🗄️ Database: $DB_NAME"
echo "📧 Admin email: $ADMIN_EMAIL"
echo ""
echo "🎯 Features:"
echo "   ✅ Git version control with GitHub integration"
echo "   ✅ PostgreSQL database with admin user"
echo "   ✅ PM2 process management"
echo "   ✅ 2FA authentication system"
echo "   ✅ Professional Albanian interface"
echo "   ✅ Automatic updates via Git"
echo ""
echo "Next steps:"
echo "1. Update SMTP_PASS in .env for email functionality"
echo "2. Configure Cloudflare tunnel for external access"
echo "3. Set up regular backups"
echo ""
echo "🎉 Your Albanian Legal Case Management System is ready!"