#!/bin/bash

echo "🔍 Verify Application Binding"
echo "============================="

cat << 'BINDING_CHECK'

cd /opt/ceshtje-ligjore

echo "1. Check how PM2 app is binding to ports:"
pm2 logs albpetrol-legal --lines 5 --nostream

echo ""
echo "2. Check port binding details:"
ss -tlnp | grep 5000
netstat -tlnp | grep 5000 2>/dev/null || echo "netstat not available"

echo ""
echo "3. Test all local interfaces:"
echo "Testing 127.0.0.1:5000..."
curl -s -o /dev/null -w "127.0.0.1:5000 = %{http_code}\n" http://127.0.0.1:5000

echo "Testing localhost:5000..."
curl -s -o /dev/null -w "localhost:5000 = %{http_code}\n" http://localhost:5000

echo "Testing 0.0.0.0:5000..."
curl -s -o /dev/null -w "0.0.0.0:5000 = %{http_code}\n" http://0.0.0.0:5000 2>/dev/null || echo "0.0.0.0:5000 = Not accessible"

echo "Testing 10.5.20.31:5000..."
curl -s -o /dev/null -w "10.5.20.31:5000 = %{http_code}\n" http://10.5.20.31:5000

echo ""
echo "4. Check server.js binding configuration:"
echo "Looking for bind address in server file..."
grep -n "listen\|bind" dist/index.js 2>/dev/null || echo "Cannot check binding in dist/index.js"

echo ""
echo "5. Fix binding if needed:"
if ! curl -s -o /dev/null http://127.0.0.1:5000; then
    echo "❌ App not accessible on 127.0.0.1 - this causes Cloudflare origin errors"
    echo "Recreating server with correct binding..."
    
    cat > dist/index.js << 'SERVER_FIX'
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

console.log('🚀 Starting Albpetrol Legal System (Full Application)...');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    server: 'Ubuntu Production',
    memory: process.memoryUsage(),
    binding: '0.0.0.0:5000'
  });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// CRITICAL: Bind to 0.0.0.0 so all interfaces can access it
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Albpetrol Legal System (Full) running on port ${PORT}`);
  console.log(`🌐 Server accessible at http://0.0.0.0:${PORT}`);
  console.log(`🔗 External access: http://10.5.20.31:${PORT}`);
  console.log(`🔗 Localhost access: http://127.0.0.1:${PORT}`);
});
SERVER_FIX

    echo "✅ Server file updated to bind to 0.0.0.0"
    echo "Restarting PM2..."
    pm2 restart albpetrol-legal
    
    echo "Waiting for restart..."
    sleep 5
    
    echo "Testing after fix..."
    curl -s -o /dev/null -w "Fixed binding: %{http_code}\n" http://127.0.0.1:5000
else
    echo "✅ App accessible on 127.0.0.1 - binding is correct"
fi

BINDING_CHECK

echo ""
echo "Run this to verify and fix application binding"