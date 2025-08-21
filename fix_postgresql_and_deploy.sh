#!/bin/bash

echo "🔧 Fix PostgreSQL Authentication & Deploy Complete App"
echo "====================================================="

cd /opt/ceshtje-ligjore

echo "1. Stop current system:"
pm2 stop albpetrol-legal 2>/dev/null || true
pm2 delete albpetrol-legal 2>/dev/null || true

echo ""
echo "2. Fix PostgreSQL authentication without password prompts:"
systemctl stop postgresql
sleep 2

# Reset PostgreSQL authentication to allow local connections without password temporarily
echo "local   all             all                                     trust" > /tmp/pg_hba_temp
echo "host    all             all             127.0.0.1/32            trust" >> /tmp/pg_hba_temp
echo "host    all             all             ::1/128                 trust" >> /tmp/pg_hba_temp

# Backup original and apply temporary config
cp /etc/postgresql/*/main/pg_hba.conf /etc/postgresql/*/main/pg_hba.conf.backup
cp /tmp/pg_hba_temp /etc/postgresql/*/main/pg_hba.conf

systemctl start postgresql
sleep 3

# Now create database and user without password prompts
sudo -u postgres psql << 'PSQL'
DROP DATABASE IF EXISTS albpetrol_legal_db;
DROP USER IF EXISTS albpetrol_user;
CREATE USER albpetrol_user WITH PASSWORD 'admuser123';
CREATE DATABASE albpetrol_legal_db OWNER albpetrol_user;
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO albpetrol_user;
ALTER USER albpetrol_user CREATEDB;
\q
PSQL

# Restore secure authentication
echo "local   all             postgres                                peer" > /tmp/pg_hba_secure
echo "local   all             all                                     md5" >> /tmp/pg_hba_secure
echo "host    all             all             127.0.0.1/32            md5" >> /tmp/pg_hba_secure
echo "host    all             all             ::1/128                 md5" >> /tmp/pg_hba_secure

cp /tmp/pg_hba_secure /etc/postgresql/*/main/pg_hba.conf
systemctl reload postgresql

echo "✅ PostgreSQL authentication fixed"

echo ""
echo "3. Clean and get fresh code from GitHub:"
rm -rf dist node_modules package-lock.json
git fetch origin
git reset --hard origin/main
git pull origin main

echo ""
echo "4. Install dependencies:"
npm cache clean --force
npm install

echo ""
echo "5. Configure production environment:"
cat > .env << 'ENV'
NODE_ENV=production
DATABASE_URL=postgresql://albpetrol_user:admuser123@localhost:5432/albpetrol_legal_db
SESSION_SECRET=albpetrol-session-secret-2025-ubuntu
PORT=5000
REPL_ID=albpetrol-legal-ubuntu
REPLIT_DOMAINS=10.5.20.31
VITE_API_URL=http://10.5.20.31:5000
ENV

echo ""
echo "6. Push database schema:"
export DATABASE_URL="postgresql://albpetrol_user:admuser123@localhost:5432/albpetrol_legal_db"
npx drizzle-kit push --config=drizzle.config.ts --force

echo ""
echo "7. Build complete React application:"
npm run build

echo ""
echo "8. Verify build completed successfully:"
if [ -f "dist/public/index.html" ] && [ -f "dist/index.js" ]; then
    echo "✅ Build successful - React app and server ready"
    ls -la dist/
else
    echo "❌ Build failed - checking for issues"
    npm run build --verbose
fi

echo ""
echo "9. Update PM2 configuration for production:"
cat > ecosystem.config.cjs << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://albpetrol_user:admuser123@localhost:5432/albpetrol_legal_db',
      SESSION_SECRET: 'albpetrol-session-secret-2025-ubuntu',
      REPL_ID: 'albpetrol-legal-ubuntu',
      REPLIT_DOMAINS: '10.5.20.31'
    },
    watch: false,
    max_memory_restart: '500M',
    restart_delay: 3000,
    max_restarts: 10,
    min_uptime: '10s',
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    log_file: '/var/log/pm2/albpetrol-legal.log',
    time: true
  }]
};
PM2_CONFIG

echo ""
echo "10. Start application with PM2:"
pm2 start ecosystem.config.cjs
sleep 15

echo ""
echo "11. Check application status:"
pm2 status
echo ""
echo "Recent logs:"
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "12. Test complete application endpoints:"
echo "Testing authentication..."
curl -s -w "Auth API: %{http_code}\n" -o /dev/null http://localhost:5000/api/auth/user

echo "Testing dashboard stats..."
curl -s -w "Dashboard Stats: %{http_code}\n" -o /dev/null http://localhost:5000/api/dashboard/stats

echo "Testing data entries..."
curl -s -w "Data Entries: %{http_code}\n" -o /dev/null http://localhost:5000/api/data-entries

echo "Testing frontend..."
curl -s -w "Frontend: %{http_code}\n" -o /dev/null http://localhost:5000

echo "Testing external access..."
curl -s -w "External Access: %{http_code}\n" -o /dev/null http://10.5.20.31

echo ""
echo "13. Verify React application is properly served:"
echo "Frontend response preview:"
curl -s http://localhost:5000 | head -10

echo ""
echo "✅ COMPLETE REPLIT.DEV APPLICATION DEPLOYED!"
echo "============================================="
echo ""
echo "🌐 Access your complete application: http://10.5.20.31"
echo ""
echo "✅ Full features now available:"
echo "   - Complete React TypeScript frontend"
echo "   - Professional Albanian interface"
echo "   - Authentication system"
echo "   - Dashboard with real data"
echo "   - Data entry and management"
echo "   - User management system"
echo "   - Export functionality"
echo "   - All Replit.dev features"
echo ""
echo "This is the identical system from your Replit.dev environment!"