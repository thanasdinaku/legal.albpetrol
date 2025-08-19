#!/bin/bash

echo "=== UBUNTU FRESH DEPLOYMENT FROM SCRATCH ==="
echo "This script will completely clean and redeploy the legal case management system"
echo ""

# Stop all running processes
echo "1. Stopping all PM2 processes and services"
pm2 kill 2>/dev/null || echo "No PM2 processes running"
sudo systemctl stop nginx 2>/dev/null || echo "Nginx not running"
sudo pkill -f node 2>/dev/null || echo "No node processes running"

# Clean existing application directories
echo "2. Cleaning existing application directories"
sudo rm -rf /opt/ceshtje-ligjore
sudo rm -rf /opt/ceshtje_ligjore
sudo rm -rf /var/www/html/ceshtje*
sudo rm -rf /home/appuser/ceshtje*

# Remove PM2 startup scripts
echo "3. Removing PM2 startup configuration"
sudo systemctl disable pm2-root 2>/dev/null || echo "No PM2 startup script"
sudo rm -f /etc/systemd/system/pm2-root.service
sudo systemctl daemon-reload

# Clean PM2 completely
echo "4. Cleaning PM2 configuration"
rm -rf /root/.pm2
npm uninstall -g pm2 2>/dev/null || echo "PM2 not globally installed"

# Backup and clean database
echo "5. Backing up and cleaning database"
sudo -u postgres pg_dump ceshtje_ligjore > /tmp/ceshtje_backup_$(date +%Y%m%d_%H%M%S).sql 2>/dev/null || echo "Database backup failed or doesn't exist"
sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || echo "Database doesn't exist"
sudo -u postgres dropuser ceshtje_user 2>/dev/null || echo "User doesn't exist"

echo "6. Creating fresh directory structure"
sudo mkdir -p /opt/ceshtje-ligjore
sudo chown -R root:root /opt/ceshtje-ligjore

echo "7. Installing/Updating required packages"
sudo apt update
sudo apt install -y postgresql postgresql-contrib nginx git curl
sudo systemctl enable postgresql
sudo systemctl start postgresql

echo "8. Installing Node.js 20"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "9. Installing PM2 globally"
sudo npm install -g pm2@latest

echo "10. Creating fresh database"
sudo -u postgres createdb ceshtje_ligjore
sudo -u postgres psql -c "CREATE USER ceshtje_user WITH PASSWORD 'Albpetrol2025';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ceshtje_ligjore TO ceshtje_user;"
sudo -u postgres psql -c "ALTER USER ceshtje_user CREATEDB;"

echo "11. Cloning fresh application from GitHub"
cd /opt/ceshtje-ligjore
git clone https://github.com/thanasdinaku/ceshtje_ligjore.git .
sudo chown -R root:root /opt/ceshtje-ligjore

echo "12. Installing dependencies"
npm install

echo "13. Creating production environment file"
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://ceshtje_user:Albpetrol2025@localhost:5432/ceshtje_ligjore
PGHOST=localhost
PGPORT=5432
PGDATABASE=ceshtje_ligjore
PGUSER=ceshtje_user
PGPASSWORD=Albpetrol2025
SESSION_SECRET=AlbpetrolLegal2025SecretKey123456789
ADMIN_EMAIL=it.system@albpetrol.al
ADMIN_PASSWORD=Admin2025!
EOF

echo "14. Building application"
npm run build || npx vite build

echo "15. Creating PM2 ecosystem configuration"
cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://ceshtje_user:Albpetrol2025@localhost:5432/ceshtje_ligjore',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGDATABASE: 'ceshtje_ligjore',
      PGUSER: 'ceshtje_user',
      PGPASSWORD: 'Albpetrol2025',
      SESSION_SECRET: 'AlbpetrolLegal2025SecretKey123456789',
      ADMIN_EMAIL: 'it.system@albpetrol.al',
      ADMIN_PASSWORD: 'Admin2025!'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_restarts: 10,
    restart_delay: 5000
  }]
};
EOF

echo "16. Creating logs directory and setting permissions"
mkdir -p logs
chmod 755 logs

echo "17. Running database migrations (if any)"
npm run db:push 2>/dev/null || echo "No migrations to run"

echo "18. Starting application with PM2"
pm2 start ecosystem.config.cjs

echo "19. Setting up PM2 startup"
pm2 save
pm2 startup systemd -u root --hp /root

echo "20. Configuring Nginx (basic setup)"
cat > /etc/nginx/sites-available/albpetrol-legal << 'EOF'
server {
    listen 80;
    server_name 10.5.20.31 localhost;

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
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

echo "21. Final status check"
pm2 status
pm2 logs albpetrol-legal --lines 5

echo "22. Testing application"
sleep 5
curl -I http://localhost:5000/
curl -s http://localhost:5000/ | grep -i "sistemi" || echo "Testing frontend..."

echo ""
echo "=== FRESH DEPLOYMENT COMPLETED ==="
echo "Application should be running at:"
echo "- Local: http://localhost:5000"
echo "- Network: http://10.5.20.31:5000"
echo ""
echo "Admin credentials:"
echo "- Email: it.system@albpetrol.al"
echo "- Password: Admin2025!"
echo ""
echo "To check status: pm2 status"
echo "To view logs: pm2 logs albpetrol-legal"
echo ""