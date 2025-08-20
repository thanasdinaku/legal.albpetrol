#!/bin/bash

echo "🗄️ Complete Database Setup for Ubuntu Server"
echo "============================================="

cat << 'DATABASE_SETUP'

# 1. Create the database first
echo "Creating database..."
sudo -u postgres psql << 'CREATE_DB'
-- Create database
CREATE DATABASE albpetrol_legal_db OWNER albpetrol_user;

-- Grant all privileges
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO albpetrol_user;

-- Connect to the database and grant schema privileges
\c albpetrol_legal_db
GRANT ALL ON SCHEMA public TO albpetrol_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO albpetrol_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO albpetrol_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO albpetrol_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO albpetrol_user;

-- Show databases
\l
CREATE_DB

# 2. Test database connection
echo "Testing database connection..."
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database(), current_user;"

# 3. Install drizzle-kit locally (not globally)
echo "Installing drizzle-kit locally..."
npm install drizzle-kit --save-dev

# 4. Setup database schema using local drizzle-kit
echo "Setting up database schema..."
PGPASSWORD=SecurePass2025 npx drizzle-kit push --verbose

# 5. Create admin user manually if schema creation worked
echo "Creating admin user..."
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db << 'ADMIN_USER'
-- Create sessions table first (required for auth)
CREATE TABLE IF NOT EXISTS sessions (
    sid VARCHAR PRIMARY KEY,
    sess JSONB NOT NULL,
    expire TIMESTAMP NOT NULL
);

-- Create users table if not exists
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE,
    "firstName" VARCHAR,
    "lastName" VARCHAR,
    "profileImageUrl" VARCHAR,
    role VARCHAR DEFAULT 'user',
    "isDefaultAdmin" BOOLEAN DEFAULT false,
    "createdAt" TIMESTAMP DEFAULT NOW(),
    "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Insert admin user
INSERT INTO users (id, email, "firstName", "lastName", role, "isDefaultAdmin") 
VALUES ('admin-system', 'it.system@albpetrol.al', 'IT', 'System', 'admin', true)
ON CONFLICT (id) DO UPDATE SET 
    email = 'it.system@albpetrol.al',
    "firstName" = 'IT',
    "lastName" = 'System',
    role = 'admin',
    "isDefaultAdmin" = true;

-- Show created admin user
SELECT id, email, role, "isDefaultAdmin" FROM users WHERE role = 'admin';
ADMIN_USER

# 6. Restart PM2 to reload environment
echo "Restarting application..."
pm2 restart albpetrol-legal

# 7. Wait and test
echo "Waiting for application to start..."
sleep 5

# 8. Test application
echo "Testing application response..."
curl -I http://localhost:5000

# 9. Check PM2 logs for any errors
echo "Recent application logs:"
pm2 logs albpetrol-legal --lines 10 --nostream

DATABASE_SETUP

echo ""
echo "Run these commands on Ubuntu server to fix database issues"