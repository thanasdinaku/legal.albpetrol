#!/bin/bash

# Complete Ubuntu Deployment Script for Albanian Legal Case Management System
# This script sets up everything from scratch on Ubuntu 24.04.3 LTS

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
if [[ $EUID -eq 0 ]]; then
   log_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system
log_info "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
log_info "Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
log_info "Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
log_info "Installing Nginx..."
sudo apt install -y nginx

# Install Git
log_info "Installing Git..."
sudo apt install -y git

# Install PM2 for process management
log_info "Installing PM2..."
sudo npm install -g pm2

# Create application directory
APP_DIR="/opt/ceshtje-ligjore"
log_info "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone the repository
log_info "Cloning repository..."
cd $APP_DIR
git clone https://github.com/thanasdinaku/ceshtje_ligjore.git .

# Install dependencies
log_info "Installing Node.js dependencies..."
npm install

# Set up PostgreSQL database
log_info "Setting up PostgreSQL database..."

# Generate random password for database
DB_PASSWORD=$(openssl rand -base64 32)
DB_NAME="ceshtje_ligjore"
DB_USER="ceshtje_user"

# Create database and user
sudo -u postgres psql << EOF
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

log_info "Database credentials saved to .env file"

# Build the application
log_info "Building the application..."
npm run build

# Run database migrations
log_info "Running database migrations..."
npm run db:push

# Create admin user
log_info "Creating admin user..."
node -e "
const { db } = require('./server/db.js');
const { users } = require('./shared/schema.js');
const bcrypt = require('bcrypt');

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('Admin2025!', 10);
    await db.insert(users).values({
      email: 'it.system@albpetrol.al',
      firstName: 'Administrator',
      lastName: 'i Sistemit',
      role: 'admin',
      isDefaultAdmin: true,
      password: hashedPassword
    }).onConflictDoNothing();
    console.log('Admin user created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();
"

# Create PM2 ecosystem file
log_info "Creating PM2 configuration..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'server/index.js',
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

# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown $USER:$USER /var/log/pm2

# Configure Nginx
log_info "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/albpetrol-legal << EOF
server {
    listen 80;
    server_name legal.albpetrol.al;

    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req zone=api burst=20 nodelay;

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

# Configure rate limiting
sudo tee -a /etc/nginx/nginx.conf << EOF

# Rate limiting configuration
http {
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/m;
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Start and enable services
log_info "Starting services..."
sudo systemctl restart nginx
sudo systemctl enable nginx

# Start the application with PM2
log_info "Starting the application..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup

# Create backup script
log_info "Creating backup script..."
sudo tee /usr/local/bin/backup-albpetrol-legal.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/albpetrol-legal"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Database backup
sudo -u postgres pg_dump $DB_NAME > \$BACKUP_DIR/database_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/application_\$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +7 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-albpetrol-legal.sh

# Add daily backup cron job
echo "0 2 * * * /usr/local/bin/backup-albpetrol-legal.sh" | sudo crontab -

# Create systemd service for automatic startup
sudo tee /etc/systemd/system/albpetrol-legal.service << EOF
[Unit]
Description=Albpetrol Legal Case Management
After=network.target postgresql.service

[Service]
Type=forking
User=$USER
WorkingDirectory=$APP_DIR
ExecStart=/usr/bin/pm2 start ecosystem.config.js
ExecReload=/usr/bin/pm2 reload ecosystem.config.js
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl enable albpetrol-legal.service

# Configure firewall
log_info "Configuring firewall..."
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable

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
echo "NEXT STEPS:"
echo "1. Configure Cloudflare tunnel for external access"
echo "2. Set up SSL certificate"
echo "3. Configure email settings in .env file"
echo "4. Test the application at http://localhost:5000"
echo ""
echo "IMPORTANT FILES:"
echo "- Application: $APP_DIR"
echo "- Environment: $APP_DIR/.env"
echo "- Nginx Config: /etc/nginx/sites-available/albpetrol-legal"
echo "- PM2 Config: $APP_DIR/ecosystem.config.js"
echo "- Backup Script: /usr/local/bin/backup-albpetrol-legal.sh"
echo ""
echo "USEFUL COMMANDS:"
echo "- Check app status: pm2 status"
echo "- View app logs: pm2 logs albpetrol-legal"
echo "- Restart app: pm2 restart albpetrol-legal"
echo "- Check nginx: sudo systemctl status nginx"
echo "- Run backup: sudo /usr/local/bin/backup-albpetrol-legal.sh"
echo "=========================================="