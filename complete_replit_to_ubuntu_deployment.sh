#!/bin/bash

# Complete Replit.dev to Ubuntu Server Deployment Script
# This script deploys the identical Albanian Legal Case Management System from Replit.dev to Ubuntu

set -e  # Exit on any error

echo "=== Deploying Complete Replit.dev Application to Ubuntu Server ==="
echo "Starting deployment at: $(date)"

# Configuration
APP_DIR="/opt/ceshtje-ligjore"
BACKUP_DIR="/opt/ceshtje-ligjore-backup-$(date +%Y%m%d_%H%M%S)"
DB_NAME="albpetrol_legal_db"
DB_USER="legal_admin"
DB_PASSWORD="SecurePass2024!"
GITHUB_REPO="https://github.com/thanasdinaku/ceshtje_ligjore.git"
NODE_VERSION="20"

echo "1. Creating backup of existing deployment..."
if [ -d "$APP_DIR" ]; then
    sudo cp -r "$APP_DIR" "$BACKUP_DIR"
    echo "Backup created at: $BACKUP_DIR"
fi

echo "2. Installing required system dependencies..."
sudo apt update
sudo apt install -y curl wget git build-essential python3-pip postgresql postgresql-contrib nginx pm2 python3-venv

echo "3. Installing Node.js $NODE_VERSION..."
curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
sudo apt install -y nodejs

echo "4. Setting up PostgreSQL database..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure PostgreSQL with proper authentication
sudo -u postgres psql << EOF
-- Drop database if exists and recreate
DROP DATABASE IF EXISTS $DB_NAME;
DROP USER IF EXISTS $DB_USER;

-- Create new database and user
CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
ALTER USER $DB_USER CREATEDB;

-- Exit psql
\q
EOF

echo "5. Creating application directory..."
sudo mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "6. Cloning complete application from GitHub..."
if [ -d ".git" ]; then
    sudo git fetch origin
    sudo git reset --hard origin/main
    sudo git pull origin main
else
    sudo git clone "$GITHUB_REPO" .
fi

echo "7. Setting up environment variables..."
sudo tee .env > /dev/null << EOF
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
SESSION_SECRET=$(openssl rand -hex 32)

# Email Configuration (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@albpetrol.al
SENDGRID_FROM_NAME=Sistemi i Menaxhimit të Rasteve Ligjore

# Application Settings
APP_NAME=Legal Case Management System
APP_VERSION=1.0.0
ADMIN_EMAIL=it.system@albpetrol.al

# Security Settings
BCRYPT_ROUNDS=12
JWT_SECRET=$(openssl rand -hex 32)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload Settings
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/opt/ceshtje-ligjore/uploads

# Backup Settings
BACKUP_DIR=/opt/ceshtje-ligjore/backups
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL=daily
EOF

echo "8. Installing Node.js dependencies..."
sudo npm install --production

echo "9. Installing development dependencies for building..."
sudo npm install --save-dev

echo "10. Building the React application..."
sudo npm run build

echo "11. Setting up database schema..."
sudo npm run db:push

echo "12. Creating uploads and backups directories..."
sudo mkdir -p /opt/ceshtje-ligjore/uploads
sudo mkdir -p /opt/ceshtje-ligjore/backups
sudo mkdir -p /opt/ceshtje-ligjore/logs

echo "13. Setting up PM2 ecosystem configuration..."
sudo tee ecosystem.config.cjs > /dev/null << 'EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: './server/index.js',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/opt/ceshtje-ligjore/logs/combined.log',
    out_file: '/opt/ceshtje-ligjore/logs/out.log',
    error_file: '/opt/ceshtje-ligjore/logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024',
    watch: false,
    ignore_watch: ['node_modules', 'logs', 'uploads', 'backups'],
    restart_delay: 5000,
    max_restarts: 5,
    min_uptime: '10s'
  }]
};
EOF

echo "14. Building production server bundle..."
sudo npx esbuild server/index.ts --bundle --platform=node --target=node20 --outfile=server/index.js --external:pg-native --external:encoding

echo "15. Setting up Nginx reverse proxy..."
sudo tee /etc/nginx/sites-available/albpetrol-legal > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Main application
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
        
        # Timeouts
        proxy_connect_timeout 30s;
        proxy_send_timeout 30s;
        proxy_read_timeout 30s;
    }

    # API rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Login rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /dist/ {
        alias /opt/ceshtje-ligjore/dist/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Uploads
    location /uploads/ {
        alias /opt/ceshtje-ligjore/uploads/;
        expires 1h;
        add_header Cache-Control "private";
    }

    # Security.txt
    location /.well-known/security.txt {
        proxy_pass http://localhost:5000;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
    }

    # Block sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|config)$ {
        deny all;
    }
}
EOF

