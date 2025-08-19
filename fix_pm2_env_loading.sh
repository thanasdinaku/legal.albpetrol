#!/bin/bash

echo "=== PM2 ENVIRONMENT LOADING FIX ==="

cd /opt/ceshtje-ligjore

echo "1. Stopping PM2 completely to clear environment cache"
pm2 delete albpetrol-legal
pm2 kill

echo "2. Verify .env file exists and contains DATABASE_URL"
cat .env | grep DATABASE_URL

echo "3. Start PM2 with explicit environment loading"
pm2 start dist/index.js --name albpetrol-legal --update-env

echo "4. Check PM2 status and logs"
pm2 status
pm2 logs albpetrol-legal --lines 5

echo "5. Test API endpoint"
curl http://localhost:5000/api/auth/user

echo "=== Alternative: Create ecosystem.config.js with env_file ==="
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env_file: '.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

echo "6. Restart with ecosystem config"
pm2 restart ecosystem.config.js

echo "=== COMPLETE ==="