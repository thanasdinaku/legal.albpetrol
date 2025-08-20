#!/bin/bash

echo "🔧 Fixing Nginx 502 Bad Gateway Error"
echo "====================================="

cat << 'FIX_COMMANDS'

# Commands to run on Ubuntu server to fix 502 error

# 1. Check if application is actually running on port 5000
echo "1. Checking application status..."
pm2 status
netstat -tlnp | grep 5000

# 2. Test direct connection to application
echo "2. Testing direct connection..."
curl -I http://localhost:5000

# 3. Check Nginx configuration
echo "3. Checking Nginx configuration..."
nginx -t

# 4. Check Nginx sites-enabled
echo "4. Checking enabled sites..."
ls -la /etc/nginx/sites-enabled/

# 5. Check Nginx error logs
echo "5. Checking Nginx error logs..."
tail -20 /var/log/nginx/error.log

# 6. Fix Nginx configuration for port 5000
echo "6. Creating correct Nginx configuration..."
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINX_CONFIG'
server {
    listen 80;
    server_name legal.albpetrol.al 10.5.20.31 localhost;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300;
        proxy_connect_timeout 300;
        proxy_send_timeout 300;
    }

    # Handle static assets
    location /assets/ {
        proxy_pass http://127.0.0.1:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000;
        access_log off;
    }
}
NGINX_CONFIG

# 7. Enable the site
echo "7. Enabling site..."
ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# 8. Test Nginx configuration
echo "8. Testing Nginx configuration..."
nginx -t

# 9. Reload Nginx
echo "9. Reloading Nginx..."
systemctl reload nginx

# 10. Check if PM2 app is running correctly
echo "10. Ensuring PM2 app is running..."
cd /opt/ceshtje-ligjore
pm2 restart albpetrol-legal

# 11. Check application logs for errors
echo "11. Checking application logs..."
pm2 logs albpetrol-legal --lines 10 --nostream

# 12. Test both direct and proxy connections
echo "12. Testing connections..."
echo "Direct connection test:"
curl -I http://localhost:5000

echo ""
echo "Proxy connection test:"
curl -I http://localhost

# 13. Check firewall rules
echo "13. Checking firewall..."
ufw status

# 14. Final status check
echo "14. Final status..."
systemctl status nginx
pm2 status

FIX_COMMANDS

echo ""
echo "Run these commands on Ubuntu server to fix the 502 error"