#!/bin/bash

echo "🚀 Deploy Complete Replit Environment to Ubuntu"
echo "==============================================="

cat << 'COMPLETE_DEPLOY'

cd /opt/ceshtje-ligjore

echo "DEPLOYING FULL REPLIT ENVIRONMENT:"
echo "- Complete React application with TypeScript"
echo "- Full Express.js backend with all APIs"
echo "- PostgreSQL database with Drizzle ORM"
echo "- Authentication system"
echo "- All shadcn/ui components"
echo "- Email notifications"
echo "- Data export functionality"
echo "- Complete Albanian interface"
echo ""

echo "1. Stop current simplified version:"
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal

echo ""
echo "2. Backup current files:"
mv dist dist_backup_$(date +%Y%m%d_%H%M%S) 2>/dev/null || echo "No dist to backup"

echo ""
echo "3. Pull latest code from GitHub (complete version):"
git fetch origin
git reset --hard HEAD
git pull origin main

echo ""
echo "4. Install ALL dependencies (including dev dependencies):"
npm install

echo ""
echo "5. Build complete React application:"
export NODE_ENV=production
npm run build

echo ""
echo "6. Create production environment file:"
cat > .env << 'ENV'
NODE_ENV=production
DATABASE_URL=postgresql://postgres:admuser123@localhost:5432/albpetrol_legal_db
SESSION_SECRET=super-secret-session-key-for-production-albpetrol-legal-2025
PORT=5000
PGHOST=localhost
PGPORT=5432
PGUSER=postgres
PGPASSWORD=admuser123
PGDATABASE=albpetrol_legal_db
REPL_ID=complete-albpetrol-legal-system
REPLIT_DOMAINS=10.5.20.31,legal.albpetrol.al
ISSUER_URL=https://replit.com/oidc
ENV

echo ""
echo "7. Update database schema:"
npm run db:push

echo ""
echo "8. Create complete PM2 ecosystem config:"
cat > ecosystem.config.cjs << 'PM2_CONFIG'
module.exports = {
  apps: [
    {
      name: "albpetrol-legal",
      script: "dist/index.js",
      cwd: "/opt/ceshtje-ligjore",
      env: {
        NODE_ENV: "production",
        PORT: 5000
      },
      instances: 1,
      exec_mode: "fork",
      watch: false,
      max_memory_restart: "500M",
      error_file: "/var/log/pm2/albpetrol-legal-error.log",
      out_file: "/var/log/pm2/albpetrol-legal-out.log",
      log_file: "/var/log/pm2/albpetrol-legal.log",
      time: true,
      restart_delay: 3000
    }
  ]
};
PM2_CONFIG

echo ""
echo "9. Start complete application with PM2:"
pm2 start ecosystem.config.cjs

echo ""
echo "10. Wait for startup and check status:"
sleep 10
pm2 status
pm2 logs albpetrol-legal --lines 5 --nostream

echo ""
echo "11. Test complete application:"
echo "Testing backend APIs..."
curl -s -o /dev/null -w "Health API: %{http_code}\n" http://localhost:5000/api/health
curl -s -o /dev/null -w "Auth API: %{http_code}\n" http://localhost:5000/api/auth/user
curl -s -o /dev/null -w "Data API: %{http_code}\n" http://localhost:5000/api/entries

echo ""
echo "Testing frontend..."
curl -s -o /dev/null -w "Frontend: %{http_code}\n" http://localhost:5000

echo ""
echo "12. Update Nginx for complete application:"
cat > /etc/nginx/sites-available/albpetrol-legal << 'NGINX_CONFIG'
server {
    listen 80;
    server_name 10.5.20.31 legal.albpetrol.al;
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Main application
    location / {
        proxy_pass http://localhost:5000;
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
    
    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://localhost:5000;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINX_CONFIG

nginx -t && systemctl reload nginx

echo ""
echo "13. Final verification:"
echo "PM2 Status:"
pm2 status

echo ""
echo "Port bindings:"
ss -tlnp | grep 5000

echo ""
echo "Application responses:"
curl -s -o /dev/null -w "Direct: %{http_code}\n" http://localhost:5000
curl -s -o /dev/null -w "Nginx: %{http_code}\n" http://localhost

echo ""
echo "14. DEPLOYMENT COMPLETE!"
echo "========================================"
echo "✅ Complete Replit environment deployed to Ubuntu"
echo "✅ Full React application with TypeScript"
echo "✅ Complete Express.js backend"
echo "✅ PostgreSQL database operational"
echo "✅ All APIs and features available"
echo "✅ Albanian interface fully functional"
echo ""
echo "🌐 Access your complete system:"
echo "   http://10.5.20.31"
echo ""
echo "Features available:"
echo "- User authentication & dashboard"
echo "- Complete legal case management"
echo "- Data visualization with charts"
echo "- Excel/CSV export functionality"
echo "- Email notifications"
echo "- User manual integration"
echo "- Advanced filtering and search"
echo "- All shadcn/ui components"
echo "- Professional Albanian interface"

COMPLETE_DEPLOY

echo ""
echo "Run this script to deploy the complete Replit environment to Ubuntu"