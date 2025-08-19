#!/bin/bash

echo "=== FINAL PM2 ENVIRONMENT FIX ==="

cd /opt/ceshtje-ligjore

echo "1. Create ecosystem.config.js with explicit environment variables"
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000,
      DATABASE_URL: 'postgresql://ceshtje_user:gjrWzGdZQMc0lU%2Fwu%2FhYEbFBTF5y1cZ6AYg%2FQslPkAk@localhost:5432/ceshtje_ligjore',
      PGHOST: 'localhost',
      PGPORT: '5432',
      PGDATABASE: 'ceshtje_ligjore',
      PGUSER: 'ceshtje_user',
      PGPASSWORD: 'gjrWzGdZQMc0lU/wu/hYEbFBTF5y1cZ6AYg/QslPkAk',
      SESSION_SECRET: '4SyV5c+mPEHAnCmjdoqY1e16zetKh+Qew531LWLfhB3UbBFhUw+8nlEsUwSkg7Sh A6tTshQWDlbtK5S8X8bogw==',
      ADMIN_EMAIL: 'it.system@albpetrol.al',
      ADMIN_PASSWORD: 'Admin2025!'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
EOF

echo "2. Stop current PM2 process"
pm2 delete albpetrol-legal

echo "3. Create logs directory"
mkdir -p logs

echo "4. Start with new ecosystem config"
pm2 start ecosystem.config.js

echo "5. Check status and logs"
pm2 status
pm2 logs albpetrol-legal --lines 10

echo "6. Test API"
curl http://localhost:5000/api/auth/user

echo "7. Save PM2 configuration"
pm2 save

echo "=== COMPLETED ==="