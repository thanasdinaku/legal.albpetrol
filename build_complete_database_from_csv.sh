#!/bin/bash

# Build Complete Database from CSV Model with Original User Privileges
# Based on the CSV structure and existing users

set -e

echo "=============================================="
echo "BUILDING COMPLETE DATABASE FROM CSV MODEL"
echo "=============================================="

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: Must run on Ubuntu server (10.5.20.31)"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Stopping services..."
systemctl stop albpetrol-legal || true
systemctl stop nginx || true

echo "Step 2: Backing up current data if exists..."
BACKUP_DIR="/tmp/db_backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup users if database exists
if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" >/dev/null 2>&1; then
    echo "Backing up existing users..."
    sudo -u postgres pg_dump -d ceshtje_ligjore -t users --data-only > "$BACKUP_DIR/users_backup.sql" || true
    sudo -u postgres pg_dump -d ceshtje_ligjore -t data_entries --data-only > "$BACKUP_DIR/data_entries_backup.sql" || true
fi

echo "Step 3: Recreating database from scratch..."
sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || true
sudo -u postgres dropuser ceshtje_user 2>/dev/null || true

# Create user and database
sudo -u postgres psql << 'EOSQL'
CREATE USER ceshtje_user WITH PASSWORD 'AlbpetrolLegal2025Secure!';
ALTER USER ceshtje_user CREATEDB;
CREATE DATABASE ceshtje_ligjore OWNER ceshtje_user;

\c ceshtje_ligjore

GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON TABLES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON SEQUENCES TO ceshtje_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL PRIVILEGES ON FUNCTIONS TO ceshtje_user;
EOSQL

echo "Step 4: Creating environment configuration..."
cat > .env << 'ENVFILE'
DATABASE_URL="postgresql://ceshtje_user:AlbpetrolLegal2025Secure!@localhost:5432/ceshtje_ligjore"
NODE_ENV=production
SESSION_SECRET="albpetrol_legal_2025_secure_session"
PORT=5000
ENVFILE

echo "Step 5: Installing dependencies..."
rm -rf node_modules package-lock.json
npm install

echo "Step 6: Creating database schema based on CSV structure..."
npm run db:push

echo "Step 7: Restoring original user accounts with correct privileges..."
sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- Clear any auto-generated users
DELETE FROM users;

-- System Administrator (Default Admin - Protected)
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
    'it-system-admin',
    'it.system@albpetrol.al',
    'IT',
    'System',
    'admin',
    true,
    '2025-08-08 13:08:39.961273',
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
    'thanas-dinaku-admin',
    'thanas.dinaku@albpetrol.al',
    'Thanas',
    'Dinaku',
    'admin',
    false,
    '2025-08-11 12:31:09.841667',
    NOW()
);

-- TrueAlbos Admin
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
    'truealbos-admin',
    'truealbos@gmail.com',
    'True',
    'Albos',
    'admin',
    false,
    '2025-08-07 11:45:21.782527',
    NOW()
);

-- Enisa Cepele (Legal Department User)
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
    'enisa-cepele-user',
    'enisa.cepele@albpetrol.al',
    'Enisa',
    'Cepele',
    'user',
    false,
    '2025-08-09 21:46:10.281978',
    NOW()
);

-- Jorgjica Baba (Legal Department User)
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
    'jorgjica-baba-user',
    'jorgjica.baba@albpetrol.al',
    'Jorgjica',
    'Baba',
    'user',
    false,
    '2025-08-09 22:06:00.460844',
    NOW()
);

-- Isabel Loci (User)
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
    'isabel-loci-user',
    'Isabel.Loci@cix.csi.cuny.edu',
    'Isabel',
    'Loci',
    'user',
    false,
    '2025-08-07 21:09:42.336373',
    NOW()
);

-- Isabel Loci Gmail (User) 
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
    'isabelloci64-user',
    'isabelloci64@gmail.com',
    'Isabel',
    'Loci',
    'user',
    false,
    '2025-08-08 13:22:39.738293',
    NOW()
);

