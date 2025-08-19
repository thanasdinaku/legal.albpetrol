#!/bin/bash

# Debug script for Albanian Legal Case Management System
# Run this on the Ubuntu server to diagnose and fix issues

echo "=========================================="
echo "Albanian Legal Case Management Debug"
echo "=========================================="

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "This script must be run as root (use sudo -i)"
   exit 1
fi

echo "[INFO] Checking PM2 status..."
sudo -u appuser pm2 status

echo -e "\n[INFO] Checking PM2 logs..."
sudo -u appuser pm2 logs albpetrol-legal --lines 30

echo -e "\n[INFO] Checking if port 5000 is listening..."
netstat -tlnp | grep :5000

echo -e "\n[INFO] Checking Nginx status..."
systemctl status nginx --no-pager -l

echo -e "\n[INFO] Testing local connection..."
curl -I http://localhost:5000 2>/dev/null && echo "Local connection OK" || echo "Local connection failed"

echo -e "\n[INFO] Checking database connection..."
sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" 2>/dev/null && echo "Database connection OK" || echo "Database connection failed"

echo -e "\n[INFO] Checking environment file..."
if [ -f /opt/ceshtje-ligjore/.env ]; then
    echo "Environment file exists"
    echo "Database URL format:"
    grep "DATABASE_URL" /opt/ceshtje-ligjore/.env | sed 's/:[^:]*@/:***@/'
else
    echo "Environment file not found!"
fi

echo -e "\n[INFO] Checking application files..."
ls -la /opt/ceshtje-ligjore/

echo -e "\n[INFO] Attempting to restart application..."

# Stop the application
sudo -u appuser pm2 stop albpetrol-legal

# Fix the database URL encoding issue
cd /opt/ceshtje-ligjore

# Get database password properly
DB_PASSWORD=$(grep "PGPASSWORD=" .env | cut -d'=' -f2)
DB_NAME=$(grep "PGDATABASE=" .env | cut -d'=' -f2)
DB_USER=$(grep "PGUSER=" .env | cut -d'=' -f2)

# URL encode the password properly
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote('$DB_PASSWORD', safe=''))")

# Create new environment file with properly encoded URL
cat > .env << EOENV
DATABASE_URL=postgresql://$DB_USER:$ENCODED_PASSWORD@localhost:5432/$DB_NAME
PGHOST=localhost
PGPORT=5432
PGDATABASE=$DB_NAME
PGUSER=$DB_USER
PGPASSWORD=$DB_PASSWORD
NODE_ENV=production
PORT=5000
SESSION_SECRET=$(openssl rand -base64 64)
ADMIN_EMAIL=it.system@albpetrol.al
ADMIN_PASSWORD=Admin2025!
EOENV

chown appuser:appuser .env

echo "[INFO] Fixed database URL encoding"

# Try database migration again
echo "[INFO] Running database migrations..."
sudo -u appuser npm run db:push || echo "Migration failed, continuing anyway..."

# Start the application
echo "[INFO] Starting application..."
sudo -u appuser pm2 start ecosystem.config.js

# Wait a moment for startup
sleep 5

echo -e "\n[INFO] Final status check..."
sudo -u appuser pm2 status

echo -e "\n[INFO] Testing connection..."
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ SUCCESS: Application is now running!"
    echo "🌐 Access it at: http://10.5.20.31:5000"
    echo ""
    echo "Login credentials:"
    echo "Email: it.system@albpetrol.al"
    echo "Password: Admin2025!"
else
    echo "❌ Application still not responding"
    echo "Check logs with: sudo -u appuser pm2 logs albpetrol-legal"
fi

echo -e "\n[INFO] Nginx configuration check..."
nginx -t

echo -e "\n[INFO] Restarting Nginx..."
systemctl restart nginx

echo "=========================================="
echo "Debug completed"
echo "=========================================="