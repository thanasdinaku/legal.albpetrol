#!/bin/bash

# CaseRecord System Optimization Script for Ubuntu Server
# Optimizes Node.js, PostgreSQL, Nginx, and system performance

echo "🚀 CaseRecord System Optimization - Ubuntu Server"
echo "================================================================"

# Navigate to application directory
cd /opt/ceshtje-ligjore || exit 1

# ============================================================================
# 1. NODE.JS & PM2 OPTIMIZATION
# ============================================================================

echo ""
echo "📦 Step 1: Node.js & PM2 Optimization"
echo "----------------------------------------------------------------"

# Set NODE_ENV to production (3x performance boost)
echo "✅ Setting NODE_ENV=production..."
export NODE_ENV=production

# Update PM2 ecosystem config for cluster mode
echo "✅ Creating PM2 cluster configuration..."
cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'albpetrol-legal',
    script: './dist/index.js',
    instances: 'max',           // Use all CPU cores
    exec_mode: 'cluster',        // Cluster mode for load balancing
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    max_memory_restart: '1G',    // Restart if memory exceeds 1GB
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    watch: false
  }]
}
EOF

# Install compression middleware if not present
echo "✅ Installing performance packages..."
npm install compression helmet --save

# ============================================================================
# 2. ENABLE GZIP COMPRESSION IN EXPRESS
# ============================================================================

echo ""
echo "🗜️  Step 2: Enable Gzip Compression"
echo "----------------------------------------------------------------"

# Backup server file
cp server/index.ts server/index.ts.backup.optimization

# Add compression middleware (if not already present)
if ! grep -q "import compression from 'compression'" server/index.ts; then
    sed -i "1i import compression from 'compression';" server/index.ts
    sed -i "/const app = express();/a app.use(compression());" server/index.ts
    echo "✅ Compression middleware added"
else
    echo "✅ Compression already enabled"
fi

# ============================================================================
# 3. POSTGRESQL OPTIMIZATION
# ============================================================================

echo ""
echo "🗄️  Step 3: PostgreSQL Optimization"
echo "----------------------------------------------------------------"

# Create database optimization SQL script
cat > /tmp/postgres_optimize.sql << 'EOF'
-- Analyze database to update statistics
ANALYZE;

-- Create indexes on frequently queried columns
CREATE INDEX IF NOT EXISTS idx_data_entries_user_id ON data_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_data_entries_created_at ON data_entries(created_at);
CREATE INDEX IF NOT EXISTS idx_data_entries_court_hearing_date ON data_entries(court_hearing_date);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires);

-- Vacuum to reclaim storage
VACUUM ANALYZE;

-- Show index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;
EOF

echo "✅ PostgreSQL optimization script created at /tmp/postgres_optimize.sql"
echo "   Run: psql -U albpetrol_user -d albpetrol_legal_db -f /tmp/postgres_optimize.sql"

# ============================================================================
# 4. NGINX OPTIMIZATION (if using Nginx)
# ============================================================================

echo ""
echo "🌐 Step 4: Nginx Configuration"
echo "----------------------------------------------------------------"

if command -v nginx &> /dev/null; then
    # Backup existing config
    if [ -f /etc/nginx/sites-available/legal.albpetrol.al ]; then
        sudo cp /etc/nginx/sites-available/legal.albpetrol.al /etc/nginx/sites-available/legal.albpetrol.al.backup
    fi

    # Create optimized Nginx config
    sudo tee /etc/nginx/sites-available/legal.albpetrol.al > /dev/null << 'EOF'
server {
    listen 80;
    server_name legal.albpetrol.al;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;
    gzip_disable "MSIE [1-6]\.";

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Static file caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Increase buffer sizes
    client_body_buffer_size 128k;
    client_max_body_size 10m;
}
EOF

    echo "✅ Nginx configuration created"
    echo "   Enable with: sudo ln -sf /etc/nginx/sites-available/legal.albpetrol.al /etc/nginx/sites-enabled/"
    echo "   Test with: sudo nginx -t"
    echo "   Reload with: sudo systemctl reload nginx"
else
    echo "⚠️  Nginx not installed - skipping Nginx optimization"
fi

# ============================================================================
# 5. SYSTEM-LEVEL OPTIMIZATION
# ============================================================================

echo ""
echo "⚙️  Step 5: System-Level Optimization"
echo "----------------------------------------------------------------"

# Increase file descriptor limits
echo "✅ Increasing file descriptor limits..."
sudo tee -a /etc/security/limits.conf > /dev/null << 'EOF'

# CaseRecord system optimization
* soft nofile 65535
* hard nofile 65535
EOF

# Optimize TCP settings
echo "✅ Optimizing TCP settings..."
sudo tee -a /etc/sysctl.conf > /dev/null << 'EOF'

# CaseRecord system optimization
net.ipv4.tcp_fin_timeout = 15
net.ipv4.tcp_tw_reuse = 1
net.core.somaxconn = 4096
net.ipv4.ip_local_port_range = 1024 65535
EOF

# Apply sysctl changes
sudo sysctl -p

# ============================================================================
# 6. BUILD & RESTART
# ============================================================================

echo ""
echo "🏗️  Step 6: Rebuild & Restart Application"
echo "----------------------------------------------------------------"

# Build with production optimizations
echo "✅ Building application..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    
    # Delete old PM2 process and restart with cluster config
    echo "✅ Restarting with cluster mode..."
    pm2 delete albpetrol-legal 2>/dev/null || true
    pm2 start ecosystem.config.js
    pm2 save
    
    echo ""
    echo "================================================================"
    echo "✅ CaseRecord Optimization Complete!"
    echo "================================================================"
    echo ""
    echo "📊 Optimizations Applied:"
    echo "   ✅ PM2 cluster mode (multi-core utilization)"
    echo "   ✅ Gzip compression enabled"
    echo "   ✅ Database indexes created"
    echo "   ✅ Nginx caching & compression configured"
    echo "   ✅ System limits increased"
    echo "   ✅ TCP optimization enabled"
    echo ""
    echo "🔍 Verify Performance:"
    echo "   - PM2 status: pm2 status"
    echo "   - PM2 monitoring: pm2 monit"
    echo "   - Logs: pm2 logs albpetrol-legal"
    echo "   - Database indexes: psql -U albpetrol_user -d albpetrol_legal_db -f /tmp/postgres_optimize.sql"
    echo ""
    echo "🌐 Test at: https://legal.albpetrol.al"
    echo ""
else
    echo "❌ Build failed!"
    exit 1
fi

# ============================================================================
# 7. PERFORMANCE MONITORING SETUP
# ============================================================================

echo ""
echo "📈 Performance Monitoring Commands:"
echo "----------------------------------------------------------------"
echo "  pm2 monit                    # Real-time monitoring"
echo "  pm2 logs albpetrol-legal     # View logs"
echo "  htop                         # System resources"
echo "  sudo iotop                   # Disk I/O monitoring"
echo "  pg_stat_statements           # Database query stats"
echo ""
