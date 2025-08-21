#!/bin/bash

echo "🚀 Transfer Complete Replit.dev App to Ubuntu"
echo "============================================="

# Navigate to the correct directory
cd /opt/ceshtje-ligjore

echo "1. Stop current system:"
pm2 stop albpetrol-legal 2>/dev/null || true
pm2 delete albpetrol-legal 2>/dev/null || true

echo ""
echo "2. Clean and get fresh code:"
rm -rf dist node_modules package-lock.json
git fetch origin
git reset --hard origin/main
git pull origin main

echo ""
echo "3. Install dependencies:"
npm cache clean --force
npm install

echo ""
echo "4. Setup database:"
systemctl restart postgresql
sleep 3

sudo -u postgres psql << 'PSQL'
DROP DATABASE IF EXISTS albpetrol_legal_db;
DROP USER IF EXISTS albpetrol_user;
CREATE USER albpetrol_user WITH PASSWORD 'admuser123';
CREATE DATABASE albpetrol_legal_db OWNER albpetrol_user;
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal_db TO albpetrol_user;
\q
PSQL

echo ""
echo "5. Configure environment:"
cat > .env << 'ENV'
NODE_ENV=production
DATABASE_URL=postgresql://albpetrol_user:admuser123@localhost:5432/albpetrol_legal_db
SESSION_SECRET=albpetrol-session-2025
PORT=5000
REPL_ID=albpetrol-ubuntu
REPLIT_DOMAINS=10.5.20.31
ENV

echo ""
echo "6. Push database schema:"
export DATABASE_URL="postgresql://albpetrol_user:admuser123@localhost:5432/albpetrol_legal_db"
npx drizzle-kit push --config=drizzle.config.ts --force

echo ""
echo "7. Build React app:"
npm run build

echo ""
echo "8. Start with PM2:"
pm2 start ecosystem.config.cjs
sleep 10

echo ""
echo "9. Test endpoints:"
curl -w "Auth: %{http_code}\n" -o /dev/null -s http://localhost:5000/api/auth/user
curl -w "Stats: %{http_code}\n" -o /dev/null -s http://localhost:5000/api/dashboard/stats
curl -w "Frontend: %{http_code}\n" -o /dev/null -s http://localhost:5000
curl -w "External: %{http_code}\n" -o /dev/null -s http://10.5.20.31

echo ""
echo "✅ COMPLETE! Access at: http://10.5.20.31"
echo "This is the full Replit.dev application with all features!"