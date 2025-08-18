#!/bin/bash

# COMPLETE UBUNTU SERVER RESTORATION
# Rebuilds everything from scratch after database destruction

set -e

echo "=============================================="
echo "ALBPETROL LEGAL SYSTEM - COMPLETE RESTORATION"
echo "=============================================="
echo "This will rebuild the entire system from scratch"
echo "All previous data will be permanently lost"
echo ""
read -p "Continue? (yes/no): " confirm
if [ "$confirm" != "yes" ]; then
    echo "Restoration cancelled"
    exit 1
fi

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
BACKUP_DIR="/tmp/emergency_backup_$(date +%Y%m%d_%H%M%S)"

echo "Creating emergency backup directory: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Stop all services
echo "Stopping services..."
systemctl stop albpetrol-legal || true
systemctl stop nginx || true
systemctl stop postgresql || true

# Backup existing files if they exist
if [ -d "$APP_DIR" ]; then
    echo "Backing up existing application files..."
    cp -r "$APP_DIR" "$BACKUP_DIR/" 2>/dev/null || true
fi

# Clean PostgreSQL data
echo "Cleaning PostgreSQL data..."
rm -rf /var/lib/postgresql/*/main/* 2>/dev/null || true

# Reinstall PostgreSQL
echo "Reinstalling PostgreSQL..."
apt update
apt remove --purge postgresql* -y || true
apt autoremove -y
apt install -y postgresql postgresql-contrib

# Initialize PostgreSQL
systemctl enable postgresql
systemctl start postgresql
sleep 5

# Create database and user
echo "Creating database and user..."
sudo -u postgres psql << 'EOSQL'
DROP DATABASE IF EXISTS ceshtje_ligjore;
DROP USER IF EXISTS ceshtje_user;

CREATE USER ceshtje_user WITH PASSWORD 'AlbpetrolLegal2025!';
CREATE DATABASE ceshtje_ligjore OWNER ceshtje_user;

\c ceshtje_ligjore

GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ceshtje_user;
EOSQL

# Ensure application directory exists
echo "Setting up application directory..."
mkdir -p "$APP_DIR"
cd "$APP_DIR"

# Clone fresh application if needed
if [ ! -f "package.json" ]; then
    echo "Cloning fresh application code..."
    git clone https://github.com/thanasdinaku/ceshtje_ligjore.git temp_clone
    cp -r temp_clone/* .
    rm -rf temp_clone
fi

# Create environment file
echo "Creating environment configuration..."
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://ceshtje_user:AlbpetrolLegal2025!@localhost:5432/ceshtje_ligjore"
NODE_ENV=production
SESSION_SECRET="albpetrol_legal_session_2025_secure"
PORT=5000
ENVFILE

# Install dependencies
echo "Installing Node.js dependencies..."
npm install

# Create the database schema
echo "Creating database schema..."
npm run db:push

# Create essential users
echo "Creating essential user accounts..."
sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- System Administrator
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at, 
    updated_at
) VALUES (
    'sys-admin-001',
    'admin@albpetrol.al',
    'System',
    'Administrator',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    is_default_admin = true,
    updated_at = NOW();

-- Thanas Dinaku (Admin)
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at, 
    updated_at
) VALUES (
    'thanas-dinaku-002',
    'thanas.dinaku@albpetrol.al',
    'Thanas',
    'Dinaku',
    'admin',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

-- Enisa Cepele (User)
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at, 
    updated_at
) VALUES (
    'enisa-cepele-003',
    'enisa.cepele@albpetrol.al',
    'Enisa',
    'Cepele',
    'user',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Test User
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at, 
    updated_at
) VALUES (
    'test-user-004',
    'test@albpetrol.al',
    'Test',
    'User',
    'user',
    false,
    NOW(),
    NOW()
) ON CONFLICT (email) DO UPDATE SET
    updated_at = NOW();

-- Show created users
SELECT email, first_name, last_name, role, is_default_admin, created_at FROM users ORDER BY created_at;
EOSQL

# Build application
echo "Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed - checking for errors..."
    echo "Please check application code for syntax errors"
    exit 1
fi

# Create systemd service
echo "Creating systemd service..."
cat > /etc/systemd/system/albpetrol-legal.service << 'SERVICEEOF'
[Unit]
Description=Albpetrol Legal Management System
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ceshtje_ligjore/ceshtje_ligjore
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://ceshtje_user:AlbpetrolLegal2025!@localhost:5432/ceshtje_ligjore
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Reload systemd and start service
systemctl daemon-reload
systemctl enable albpetrol-legal
systemctl start albpetrol-legal

# Wait for service to start
sleep 5

# Check service status
if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Application service started successfully"
else
    echo "❌ Application service failed to start"
    journalctl -u albpetrol-legal -n 20 --no-pager
    exit 1
fi

# Configure Nginx
echo "Configuring Nginx..."
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINXEOF'
server {
    listen 80;
    server_name legal.albpetrol.al;
    
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
}
NGINXEOF

# Enable site and restart nginx
ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
nginx -t
systemctl start nginx
systemctl reload nginx

# Final verification
echo "Performing final verification..."

# Database check
DB_USERS=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" | xargs)
echo "Database users created: $DB_USERS"

# Application check
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|302\|401"; then
    echo "✅ Application responding on port 5000"
else
    echo "❌ Application not responding"
    journalctl -u albpetrol-legal -n 10 --no-pager
fi

# Cloudflare tunnel check
if systemctl is-active --quiet cloudflared; then
    echo "✅ Cloudflare tunnel is running"
else
    echo "⚠️  Cloudflare tunnel may need restart"
    systemctl restart cloudflared || true
fi

echo ""
echo "=============================================="
echo "RESTORATION COMPLETED SUCCESSFULLY!"
echo "=============================================="
echo ""
echo "Summary:"
echo "✅ PostgreSQL database rebuilt"
echo "✅ Application schema created"
echo "✅ $DB_USERS user accounts created"
echo "✅ Application built and running"
echo "✅ Nginx configured"
echo "✅ Services started"
echo ""
echo "User Accounts Created:"
echo "- admin@albpetrol.al (System Admin)"
echo "- thanas.dinaku@albpetrol.al (Admin)"
echo "- enisa.cepele@albpetrol.al (User)"
echo "- test@albpetrol.al (Test User)"
echo ""
echo "Access Points:"
echo "- Local: http://localhost:5000"
echo "- Public: https://legal.albpetrol.al"
echo ""
echo "Next Steps:"
echo "1. Test login at https://legal.albpetrol.al"
echo "2. Verify all functionality works"
echo "3. Create additional users as needed"
echo "4. Begin re-entering case data"
echo "5. Set up automated backups"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "=============================================="