#!/bin/bash

# Complete Replit.dev to Ubuntu Server Deployment Script
set -e

echo "=== Deploying Complete Replit.dev Application to Ubuntu Server ==="
echo "Starting deployment at: $(date)"

# Configuration
APP_DIR="/opt/ceshtje-ligjore"
BACKUP_DIR="/opt/ceshtje-ligjore-backup-$(date +%Y%m%d_%H%M%S)"
DB_NAME="albpetrol_legal_db" 
DB_USER="legal_admin"
DB_PASSWORD="SecurePass2024!"
GITHUB_REPO="https://github.com/thanasdinaku/ceshtje_ligjore.git"

echo "1. Creating backup of existing deployment..."
if [ -d "$APP_DIR" ]; then
    cp -r "$APP_DIR" "$BACKUP_DIR"
    echo "Backup created at: $BACKUP_DIR"
fi

echo "2. Installing required system dependencies..."
apt update
apt install -y curl wget git build-essential postgresql postgresql-contrib nginx

echo "3. Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

echo "4. Installing PM2 globally..."
npm install -g pm2

echo "5. Setting up PostgreSQL database..."
systemctl start postgresql
systemctl enable postgresql

# Configure PostgreSQL
sudo -u postgres psql << 'PSQL_EOF'
DROP DATABASE IF EXISTS albpetrol_legal_db;
DROP USER IF EXISTS legal_admin;
CREATE USER legal_admin WITH PASSWORD 'SecurePass2024!';
CREATE DATABASE albpetrol_legal_db OWNER legal_admin;
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO legal_admin;
ALTER USER legal_admin CREATEDB;
\q
PSQL_EOF

echo "6. Setting up application directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

echo "7. Cloning complete application from GitHub..."
if [ -d ".git" ]; then
    git fetch origin
    git reset --hard origin/main
    git pull origin main
else
    git clone "$GITHUB_REPO" .
fi

echo "8. Setting up environment variables..."
cat > .env << 'ENV_EOF'
DATABASE_URL=postgresql://legal_admin:SecurePass2024!@localhost:5432/albpetrol_legal_db
PGHOST=localhost
PGPORT=5432
PGDATABASE=albpetrol_legal_db
PGUSER=legal_admin
PGPASSWORD=SecurePass2024!
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_session_secret_here_change_this
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@albpetrol.al
SENDGRID_FROM_NAME=Sistemi i Menaxhimit të Rasteve Ligjore
APP_NAME=Legal Case Management System
APP_VERSION=1.0.0
ADMIN_EMAIL=it.system@albpetrol.al
BCRYPT_ROUNDS=12
JWT_SECRET=your_jwt_secret_here_change_this
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/opt/ceshtje-ligjore/uploads
BACKUP_DIR=/opt/ceshtje-ligjore/backups
BACKUP_RETENTION_DAYS=30
AUTO_BACKUP_ENABLED=true
AUTO_BACKUP_INTERVAL=daily
ENV_EOF

echo "9. Installing dependencies and building..."
npm install
npm run build
npm run db:push

echo "10. Creating directories..."
mkdir -p uploads backups logs scripts

echo "11. Setting up PM2 configuration..."
cat > ecosystem.config.cjs << 'PM2_EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'npm',
    args: 'start',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_file: '/opt/ceshtje-ligjore/logs/combined.log',
    out_file: '/opt/ceshtje-ligjore/logs/out.log',
    error_file: '/opt/ceshtje-ligjore/logs/error.log',
    merge_logs: true,
    max_memory_restart: '1G'
  }]
};
PM2_EOF

echo "12. Setting up Nginx..."
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINX_EOF'
server {
    listen 80;
    server_name _;
    
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

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
    }

    location /uploads/ {
        alias /opt/ceshtje-ligjore/uploads/;
    }
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

echo "13. Setting up permissions..."
chown -R www-data:www-data /opt/ceshtje-ligjore
chmod 600 /opt/ceshtje-ligjore/.env

echo "14. Starting services..."
nginx -t
systemctl restart nginx
systemctl enable nginx

pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs

echo "15. Creating admin user..."
node -e "
const { Pool } = require('pg');
const bcrypt = require('bcrypt');

const pool = new Pool({
  connectionString: 'postgresql://legal_admin:SecurePass2024!@localhost:5432/albpetrol_legal_db'
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
    console.log('Admin user created successfully');
  } catch (error) {
    console.error('Error creating admin user:', error);
  } finally {
    await pool.end();
  }
}

createAdmin();
" || echo "Admin user will be created on first application start"

echo "16. Final checks..."
sleep 5
pm2 list
curl -s -w "%{http_code}" http://localhost:5000 && echo " - Application responding"

echo ""
echo "=========================================="
echo "✅ Complete Replit.dev application deployed!"
echo "🌐 Access: http://$(hostname -I | awk '{print $1}')"
echo "👤 Admin: it.system@albpetrol.al / admin123"
echo "🔧 Logs: pm2 logs"
echo "⚙️  Status: pm2 status"
echo "=========================================="
echo "Deployment completed at: $(date)"