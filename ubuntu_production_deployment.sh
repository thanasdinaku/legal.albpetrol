#!/bin/bash

# Ubuntu Production Deployment Script for Albanian Legal Case Management System
# Domain: legal.albpetrol.al
# Tunnel: c51774f0-433f-40c0-a0b6-b7d3145fd95f.cfargotunnel.com

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=========================================${NC}"
echo -e "${BLUE}Albanian Legal Case Management System${NC}"
echo -e "${BLUE}Production Deployment Script${NC}"
echo -e "${BLUE}=========================================${NC}"
echo ""

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Update system packages
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install required system packages
print_status "Installing system dependencies..."
sudo apt install -y \
    curl \
    wget \
    git \
    nginx \
    postgresql \
    postgresql-contrib \
    nodejs \
    npm \
    build-essential \
    python3-certbot-nginx \
    ufw \
    fail2ban \
    logrotate

# Install Node.js 20 LTS
print_status "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify Node.js installation
node_version=$(node --version)
npm_version=$(npm --version)
print_status "Node.js version: $node_version"
print_status "npm version: $npm_version"

# Create application directory
APP_DIR="/opt/ceshtje-ligjore"
print_status "Creating application directory: $APP_DIR"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

# Clone repository
print_status "Cloning repository..."
cd /opt
if [ -d "ceshtje-ligjore" ]; then
    print_warning "Directory exists, updating..."
    cd ceshtje-ligjore
    git pull origin main
else
    git clone https://github.com/thanasdinaku/ceshtje_ligjore.git ceshtje-ligjore
    cd ceshtje-ligjore
fi

# Install npm dependencies
print_status "Installing npm dependencies..."
npm install

# Build the application
print_status "Building application..."
npm run build

# Create PostgreSQL database and user
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE ceshtje_ligjore;" || print_warning "Database may already exist"
sudo -u postgres psql -c "CREATE USER ceshtje_user WITH ENCRYPTED PASSWORD 'SecurePassword2025!';" || print_warning "User may already exist"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;"
sudo -u postgres psql -c "ALTER USER ceshtje_user CREATEDB;"

# Create environment file
print_status "Creating environment configuration..."
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://ceshtje_user:SecurePassword2025!@localhost:5432/ceshtje_ligjore

# Email Configuration (Update these values)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=it.system@albpetrol.al
EMAIL_PASS=your_app_password_here
EMAIL_FROM=it.system@albpetrol.al

# Session Secret (Generate a new one)
SESSION_SECRET=$(openssl rand -base64 32)

# Application Settings
APP_NAME=Sistemi i Menaxhimit të Rasteve Ligjore
APP_DOMAIN=legal.albpetrol.al
EOF

# Run database migrations
print_status "Running database migrations..."
npm run db:push

# Create systemd service
print_status "Creating systemd service..."
sudo tee /etc/systemd/system/albpetrol-legal.service > /dev/null << EOF
[Unit]
Description=Albanian Legal Case Management System
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$APP_DIR
Environment=NODE_ENV=production
ExecStart=/usr/bin/node server/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=albpetrol-legal

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=$APP_DIR
ProtectHome=true

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
print_status "Enabling and starting service..."
sudo systemctl daemon-reload
sudo systemctl enable albpetrol-legal
sudo systemctl start albpetrol-legal

# Configure Nginx
print_status "Configuring Nginx..."
sudo tee /etc/nginx/sites-available/legal-albpetrol << EOF
server {
    listen 80;
    server_name legal.albpetrol.al;

    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Rate limiting
    limit_req_zone \$binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone \$binary_remote_addr zone=login:10m rate=5r/m;

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
        proxy_read_timeout 86400;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Login endpoint rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:5000;
    }
}
EOF

# Enable Nginx site
sudo ln -sf /etc/nginx/sites-available/legal-albpetrol /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# Configure UFW Firewall
print_status "Configuring firewall..."
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# Configure Fail2Ban
print_status "Configuring Fail2Ban..."
sudo tee /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-req-limit]
enabled = true
filter = nginx-req-limit
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Install and configure Cloudflared tunnel
print_status "Installing Cloudflare Tunnel..."
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
rm cloudflared-linux-amd64.deb

