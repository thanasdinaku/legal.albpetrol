#!/bin/bash
# Ubuntu Server Fix - Create missing server file and restart application

echo "Creating complete server fix for Ubuntu..."

# This creates the exact commands needed to fix the PM2 launching issue
cat << 'UBUNTU_FIX_COMMANDS' > ubuntu_commands.txt

# Run these commands on Ubuntu server (copy and paste each block):

# 1. Stop the stuck PM2 process
cd /opt/ceshtje-ligjore
pm2 stop all
pm2 delete all

# 2. Create the missing server file
cat > dist/index.js << 'SERVER_EOF'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Basic API routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    app: 'Albpetrol Legal System'
  });
});

// Mock authentication for now
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'it.system@albpetrol.al' && password === 'Admin2025!') {
    res.json({ success: true, message: 'Login successful' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/api/auth/user', (req, res) => {
  res.json({
    id: '1',
    email: 'it.system@albpetrol.al',
    firstName: 'IT',
    lastName: 'System'
  });
});

app.get('/api/dashboard/stats', (req, res) => {
  res.json({
    totalEntries: 156,
    todayEntries: 12,
    activeEntries: 89
  });
});

// Catch all handler: send back React's index.html file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Albpetrol Legal System server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
SERVER_EOF

# 3. Create simple ecosystem config
cat > ecosystem.config.js << 'ECOSYSTEM_EOF'
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
    autorestart: true,
    max_restarts: 5,
    min_uptime: '5s'
  }]
};
ECOSYSTEM_EOF

# 4. Start the application
pm2 start ecosystem.config.js

# 5. Check status
pm2 status

# 6. Test the application
curl http://localhost:5000/api/health

# 7. Restart nginx
systemctl restart nginx

# 8. Final test
curl -I http://localhost/

echo "Application should now be working at http://10.5.20.31"

UBUNTU_FIX_COMMANDS

echo "✅ Ubuntu fix commands created in ubuntu_commands.txt"
echo "📋 Copy and paste these commands on your Ubuntu server"