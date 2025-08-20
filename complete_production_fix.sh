#!/bin/bash

echo "🔧 Complete Production Fix for Module Resolution"
echo "=============================================="

cat << 'COMPLETE_FIX'

cd /opt/ceshtje-ligjore

# 1. Stop PM2 completely
echo "1. Stopping PM2..."
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal

# 2. Check current Node.js and npm versions
echo "2. Checking Node.js environment..."
node --version
npm --version

# 3. Clean everything and reinstall
echo "3. Complete clean reinstall..."
rm -rf node_modules
rm -rf dist
rm -f package-lock.json

# 4. Install all dependencies fresh
echo "4. Fresh dependency installation..."
npm cache clean --force
npm install

# 5. Verify critical packages are installed
echo "5. Verifying critical packages..."
npm list @neondatabase/serverless
npm list express
npm list drizzle-orm

# 6. Create a simpler, working production build
echo "6. Creating production build..."
npm run build

# 7. Check if build output exists and is valid
echo "7. Checking build output..."
ls -la dist/
head -50 dist/index.js

# 8. If the ES module issue persists, create a CommonJS wrapper
echo "8. Creating CommonJS wrapper for compatibility..."
cat > dist/server.cjs << 'CJS_WRAPPER'
const { createRequire } = require('module');
const require = createRequire(import.meta.url);

// Import the ES module
import('./index.js').catch(err => {
  console.error('Failed to load ES module:', err);
  process.exit(1);
});
CJS_WRAPPER

# 9. Update PM2 config to use CommonJS if needed
echo "9. Updating PM2 configuration..."
cat > ecosystem.config.cjs << 'PM2_CONFIG'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/index.js',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    log_file: '/var/log/pm2/albpetrol-legal.log',
    time: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 10000,
    restart_delay: 4000
  }]
};
PM2_CONFIG

# 10. Test the application directly first
echo "10. Testing application directly..."
timeout 15s node dist/index.js &
DIRECT_PID=$!
sleep 5

# Check if port is listening
if ss -tlnp | grep -q 5000; then
    echo "✅ Application binds to port 5000 successfully"
    kill $DIRECT_PID 2>/dev/null
else
    echo "❌ Application still not binding to port 5000"
    kill $DIRECT_PID 2>/dev/null
    
    # Alternative: Use tsx to run the application
    echo "11. Trying with tsx runner..."
    timeout 15s npx tsx dist/index.js &
    TSX_PID=$!
    sleep 5
    
    if ss -tlnp | grep -q 5000; then
        echo "✅ Application works with tsx"
        kill $TSX_PID 2>/dev/null
        
        # Update PM2 to use tsx
        cat > ecosystem.config.cjs << 'PM2_TSX_CONFIG'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'npx',
    args: 'tsx dist/index.js',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    log_file: '/var/log/pm2/albpetrol-legal.log',
    time: true,
    watch: false,
    max_restarts: 10,
    min_uptime: 10000,
    restart_delay: 4000
  }]
};
PM2_TSX_CONFIG
    else
        kill $TSX_PID 2>/dev/null
        echo "❌ Application still not working with tsx"
    fi
fi

# 12. Start with PM2
echo "12. Starting with PM2..."
pm2 start ecosystem.config.cjs

# 13. Wait and check status
echo "13. Checking PM2 status..."
sleep 10
pm2 status
pm2 logs albpetrol-legal --lines 15 --nostream

# 14. Test connectivity
echo "14. Testing connectivity..."
ss -tlnp | grep 5000
curl -I http://localhost:5000
curl -I http://localhost

COMPLETE_FIX

echo ""
echo "Run this complete fix to resolve the production module issues"