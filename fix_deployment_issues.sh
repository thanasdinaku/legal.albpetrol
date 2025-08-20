#!/bin/bash

echo "🔧 Fixing Ubuntu Deployment Issues"
echo "=================================="

# Commands to run on Ubuntu server

cat << 'FIX_COMMANDS'

# 1. Fix Vite build issue - install all dev dependencies
echo "📦 Installing all dependencies including dev dependencies..."
npm install

# 2. Install drizzle-kit globally to fix database issue
echo "🗄️ Installing drizzle-kit globally..."
npm install -g drizzle-kit

# 3. Fix PostgreSQL authentication
echo "🔐 Fixing PostgreSQL authentication..."
sudo -u postgres psql << 'POSTGRES_SETUP'
-- Create user if not exists
DO $$ 
BEGIN
   IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'albpetrol_user') THEN
      CREATE USER albpetrol_user WITH PASSWORD 'SecurePassword123!';
   END IF;
END
$$;

-- Create database if not exists
SELECT 'CREATE DATABASE albpetrol_legal_db OWNER albpetrol_user'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'albpetrol_legal_db')\gexec

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO albpetrol_user;
ALTER USER albpetrol_user CREATEDB;
POSTGRES_SETUP

# 4. Update PostgreSQL configuration for password authentication
echo "🔑 Configuring PostgreSQL authentication..."
sudo sed -i "s/#listen_addresses = 'localhost'/listen_addresses = 'localhost'/" /etc/postgresql/*/main/postgresql.conf

# Update pg_hba.conf to allow password authentication
sudo sed -i "s/local   all             all                                     peer/local   all             all                                     md5/" /etc/postgresql/*/main/pg_hba.conf
sudo sed -i "s/local   all             postgres                                peer/local   all             postgres                                md5/" /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql

# 5. Create proper .env file
echo "📝 Creating production .env file..."
cat > .env << 'ENV_FILE'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://albpetrol_user:SecurePassword123!@localhost:5432/albpetrol_legal_db
SESSION_SECRET=albpetrol_legal_system_super_secure_session_secret_2025
REPL_ID=ceshtje-ligjore
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31,localhost
ISSUER_URL=https://replit.com/oidc

# Email configuration for it.system@albpetrol.al
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=UPDATE_THIS_PASSWORD
EMAIL_FROM=it.system@albpetrol.al
ENV_FILE

# 6. Try building again
echo "🔨 Rebuilding application..."
npm run build

# 7. Setup database schema
echo "🗄️ Setting up database schema..."
npx drizzle-kit push

# 8. Update admin email
echo "📧 Updating admin email..."
PGPASSWORD=SecurePassword123! psql -h localhost -U albpetrol_user -d albpetrol_legal_db << 'SQL_UPDATE'
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;

SELECT email, role, is_default_admin 
FROM users 
WHERE role = 'admin' OR is_default_admin = true;
SQL_UPDATE

# 9. Restart PM2
echo "🔄 Restarting PM2..."
pm2 restart albpetrol-legal

# 10. Check final status
echo "✅ Final status check..."
pm2 status
pm2 logs albpetrol-legal --lines 5 --nostream

echo ""
echo "🌐 Test URLs:"
echo "   - http://localhost:5000"
echo "   - http://10.5.20.31:5000"

curl -I http://localhost:5000

FIX_COMMANDS

echo ""
echo "📋 Copy and paste the commands above on your Ubuntu server"
echo "   to fix the deployment issues."