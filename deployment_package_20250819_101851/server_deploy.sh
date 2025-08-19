#!/bin/bash
set -e

echo "🔧 Executing deployment on production server..."
echo "Timestamp: $(date)"
echo "User: $(whoami)"
echo "Working directory: $(pwd)"

# Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Create backup with timestamp
BACKUP_DIR="../backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at: $BACKUP_DIR"
sudo cp -r . "$BACKUP_DIR"

# Stop service
echo "⏹️  Stopping albpetrol-legal service..."
sudo systemctl stop albpetrol-legal

# Wait for service to stop
sleep 3

# Backup individual files
echo "💾 Backing up individual files..."
sudo cp client/src/components/case-edit-form.tsx client/src/components/case-edit-form.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/DocumentUploader.tsx client/src/components/DocumentUploader.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp server/routes.ts server/routes.ts.bak.$(date +%Y%m%d_%H%M%S)

# Deploy new files
echo "📁 Deploying improved files..."
sudo cp /tmp/case-edit-form.tsx client/src/components/
sudo cp /tmp/case-entry-form.tsx client/src/components/
sudo cp /tmp/DocumentUploader.tsx client/src/components/
sudo cp /tmp/routes.ts server/
sudo cp /tmp/package.json .
sudo cp /tmp/package-lock.json .

# Fix permissions
echo "🔐 Setting permissions..."
sudo chown -R admuser:admuser .
sudo chmod -R 755 client/src/components/
sudo chmod -R 755 server/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build application
echo "🏗️  Building application..."
npm run build

# Start service
echo "▶️  Starting albpetrol-legal service..."
sudo systemctl start albpetrol-legal

# Wait for service to start
echo "⏳ Waiting for service startup..."
sleep 15

# Verify service status
echo "🔍 Verifying service status..."
if sudo systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Service is running successfully"
else
    echo "❌ Service failed to start"
    sudo systemctl status albpetrol-legal --no-pager
    sudo journalctl -u albpetrol-legal --since "2 minutes ago" --no-pager
    exit 1
fi

# Test API endpoint
echo "🌐 Testing API endpoint..."
sleep 5
if curl -s -f http://localhost:5000/api/auth/user > /dev/null 2>&1; then
    echo "✅ API endpoint is responding"
elif curl -s http://localhost:5000/api/auth/user | grep -q "Unauthorized\|401"; then
    echo "✅ API endpoint is responding (authentication required)"
else
    echo "⚠️  API endpoint may have issues (check manually)"
fi

echo "🎉 Server deployment completed successfully!"
echo "🕒 Completed at: $(date)"
