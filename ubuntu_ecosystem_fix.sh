#!/bin/bash

echo "=== UBUNTU ECOSYSTEM CONFIG FIX ==="

cd /opt/ceshtje-ligjore

echo "1. Remove corrupted ecosystem.config.js"
rm -f ecosystem.config.js

echo "2. Create proper ecosystem.config.cjs (CommonJS format)"
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

echo "3. Create logs directory"
mkdir -p logs

echo "4. Stop any existing PM2 processes"
pm2 delete albpetrol-legal 2>/dev/null || echo "No process to delete"

echo "5. Start with new ecosystem config"
pm2 start ecosystem.config.cjs

echo "6. Check status and logs"
pm2 status
pm2 logs albpetrol-legal --lines 5

echo "7. Test API endpoint"
curl -s http://localhost:5000/api/auth/user | head -20

echo "8. Test main page"
curl -s http://localhost:5000/ | grep -i "sistemi" || echo "Page loading check..."

echo "9. Save PM2 configuration"
pm2 save

echo "=== ECOSYSTEM FIX COMPLETED ==="