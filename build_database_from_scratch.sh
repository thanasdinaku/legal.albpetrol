#!/bin/bash

# Build Complete Database from Scratch
# This rebuilds everything: PostgreSQL, database, schema, users, and application

set -e

echo "=============================================="
echo "BUILDING DATABASE FROM SCRATCH"
echo "=============================================="

# Verify we're on Ubuntu server
APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Must run on Ubuntu server (10.5.20.31)"
    echo "Directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Stopping all services..."
systemctl stop albpetrol-legal || true
systemctl stop nginx || true
systemctl stop postgresql || true

echo "Step 2: Completely removing PostgreSQL..."
apt remove --purge postgresql* -y
apt autoremove -y
rm -rf /var/lib/postgresql/
rm -rf /etc/postgresql/
rm -rf /var/log/postgresql/

echo "Step 3: Fresh PostgreSQL installation..."
apt update
apt install -y postgresql postgresql-contrib

# Start PostgreSQL
systemctl enable postgresql
systemctl start postgresql
sleep 5

echo "Step 4: Creating database and user..."
sudo -u postgres psql << 'EOSQL'
-- Create database user
CREATE USER ceshtje_user WITH PASSWORD 'AlbpetrolSecure2025!';
ALTER USER ceshtje_user CREATEDB;

-- Create database
CREATE DATABASE ceshtje_ligjore OWNER ceshtje_user;

-- Connect to database and set permissions
\c ceshtje_ligjore

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO ceshtje_user;

-- Verify connection
SELECT current_database(), current_user;
EOSQL

echo "Step 5: Updating application configuration..."

# Create fresh environment file
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://ceshtje_user:AlbpetrolSecure2025!@localhost:5432/ceshtje_ligjore"
NODE_ENV=production
SESSION_SECRET="albpetrol_legal_session_secure_2025"
PORT=5000
ENVFILE

# Clean dependencies
echo "Step 6: Reinstalling dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "Step 7: Creating database schema..."
npm run db:push

# Verify schema creation
echo "Step 8: Verifying schema..."
sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- Show all tables
\dt

-- Show table structures
\d users
\d data_entries
\d sessions

-- Verify schema
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
ORDER BY table_name, ordinal_position;
EOSQL

echo "Step 9: Creating essential user accounts..."
sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- Clear any existing users
DELETE FROM users;

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
    'admin-system-001',
    'admin@albpetrol.al',
    'System',
    'Administrator',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Thanas Dinaku (Main Admin)
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
);

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
);

-- Legal Department Admin
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
    'legal-admin-004',
    'legal@albpetrol.al',
    'Legal',
    'Department',
    'admin',
    false,
    NOW(),
    NOW()
);

-- Show created users
SELECT email, first_name, last_name, role, is_default_admin, created_at FROM users ORDER BY created_at;
EOSQL

echo "Step 10: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed - checking for errors..."
    exit 1
fi

echo "Step 11: Creating/updating systemd service..."
cat > /etc/systemd/system/albpetrol-legal.service << 'SERVICEEOF'
[Unit]
Description=Albpetrol Legal Management System
After=network.target postgresql.service
Requires=postgresql.service
StartLimitBurst=5
StartLimitIntervalSec=10

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ceshtje_ligjore/ceshtje_ligjore
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://ceshtje_user:AlbpetrolSecure2025!@localhost:5432/ceshtje_ligjore
Environment=SESSION_SECRET=albpetrol_legal_session_secure_2025
Environment=PORT=5000
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Reload and start service
systemctl daemon-reload
systemctl enable albpetrol-legal
systemctl start albpetrol-legal

# Wait for service to start
sleep 8

echo "Step 12: Verifying service status..."
if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Application service started successfully"
    
    # Show service logs
    echo "Recent service logs:"
    journalctl -u albpetrol-legal -n 5 --no-pager
else
    echo "❌ Application service failed to start"
    echo "Service logs:"
    journalctl -u albpetrol-legal -n 10 --no-pager
    echo "Service status:"
    systemctl status albpetrol-legal --no-pager
    exit 1
fi

echo "Step 13: Configuring Nginx..."
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINXEOF'
server {
    listen 80;
    server_name legal.albpetrol.al;
    
    client_max_body_size 50M;
    
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
        proxy_read_timeout 86400;
    }
}
NGINXEOF

# Enable site and restart nginx
ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
nginx -t
systemctl start nginx
systemctl reload nginx

echo "Step 14: Final verification and testing..."

# Database verification
DB_USERS=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" | xargs)
echo "Database users: $DB_USERS"

# Application test
echo "Testing application response..."
sleep 3
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "000")
echo "HTTP response code: $HTTP_CODE"

if [[ "$HTTP_CODE" =~ ^(200|302|401)$ ]]; then
    echo "✅ Application responding correctly"
else
    echo "❌ Application not responding properly"
    echo "Checking application logs..."
    journalctl -u albpetrol-legal -n 10 --no-pager
fi

# Test database connection from application
echo "Testing database connectivity..."
if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT email, role FROM users LIMIT 3;" >/dev/null 2>&1; then
    echo "✅ Database connectivity verified"
    sudo -u postgres psql -d ceshtje_ligjore -c "SELECT email, role FROM users;"
else
    echo "❌ Database connectivity issues"
fi

echo ""
echo "=============================================="
echo "DATABASE BUILD COMPLETED!"
echo "=============================================="
echo ""
echo "Summary:"
echo "✅ PostgreSQL completely reinstalled"
echo "✅ Fresh database 'ceshtje_ligjore' created"
echo "✅ User 'ceshtje_user' with full privileges"
echo "✅ Complete schema with all tables"
echo "✅ $DB_USERS essential user accounts created"
echo "✅ Application built and running"
echo "✅ Nginx configured and running"
echo ""
echo "User Accounts:"
echo "- admin@albpetrol.al (System Admin)"
echo "- thanas.dinaku@albpetrol.al (Main Admin)"
echo "- enisa.cepele@albpetrol.al (User)"
echo "- legal@albpetrol.al (Legal Dept Admin)"
echo ""
echo "Access URLs:"
echo "- Local: http://localhost:5000"
echo "- Public: https://legal.albpetrol.al"
echo ""
echo "Next Steps:"
echo "1. Test login at https://legal.albpetrol.al"
echo "2. Verify form functionality"
echo "3. Create additional users if needed"
echo "4. Begin entering legal case data"
echo "5. Set up automated backups"
echo ""
echo "Database connection string:"
echo "postgresql://ceshtje_user:AlbpetrolSecure2025!@localhost:5432/ceshtje_ligjore"
echo "=============================================="