#!/bin/bash

# Ubuntu 502 Bad Gateway Fix Script
# This script will diagnose and fix the nginx 502 error

echo "🔧 Diagnosing and fixing 502 Bad Gateway error..."

# SSH connection details
SERVER="10.5.20.31"
USER="root"

# Create the fix script that will run on Ubuntu
cat > ubuntu_fix_502.sh << 'FIX_SCRIPT'
#!/bin/bash

echo "=== UBUNTU 502 BAD GATEWAY DIAGNOSIS AND FIX ==="

cd /opt/ceshtje-ligjore

echo "1. Checking PM2 status..."
pm2 status

echo -e "\n2. Checking PM2 logs..."
pm2 logs albpetrol-legal --lines 10 --nostream

echo -e "\n3. Checking if application port 5000 is running..."
netstat -tlnp | grep :5000 || echo "Port 5000 not listening"

echo -e "\n4. Checking Nginx status..."
systemctl status nginx --no-pager

echo -e "\n5. Checking Nginx configuration..."
nginx -t

echo -e "\n6. Checking Nginx sites configuration..."
cat /etc/nginx/sites-available/default | grep -A 10 -B 5 proxy_pass

echo -e "\n7. Stopping current PM2 process..."
pm2 stop all
pm2 delete all

echo -e "\n8. Starting application directly to test..."
cd /opt/ceshtje-ligjore
export NODE_ENV=production
export PORT=5000
export DATABASE_URL="postgresql://ceshtje_user:Albpetrol2025@localhost:5432/ceshtje_ligjore"
export SESSION_SECRET="albpetrol-production-secret-2025"

# Test if the server file exists and is correct
echo -e "\n9. Checking server files..."
ls -la dist/
cat dist/index.js | head -20

echo -e "\n10. Starting PM2 with explicit configuration..."

# Create a new PM2 ecosystem file with explicit settings
cat > ecosystem.config.js << 'PM2_EOF'
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
      DATABASE_URL: 'postgresql://ceshtje_user:Albpetrol2025@localhost:5432/ceshtje_ligjore',
      SESSION_SECRET: 'albpetrol-production-secret-2025'
    },
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    log_file: '/var/log/pm2/albpetrol-legal.log',
    time: true,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
PM2_EOF

pm2 start ecosystem.config.js

echo -e "\n11. Waiting for application to start..."
sleep 5

echo -e "\n12. Testing local connection..."
curl -I http://localhost:5000/ || echo "Local connection failed"

echo -e "\n13. Checking PM2 status after restart..."
pm2 status

echo -e "\n14. Checking port 5000 again..."
netstat -tlnp | grep :5000

echo -e "\n15. Testing Nginx proxy..."
curl -I http://localhost/ || echo "Nginx proxy failed"

echo -e "\n16. Restarting Nginx..."
systemctl restart nginx

echo -e "\n17. Final test..."
curl -I http://localhost/

echo -e "\n=== FIX COMPLETE ==="
echo "Check http://10.5.20.31 in your browser"
echo "If still failing, check PM2 logs: pm2 logs albpetrol-legal"

FIX_SCRIPT

chmod +x ubuntu_fix_502.sh

echo "📋 Fix script created. Executing on Ubuntu server..."
echo "This will diagnose and fix the 502 error."