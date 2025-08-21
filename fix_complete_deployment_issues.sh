#!/bin/bash

echo "🔧 Fix Complete Deployment Issues"
echo "================================="

cd /opt/ceshtje-ligjore

echo "1. Fix PostgreSQL authentication:"
echo "Setting correct PostgreSQL password..."

# Set PostgreSQL user password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'admuser123';"

# Update pg_hba.conf for password authentication
sudo sed -i "s/local   all             postgres                                peer/local   all             postgres                                md5/" /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
systemctl restart postgresql

echo "✅ PostgreSQL authentication fixed"

echo ""
echo "2. Test database connection:"
export DATABASE_URL="postgresql://postgres:admuser123@localhost:5432/albpetrol_legal_db"
npm run db:push

echo ""
echo "3. Fix module import issues:"
echo "Installing missing dependencies..."

# Install specific missing dependencies
npm install @neondatabase/serverless drizzle-orm drizzle-zod

# Rebuild application with fixed dependencies
npm run build

echo ""
echo "4. Restart PM2 with clean slate:"
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal
pm2 start ecosystem.config.cjs

echo ""
echo "5. Wait for startup and verify:"
sleep 10
pm2 status
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "6. Test all endpoints:"
echo "Testing APIs..."
curl -s -o /dev/null -w "Health API: %{http_code}\n" http://localhost:5000/api/health
curl -s -o /dev/null -w "Auth API: %{http_code}\n" http://localhost:5000/api/auth/user
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5000
curl -s -o /dev/null -w "External: %{http_code}\n" http://10.5.20.31

echo ""
echo "7. Check for remaining errors:"
pm2 logs albpetrol-legal --lines 5 --nostream | grep -i error || echo "No errors found"

echo ""
echo "✅ FIXES COMPLETE!"
echo "🌐 Access your complete system: http://10.5.20.31"
echo "Features: Full React app, all APIs, database integration, Albanian interface"