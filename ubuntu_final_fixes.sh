#!/bin/bash

echo "🔧 Final Ubuntu Server Fixes"
echo "============================"

# Commands to run on Ubuntu server to fix remaining issues

cat << 'FINAL_FIXES'

# 1. Fix the exclamation mark issue in password (bash escaping)
echo "🔐 Recreating PostgreSQL user with proper password..."
sudo -u postgres psql << 'POSTGRES_FIX'
DROP USER IF EXISTS albpetrol_user;
CREATE USER albpetrol_user WITH PASSWORD 'SecurePass2025';
ALTER USER albpetrol_user CREATEDB;
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO albpetrol_user;
POSTGRES_FIX

# 2. Fix .env file (escape the exclamation mark)
echo "📝 Creating corrected .env file..."
cat > .env << 'ENV_FIXED'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://albpetrol_user:SecurePass2025@localhost:5432/albpetrol_legal_db
SESSION_SECRET=albpetrol_legal_system_super_secure_session_secret_2025
REPL_ID=ceshtje-ligjore
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31,localhost
ISSUER_URL=https://replit.com/oidc
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=UPDATE_THIS_PASSWORD
EMAIL_FROM=it.system@albpetrol.al
ENV_FIXED

# 3. Install vite as production dependency to fix build
echo "📦 Installing vite as production dependency..."
npm install vite --save

# 4. Clear npm cache and reinstall
echo "🧹 Clearing caches and reinstalling..."
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 5. Try alternative build approach
echo "🔨 Building with alternative approach..."
# Try building just the frontend first
npx vite build --outDir dist/public

# Then build the backend
npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist

# 6. Test database connection
echo "🗄️ Testing database connection..."
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database();"

# 7. Setup database schema
echo "📊 Setting up database schema..."
PGPASSWORD=SecurePass2025 npx drizzle-kit push

# 8. Update admin email
echo "📧 Updating admin email..."
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db << 'SQL_ADMIN'
-- Create admin user if not exists
INSERT INTO users (id, email, role, is_default_admin, "firstName", "lastName") 
VALUES ('admin-system', 'it.system@albpetrol.al', 'admin', true, 'IT', 'System')
ON CONFLICT (id) DO UPDATE SET email = 'it.system@albpetrol.al';

-- Update any existing admin users
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;

-- Show admin users
SELECT id, email, role, is_default_admin FROM users WHERE role = 'admin' OR is_default_admin = true;
SQL_ADMIN

# 9. Restart PM2 with updated environment
echo "🔄 Restarting PM2..."
pm2 reload ecosystem.config.cjs --update-env

# 10. Final status check
echo "✅ Final status check..."
sleep 3
pm2 status
echo ""
echo "🌐 Testing application response..."
curl -I http://localhost:5000
echo ""
echo "📋 Recent logs:"
pm2 logs albpetrol-legal --lines 5 --nostream

FINAL_FIXES

echo ""
echo "📋 Copy and paste the commands above to fix all remaining issues"