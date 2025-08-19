#!/bin/bash

# Complete Ubuntu Deployment Script for Albanian Legal Case Management System
# Run this script on your Ubuntu 24.04.3 LTS server

set -e  # Exit on any error

echo "=========================================="
echo "Albanian Legal Case Management Deployment"
echo "Starting fresh installation..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   log_error "This script must be run as root (use sudo -i)"
   exit 1
fi

# Create non-root user for application if needed
if ! id "appuser" &>/dev/null; then
    log_info "Creating application user..."
    useradd -m -s /bin/bash appuser
    usermod -aG sudo appuser
fi

# Update system
log_info "Updating system packages..."
apt update && apt upgrade -y

# Install required packages
log_info "Installing required packages..."
apt install -y curl wget git build-essential

# Install Node.js 20
log_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# Install PostgreSQL
log_info "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Install Nginx
log_info "Installing Nginx..."
apt install -y nginx

# Install PM2 for process management
log_info "Installing PM2..."
npm install -g pm2

# Stop any existing services
log_info "Stopping existing services..."
systemctl stop nginx || true
systemctl stop postgresql || true
pm2 kill || true

# Start PostgreSQL
log_info "Starting PostgreSQL..."
systemctl start postgresql
systemctl enable postgresql

# Create application directory
APP_DIR="/opt/ceshtje-ligjore"
log_info "Creating application directory: $APP_DIR"
rm -rf $APP_DIR
mkdir -p $APP_DIR
chown appuser:appuser $APP_DIR

# Clone the repository as appuser
log_info "Cloning repository..."
sudo -u appuser git clone https://github.com/thanasdinaku/ceshtje_ligjore.git $APP_DIR

# Change to app directory
cd $APP_DIR

# Install dependencies
log_info "Installing Node.js dependencies..."
sudo -u appuser npm install

# Set up PostgreSQL database
log_info "Setting up PostgreSQL database..."

# Generate random password for database
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME="ceshtje_ligjore"
DB_USER="ceshtje_user"

# Create database and user
sudo -u postgres psql << EOF
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;
CREATE DATABASE $DB_NAME;
CREATE USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;
\q
EOF

# Create environment file
log_info "Creating environment configuration..."
cat > .env << EOF
# Database Configuration
DATABASE_URL=postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGDATABASE=$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD

# Application Configuration
NODE_ENV=production
PORT=5000

# Session Configuration
SESSION_SECRET=$(openssl rand -base64 64)

# Admin Configuration
ADMIN_EMAIL=it.system@albpetrol.al
ADMIN_PASSWORD=Admin2025!

# Email Configuration (Optional - configure later)
# SMTP_HOST=
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
# EMAIL_FROM=
EOF

chown appuser:appuser .env

log_info "Database credentials saved to .env file"

# Build the application
log_info "Building the application..."
sudo -u appuser npm run build

# Run database migrations
log_info "Running database migrations..."
sudo -u appuser npm run db:push

# Create PM2 ecosystem file
log_info "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    log_file: '/var/log/pm2/albpetrol-legal.log'
  }]
}
EOF

chown appuser:appuser ecosystem.config.js

# Create log directory
mkdir -p /var/log/pm2
chown appuser:appuser /var/log/pm2

# Configure Nginx
log_info "Configuring Nginx..."
cat > /etc/nginx/sites-available/albpetrol-legal << EOF
server {
    listen 80;
    server_name legal.albpetrol.al localhost;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Handle large file uploads
    client_max_body_size 10M;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
nginx -t

# Start services
log_info "Starting services..."
systemctl restart nginx
systemctl enable nginx

# Start the application with PM2 as appuser
log_info "Starting the application..."
sudo -u appuser pm2 start $APP_DIR/ecosystem.config.js
sudo -u appuser pm2 save

# Setup PM2 startup
sudo -u appuser pm2 startup | grep -E "sudo.*pm2" | sh

# Configure firewall
log_info "Configuring firewall..."
ufw allow 22
ufw allow 80
ufw allow 443
ufw allow 5000
ufw --force enable

# Create a simple health check script
cat > /usr/local/bin/check-app-health.sh << EOF
#!/bin/bash
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "Application is running"
    exit 0
else
    echo "Application is not responding, restarting..."
    sudo -u appuser pm2 restart albpetrol-legal
    exit 1
fi
EOF

chmod +x /usr/local/bin/check-app-health.sh

# Display final information
log_info "Deployment completed successfully!"
echo ""
echo "=========================================="
echo "DEPLOYMENT SUMMARY"
echo "=========================================="
echo "Application: Albanian Legal Case Management System"
echo "Location: $APP_DIR"
echo "Database: PostgreSQL"
echo "Web Server: Nginx"
echo "Process Manager: PM2"
echo ""
echo "DATABASE CREDENTIALS:"
echo "Database Name: $DB_NAME"
echo "Database User: $DB_USER"
echo "Database Password: $DB_PASSWORD"
echo ""
echo "ADMIN CREDENTIALS:"
echo "Email: it.system@albpetrol.al"
echo "Password: Admin2025!"
echo ""
echo "ACCESS URLS:"
echo "Local: http://localhost:5000"
echo "External: http://10.5.20.31:5000"
echo "Domain: http://legal.albpetrol.al (if DNS configured)"
echo ""
echo "USEFUL COMMANDS:"
echo "- Check app status: sudo -u appuser pm2 status"
echo "- View app logs: sudo -u appuser pm2 logs albpetrol-legal"
echo "- Restart app: sudo -u appuser pm2 restart albpetrol-legal"
echo "- Check nginx: systemctl status nginx"
echo "- Health check: /usr/local/bin/check-app-health.sh"
echo ""
echo "IMPORTANT FILES:"
echo "- Application: $APP_DIR"
echo "- Environment: $APP_DIR/.env"
echo "- Nginx Config: /etc/nginx/sites-available/albpetrol-legal"
echo "- PM2 Config: $APP_DIR/ecosystem.config.js"
echo "=========================================="

# Final health check
sleep 5
log_info "Running final health check..."
if /usr/local/bin/check-app-health.sh; then
    log_info "✅ Deployment successful! Application is running."
    log_info "🌐 You can access it at: http://10.5.20.31:5000"
else
    log_error "❌ Application health check failed. Check logs with: sudo -u appuser pm2 logs"
fi