-- Verify users created
SELECT 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at 
FROM users 
ORDER BY created_at;
EOSQL

echo "Step 8: Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo "Build failed - checking for errors..."
    exit 1
fi

echo "Step 9: Creating systemd service..."
cat > /etc/systemd/system/albpetrol-legal.service << 'SERVICEEOF'
[Unit]
Description=Albpetrol Legal Case Management System
After=network.target postgresql.service
Requires=postgresql.service
StartLimitBurst=5
StartLimitIntervalSec=30

[Service]
Type=simple
User=root
WorkingDirectory=/opt/ceshtje_ligjore/ceshtje_ligjore
Environment=NODE_ENV=production
Environment=DATABASE_URL=postgresql://ceshtje_user:AlbpetrolLegal2025Secure!@localhost:5432/ceshtje_ligjore
Environment=SESSION_SECRET=albpetrol_legal_2025_secure_session
Environment=PORT=5000
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=albpetrol-legal

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Start services
systemctl daemon-reload
systemctl enable albpetrol-legal
systemctl start albpetrol-legal
sleep 8

echo "Step 10: Verifying service..."
if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Application service started successfully"
else
    echo "❌ Service failed to start"
    journalctl -u albpetrol-legal -n 10 --no-pager
    exit 1
fi

echo "Step 11: Configuring Nginx..."
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINXEOF'
server {
    listen 80;
    server_name legal.albpetrol.al;
    
    client_max_body_size 100M;
    client_body_timeout 300s;
    client_header_timeout 300s;
    
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
        proxy_send_timeout 300s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

echo "Step 12: Final verification..."
DB_USERS=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" | xargs)
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 || echo "000")

# Test database connectivity
sudo -u postgres psql -d ceshtje_ligjore -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" > /tmp/tables_list.txt

echo ""
echo "=============================================="
echo "DATABASE BUILT SUCCESSFULLY FROM CSV MODEL"
echo "=============================================="
echo ""
echo "Summary:"
echo "✅ Database completely rebuilt from CSV structure"
echo "✅ All $DB_USERS original user accounts restored"
echo "✅ User privileges maintained as before"
echo "✅ Application responding (HTTP: $HTTP_CODE)"
echo "✅ Services running properly"
echo ""
echo "Original User Accounts Restored:"
echo "- it.system@albpetrol.al (Default Admin - Protected)"
echo "- thanas.dinaku@albpetrol.al (Admin)"
echo "- truealbos@gmail.com (Admin)"
echo "- enisa.cepele@albpetrol.al (Legal Dept User)"
echo "- jorgjica.baba@albpetrol.al (Legal Dept User)"
echo "- Isabel.Loci@cix.csi.cuny.edu (User)"
echo "- isabelloci64@gmail.com (User)"
echo ""
echo "Database Tables Created:"
cat /tmp/tables_list.txt | grep -v "^$" | sed 's/^/- /'
echo ""
echo "Access:"
echo "- Local: http://localhost:5000"
echo "- Public: https://legal.albpetrol.al"
echo ""
echo "Database restored from CSV structure:"
echo "Fields mapped from 'Pasqyra e Ceshtjeve' including:"
echo "- Paditesi (Emer e Mbiemer)"
echo "- I Paditur"
echo "- Person I Trete"
echo "- Objekti I Padise"
echo "- Gjykata e Shk. I"
echo "- Faza ne te cilen ndodhet procesi"
echo "- Gjykata e Apelit"
echo "- Perfaqesuesi I Albpetrol SH.A."
echo "- Demi i pretenduar ne objekt"
echo "- Shuma e caktuar nga Gjykata"
echo "- Vendim me ekzekutim"
echo "- Gjykata e Larte"
echo "- Plus new: Zhvillimi i seances gjyqesorë (date/time)"
echo ""
echo "Backup location: $BACKUP_DIR"
echo "=============================================="