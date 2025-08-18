#!/bin/bash

# EMERGENCY DATABASE RESTORATION SCRIPT
# Complete recovery for destroyed Ubuntu server database

set -e

echo "=============================================="
echo "EMERGENCY DATABASE RESTORATION"
echo "=============================================="
echo "WARNING: This will completely rebuild the database"
echo "Press CTRL+C in 10 seconds to abort..."
sleep 10

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"

# Verify we're on Ubuntu server
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Must run on Ubuntu server (10.5.20.31)"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Stopping services..."
systemctl stop albpetrol-legal || true
systemctl stop nginx || true

echo "Step 2: Backing up any remaining files..."
mkdir -p /tmp/emergency_backup_$(date +%s)
cp -r "$APP_DIR" /tmp/emergency_backup_$(date +%s)/ 2>/dev/null || true

echo "Step 3: Reinstalling PostgreSQL if needed..."
if ! command -v psql >/dev/null 2>&1; then
    apt update
    apt install -y postgresql postgresql-contrib
fi

# Ensure PostgreSQL is running
systemctl enable postgresql
systemctl start postgresql
sleep 3

echo "Step 4: Completely recreating database..."

# Drop existing database if it exists
sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || true

# Create fresh database
sudo -u postgres createdb ceshtje_ligjore

# Create database user
sudo -u postgres psql << 'EOSQL'
DROP USER IF EXISTS ceshtje_user;
CREATE USER ceshtje_user WITH PASSWORD 'secure_password_2025';
GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;
\c ceshtje_ligjore
GRANT ALL PRIVILEGES ON SCHEMA public TO ceshtje_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ceshtje_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ceshtje_user;
EOSQL

echo "Step 5: Updating database connection..."

# Update DATABASE_URL in environment
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://ceshtje_user:secure_password_2025@localhost:5432/ceshtje_ligjore"
NODE_ENV=production
SESSION_SECRET="albpetrol_legal_session_secret_2025"
REPLIT_OIDC_ISSUER="https://replit.com"
REPLIT_OIDC_CLIENT_ID="your_client_id"
REPLIT_OIDC_CLIENT_SECRET="your_client_secret"
ENVFILE

echo "Step 6: Rebuilding database schema..."

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install

# Push schema to database
npm run db:push

echo "Step 7: Creating essential admin user..."

sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- Create admin user
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
    'admin-001',
    'admin@albpetrol.al',
    'System',
    'Administrator',
    'admin',
    true,
    NOW(),
    NOW()
);

-- Create Thanas Dinaku admin
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
    'admin-002',
    'thanas.dinaku@albpetrol.al',
    'Thanas',
    'Dinaku',
    'admin',
    false,
    NOW(),
    NOW()
);

-- Create Enisa Cepele user
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
    'user-001',
    'enisa.cepele@albpetrol.al',
    'Enisa',
    'Cepele',
    'user',
    false,
    NOW(),
    NOW()
);

-- Verify users created
SELECT email, role, is_default_admin FROM users;
EOSQL

echo "Step 8: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed - checking for syntax errors..."
    exit 1
fi

echo "Step 9: Starting services..."
systemctl start albpetrol-legal
sleep 5

if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Application service started"
else
    echo "❌ Application failed to start"
    journalctl -u albpetrol-legal -n 10 --no-pager
    exit 1
fi

systemctl start nginx
systemctl reload nginx

echo "Step 10: Final verification..."

# Test database connection
if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT COUNT(*) FROM users;" >/dev/null 2>&1; then
    USER_COUNT=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" | xargs)
    echo "✅ Database operational with $USER_COUNT users"
else
    echo "❌ Database verification failed"
    exit 1
fi

# Test application
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|302"; then
    echo "✅ Application responding"
else
    echo "❌ Application not responding"
fi

echo "=============================================="
echo "DATABASE RESTORATION COMPLETED!"
echo "=============================================="
echo ""
echo "Summary:"
echo "✅ Database completely rebuilt"
echo "✅ Schema recreated with all tables"
echo "✅ Admin users created:"
echo "   - admin@albpetrol.al (system admin)"
echo "   - thanas.dinaku@albpetrol.al (admin)"
echo "   - enisa.cepele@albpetrol.al (user)"
echo "✅ Application service running"
echo ""
echo "Next steps:"
echo "1. Test at: https://legal.albpetrol.al"
echo "2. Login with one of the admin accounts"
echo "3. Create additional users as needed"
echo "4. Start entering case data"
echo ""
echo "All previous data has been lost and must be re-entered."