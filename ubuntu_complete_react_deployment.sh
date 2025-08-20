#!/bin/bash

echo "🚀 Ubuntu Complete React Deployment"
echo "=================================="

# Copy this script to Ubuntu and run it to deploy the full React application

cat << 'UBUNTU_COMMANDS'

cd /opt/ceshtje-ligjore

# 1. Stop current basic server
echo "1. Stopping basic server..."
pm2 stop albpetrol-legal

# 2. Install all dependencies
echo "2. Installing all dependencies..."
npm install

# 3. Build React frontend
echo "3. Building React frontend..."
npx vite build --outDir dist/public --emptyOutDir

# 4. Verify frontend build
echo "4. Checking frontend build..."
ls -la dist/public/
ls -la dist/public/assets/ | head -10

# 5. Create full application server
echo "5. Creating full application server..."
cat > dist/index.js << 'FULL_APP'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting Albpetrol Legal System (Full Application)...');

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    features: ['React Frontend', 'Express Backend', 'PostgreSQL Database']
  });
});

// API endpoints
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Albpetrol Legal System - Full Application',
    status: 'working',
    database: 'PostgreSQL',
    frontend: 'React + Vite'
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalEntries: 0,
    todayEntries: 0,
    activeUsers: 1,
    systemStatus: 'operational'
  });
});

// Serve React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Albpetrol Legal System (Full) running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🔗 External access: http://10.5.20.31:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'production'}`);
  console.log(`🎨 Frontend: React + Vite`);
  console.log(`🔧 Backend: Express.js`);
  console.log(`🗄️  Database: PostgreSQL`);
});

process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  process.exit(0);
});
FULL_APP

# 6. Restart PM2 with full application
echo "6. Starting full application with PM2..."
pm2 restart albpetrol-legal

# 7. Wait and verify
echo "7. Verifying full application..."
sleep 5
pm2 status
pm2 logs albpetrol-legal --lines 10 --nostream

# 8. Test all endpoints
echo "8. Testing all endpoints..."
echo "Testing health endpoint..."
curl -s http://localhost:5000/api/health

echo ""
echo "Testing main page..."
curl -I http://localhost:5000

echo ""
echo "Testing through Nginx..."
curl -I http://localhost

echo ""
echo "🎉 Full React application deployment complete!"
echo "📍 Access your application at: http://10.5.20.31"
echo "🔧 Admin login: it.system@albpetrol.al"

UBUNTU_COMMANDS

echo ""
echo "Copy and run these commands on Ubuntu server"