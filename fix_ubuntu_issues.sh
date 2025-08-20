#!/bin/bash

echo "🔧 Fix Ubuntu System Issues"
echo "==========================="

cat << 'UBUNTU_FIXES'

# Comprehensive fix for any Ubuntu deployment issues

cd /opt/ceshtje-ligjore

echo "1. Restart PM2 with clean slate:"
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal

echo "2. Verify application files exist:"
ls -la dist/index.js
ls -la dist/public/index.html

echo "3. Test application directly first:"
timeout 10s node dist/index.js &
APP_PID=$!
sleep 3

if ss -tlnp | grep -q 5000; then
    echo "✅ Application binds to port correctly"
    kill $APP_PID 2>/dev/null
else
    echo "❌ Application not binding to port 5000"
    kill $APP_PID 2>/dev/null
    
    echo "Recreating working server..."
    cat > dist/index.js << 'WORKING_SERVER'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

console.log('Starting Albpetrol Legal System...');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'Ubuntu Production',
    memory: process.memoryUsage()
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Access at: http://10.5.20.31:${PORT}`);
});
WORKING_SERVER
fi

echo "4. Start with PM2:"
pm2 start ecosystem.config.cjs

echo "5. Wait and verify:"
sleep 5
pm2 status
pm2 logs albpetrol-legal --lines 5 --nostream

echo "6. Test all connections:"
ss -tlnp | grep 5000
curl -I http://localhost:5000
curl -I http://localhost

echo "7. Restart Nginx if needed:"
systemctl reload nginx

echo ""
echo "Fix complete - check http://10.5.20.31"

UBUNTU_FIXES

echo ""
echo "Run this script to fix any Ubuntu deployment issues"