# Create cloudflared config directory
sudo mkdir -p /etc/cloudflared

# Create tunnel configuration
print_status "Creating Cloudflare tunnel configuration..."
sudo tee /etc/cloudflared/config.yml << EOF
tunnel: c51774f0-433f-40c0-a0b6-b7d3145fd95f
credentials-file: /etc/cloudflared/credentials.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
EOF

print_warning "IMPORTANT: You need to:"
print_warning "1. Copy your tunnel credentials to /etc/cloudflared/credentials.json"
print_warning "2. Set proper permissions: sudo chmod 600 /etc/cloudflared/credentials.json"
print_warning "3. Start the tunnel service: sudo systemctl enable --now cloudflared"

# Create tunnel service
sudo tee /etc/systemd/system/cloudflared.service << EOF
[Unit]
Description=Cloudflare Tunnel
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/local/bin/cloudflared tunnel --config /etc/cloudflared/config.yml run
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

# Create log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/albpetrol-legal << EOF
/var/log/albpetrol-legal/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 0640 $USER $USER
    postrotate
        systemctl reload albpetrol-legal
    endscript
}
EOF

# Create backup script
print_status "Creating backup script..."
sudo tee /usr/local/bin/backup-albpetrol-legal.sh << EOF
#!/bin/bash
BACKUP_DIR="/opt/backups/albpetrol-legal"
DATE=\$(date +%Y%m%d_%H%M%S)

mkdir -p \$BACKUP_DIR

# Database backup
pg_dump -h localhost -U ceshtje_user ceshtje_ligjore > \$BACKUP_DIR/database_\$DATE.sql

# Application backup
tar -czf \$BACKUP_DIR/application_\$DATE.tar.gz -C /opt ceshtje-ligjore

# Keep only last 30 days of backups
find \$BACKUP_DIR -name "*.sql" -mtime +30 -delete
find \$BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: \$DATE"
EOF

sudo chmod +x /usr/local/bin/backup-albpetrol-legal.sh

# Add backup cron job
print_status "Setting up daily backup cron job..."
(crontab -l 2>/dev/null; echo "0 2 * * * /usr/local/bin/backup-albpetrol-legal.sh >> /var/log/backup.log 2>&1") | crontab -

# Final status check
print_status "Checking service status..."
sudo systemctl status albpetrol-legal --no-pager
sudo systemctl status nginx --no-pager

print_status "Checking application health..."
sleep 5
curl -s http://localhost:5000/api/health || print_warning "Health check failed - check logs"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Copy tunnel credentials to /etc/cloudflared/credentials.json"
echo "2. Set credentials permissions: sudo chmod 600 /etc/cloudflared/credentials.json"
echo "3. Start tunnel: sudo systemctl enable --now cloudflared"
echo "4. Configure Cloudflare WAF rule for API endpoints (see fix_cloudflare_tunnel_api.sh)"
echo "5. Update EMAIL_PASS in .env with actual app password"
echo "6. Test the application at https://legal.albpetrol.al"
echo ""
echo -e "${BLUE}Important Files:${NC}"
echo "- Application: /opt/ceshtje-ligjore"
echo "- Service: /etc/systemd/system/albpetrol-legal.service"
echo "- Nginx config: /etc/nginx/sites-available/legal-albpetrol"
echo "- Logs: journalctl -u albpetrol-legal -f"
echo "- Tunnel config: /etc/cloudflared/config.yml"
echo ""
echo -e "${BLUE}Useful Commands:${NC}"
echo "- Restart app: sudo systemctl restart albpetrol-legal"
echo "- Check logs: sudo journalctl -u albpetrol-legal -n 50"
echo "- Nginx reload: sudo systemctl reload nginx"
echo "- Manual backup: sudo /usr/local/bin/backup-albpetrol-legal.sh"
echo ""