# Enable the site
sudo ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "16. Setting up proper permissions..."
sudo chown -R www-data:www-data /opt/ceshtje-ligjore
sudo chmod -R 755 /opt/ceshtje-ligjore
sudo chmod 600 /opt/ceshtje-ligjore/.env

echo "17. Setting up systemd service for PM2..."
sudo tee /etc/systemd/system/albpetrol-legal.service > /dev/null << 'EOF'
[Unit]
Description=Albpetrol Legal Case Management System
After=network.target postgresql.service

[Service]
Type=forking
User=www-data
WorkingDirectory=/opt/ceshtje-ligjore
Environment=NODE_ENV=production
ExecStart=/usr/bin/pm2 start ecosystem.config.cjs --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.cjs --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.cjs
PIDFile=/opt/ceshtje-ligjore/.pm2/pm2.pid
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

echo "18. Starting services..."
sudo systemctl daemon-reload
sudo systemctl enable postgresql
sudo systemctl enable nginx
sudo systemctl enable albpetrol-legal

# Start PostgreSQL if not running
sudo systemctl start postgresql

# Test Nginx configuration
sudo nginx -t

# Start/restart services
sudo systemctl restart nginx
sudo systemctl stop albpetrol-legal 2>/dev/null || true
sudo -u www-data pm2 delete all 2>/dev/null || true
sudo -u www-data pm2 start ecosystem.config.cjs --env production

echo "19. Setting up automatic database backups..."
sudo tee /opt/ceshtje-ligjore/scripts/backup_database.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/ceshtje-ligjore/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/database_backup_$DATE.sql"

mkdir -p "$BACKUP_DIR"
pg_dump -h localhost -U legal_admin -d albpetrol_legal_db > "$BACKUP_FILE"

# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "database_backup_*.sql" -mtime +7 -delete

echo "Database backup completed: $BACKUP_FILE"
EOF

sudo chmod +x /opt/ceshtje-ligjore/scripts/backup_database.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/ceshtje-ligjore/scripts/backup_database.sh") | sudo crontab -

echo "20. Creating default admin user..."
sudo -u www-data node -e "
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'albpetrol_legal_db',
  user: 'legal_admin',
  password: 'SecurePass2024!'
});

async function createAdmin() {
  try {
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await pool.query(\`
      INSERT INTO users (id, email, first_name, last_name, password, role, is_default_admin)
      VALUES (gen_random_uuid(), 'it.system@albpetrol.al', 'System', 'Administrator', \$1, 'admin', true)
      ON CONFLICT (email) DO UPDATE SET
        password = EXCLUDED.password,
        role = 'admin',
        is_default_admin = true
    \`, [hashedPassword]);
    console.log('Default admin user created/updated successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
"

echo "21. Setting up log rotation..."
sudo tee /etc/logrotate.d/albpetrol-legal > /dev/null << 'EOF'
/opt/ceshtje-ligjore/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0644 www-data www-data
    postrotate
        sudo -u www-data pm2 reloadLogs
    endscript
}
EOF

echo "22. Final system checks..."
sleep 5

# Check if services are running
echo "Checking PostgreSQL..."
sudo systemctl status postgresql --no-pager -l

echo "Checking Nginx..."
sudo systemctl status nginx --no-pager -l

echo "Checking PM2 application..."
sudo -u www-data pm2 list

echo "Checking application response..."
curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 && echo " - Application responding"

echo "23. Deployment summary..."
echo "=========================================="
echo "✅ Complete Replit.dev application deployed to Ubuntu!"
echo "📊 Database: PostgreSQL with albpetrol_legal_db"
echo "🚀 Application: Running on PM2 at port 5000"
echo "🌐 Web Server: Nginx reverse proxy on port 80"
echo "👤 Admin Login: it.system@albpetrol.al / admin123"
echo "🔒 Environment: Production ready with security headers"
echo "💾 Backups: Automated daily at 2 AM"
echo "📁 Application Directory: $APP_DIR"
echo "🔧 Logs: /opt/ceshtje-ligjore/logs/"
echo "=========================================="
echo ""
echo "🎯 Access your application at: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "⚙️  Management Commands:"
echo "   - View logs: sudo -u www-data pm2 logs"
echo "   - Restart app: sudo systemctl restart albpetrol-legal"
echo "   - Check status: sudo -u www-data pm2 status"
echo "   - Manual backup: /opt/ceshtje-ligjore/scripts/backup_database.sh"
echo ""
echo "🛡️  Security Notes:"
echo "   - Change default admin password after first login"
echo "   - Configure SendGrid API key for email notifications"
echo "   - Consider setting up SSL certificate for HTTPS"
echo ""
echo "Deployment completed successfully at: $(date)"