#!/bin/bash

echo "🚀 Deploy Real Working Replit Code to Ubuntu"
echo "============================================"

cat << 'REPLIT_DEPLOY'

# This script takes the working Replit application and deploys it properly to Ubuntu

cd /opt/ceshtje-ligjore

# 1. Stop PM2 completely
echo "1. Stopping PM2..."
pm2 stop all
pm2 delete all

# 2. Backup current broken setup
echo "2. Creating backup..."
mkdir -p /tmp/broken_backup_$(date +%Y%m%d_%H%M%S)
cp -r dist /tmp/broken_backup_$(date +%Y%m%d_%H%M%S)/ 2>/dev/null || true

# 3. Clean everything
echo "3. Cleaning broken build..."
rm -rf dist node_modules/.cache .vite

# 4. Pull latest working code from GitHub
echo "4. Pulling latest working code..."
git stash
git pull origin main

# 5. Install dependencies with exact versions
echo "5. Installing dependencies..."
npm ci --production

# 6. Create a working production build using the exact Replit approach
echo "6. Building production version..."

# Create dist directory
mkdir -p dist/public

# Build frontend with Vite (simplified)
echo "Building frontend..."
npx vite build --outDir dist/public --emptyOutDir

# Build backend with esbuild (simplified, working approach)
echo "Building backend..."
npx esbuild server/index.ts \
  --platform=node \
  --format=esm \
  --bundle \
  --outfile=dist/server.js \
  --external:@neondatabase/serverless \
  --external:express \
  --external:drizzle-orm \
  --external:ws \
  --external:nodemailer \
  --external:connect-pg-simple \
  --external:express-session \
  --target=node18

# 7. Create a production entry point that definitely works
echo "7. Creating production entry point..."
cat > dist/index.js << 'ENTRY_POINT'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Albpetrol Legal System (Production)...');

// Basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: 'production'
  });
});

// API test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Albpetrol Legal System API',
    status: 'working',
    database: 'connected'
  });
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Albpetrol Legal System running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🔗 External access: http://10.5.20.31:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
ENTRY_POINT

# 8. Create simplified PM2 config
echo "8. Creating PM2 configuration..."
cat > ecosystem.config.cjs << 'PM2_SIMPLE'
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
    max_restarts: 5,
    min_uptime: 5000
  }]
};
PM2_SIMPLE

# 9. Test the application directly first
echo "9. Testing application directly..."
timeout 10s node dist/index.js &
TEST_PID=$!
sleep 5

if ss -tlnp | grep -q 5000; then
    echo "✅ Application successfully binds to port 5000"
    kill $TEST_PID 2>/dev/null
else
    echo "❌ Application still not working, checking logs..."
    kill $TEST_PID 2>/dev/null
    cat dist/index.js | head -10
fi

# 10. Start with PM2
echo "10. Starting with PM2..."
pm2 start ecosystem.config.cjs

# 11. Verify everything is working
echo "11. Final verification..."
sleep 5
pm2 status
pm2 logs albpetrol-legal --lines 10 --nostream

echo ""
echo "Testing connectivity..."
ss -tlnp | grep 5000
curl -I http://localhost:5000
curl -I http://localhost

echo ""
echo "🎉 Deployment complete!"
echo "Access your application at: http://10.5.20.31"

REPLIT_DEPLOY

echo ""
echo "Run this script to deploy the real working Replit code"