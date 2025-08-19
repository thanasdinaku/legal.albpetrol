#!/bin/bash

# Final fix script for Albanian Legal Case Management System
echo "=========================================="
echo "Final Application Fix"
echo "=========================================="

cd /opt/ceshtje-ligjore

# Check what's currently running
echo "[INFO] Current processes on port 5000:"
netstat -tlnp | grep :5000

# Test if application is responding
echo "[INFO] Testing application response:"
curl -s http://localhost:5000 | head -5

# Fix the PM2 ecosystem config file
echo "[INFO] Fixing PM2 configuration..."
cat > ecosystem.config.js << 'EOPM2'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
}
EOPM2

# Stop any existing processes
echo "[INFO] Cleaning up existing processes..."
sudo -u appuser pm2 delete all 2>/dev/null || true
pkill -f "node.*5000" 2>/dev/null || true
sleep 2

# Fix database password in environment
echo "[INFO] Fixing database connection..."
DB_PASSWORD=$(grep "PGPASSWORD=" .env | cut -d'=' -f2)
DB_NAME=$(grep "PGDATABASE=" .env | cut -d'=' -f2)
DB_USER=$(grep "PGUSER=" .env | cut -d'=' -f2)

# URL encode password properly
ENCODED_PASSWORD=$(python3 -c "import urllib.parse; print(urllib.parse.quote_plus('$DB_PASSWORD'))")

# Update environment file
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

chown appuser:appuser .env ecosystem.config.js

# Test database connection
echo "[INFO] Testing database connection..."
sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" > /dev/null 2>&1 && echo "Database OK" || echo "Database connection issue"

# Start application with PM2
echo "[INFO] Starting application with PM2..."
sudo -u appuser pm2 start ecosystem.config.js

# Wait for startup
sleep 3

# Final test
echo "[INFO] Final application test..."
if curl -f http://localhost:5000 > /dev/null 2>&1; then
    echo "✅ SUCCESS: Application is running!"
    echo "🌐 Access at: http://10.5.20.31:5000"
    echo ""
    echo "Admin Login:"
    echo "Email: it.system@albpetrol.al"
    echo "Password: Admin2025!"
    echo ""
    echo "Application Status:"
    sudo -u appuser pm2 status
else
    echo "❌ Application not responding properly"
    echo "Checking logs..."
    sudo -u appuser pm2 logs --lines 10
fi

echo "=========================================="
echo "Fix completed"
echo "=========================================="