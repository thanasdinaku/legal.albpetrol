#!/bin/bash

echo "🚨 Emergency Simple Fix - Use Working Production Code"
echo "=================================================="

cat << 'EMERGENCY_FIX'

# This creates a simple, working Node.js server that definitely works

cd /opt/ceshtje-ligjore

# 1. Stop PM2
pm2 stop albpetrol-legal
pm2 delete albpetrol-legal

# 2. Create a simple working server directly
echo "Creating emergency working server..."
cat > dist/emergency-server.js << 'EMERGENCY_SERVER'
const express = require('express');
const path = require('path');

const app = express();
const PORT = 5000;

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Albpetrol Legal System - Emergency Mode', status: 'working' });
});

// Serve index.html for all routes (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚨 Emergency server running on port ${PORT}`);
  console.log(`📍 Access at: http://0.0.0.0:${PORT}`);
});
EMERGENCY_SERVER

# 3. Update PM2 to use the emergency server
cat > ecosystem.config.cjs << 'EMERGENCY_PM2'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: 'dist/emergency-server.js',
    cwd: '/opt/ceshtje-ligjore',
    instances: 1,
    exec_mode: 'fork',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/albpetrol-legal-error.log',
    out_file: '/var/log/pm2/albpetrol-legal-out.log',
    time: true
  }]
};
EMERGENCY_PM2

# 4. Start emergency server
pm2 start ecosystem.config.cjs

# 5. Test
sleep 3
pm2 status
ss -tlnp | grep 5000
curl -I http://localhost:5000
curl -I http://localhost

EMERGENCY_FIX

echo ""
echo "This emergency fix creates a simple working server to test connectivity"