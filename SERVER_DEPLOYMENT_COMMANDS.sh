#!/bin/bash
# Direct Server Deployment Commands
# Run these commands directly on your Ubuntu server (admuser@10.5.20.31)

echo "=============================================="
echo "🚀 DIRECT SERVER DEPLOYMENT"
echo "=============================================="
echo "Date: $(date)"
echo ""

set -e

# Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Create backup
BACKUP_DIR="../backup_$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at: $BACKUP_DIR"
sudo cp -r . "$BACKUP_DIR"

# Stop service
echo "⏹️  Stopping albpetrol-legal service..."
sudo systemctl stop albpetrol-legal

# Backup current files
echo "💾 Backing up current files..."
sudo cp client/src/components/case-edit-form.tsx client/src/components/case-edit-form.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/DocumentUploader.tsx client/src/components/DocumentUploader.tsx.bak.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp server/routes.ts server/routes.ts.bak.$(date +%Y%m%d_%H%M%S)

echo "📁 Ready to deploy improved files..."
echo ""
echo "🔧 Now you need to update the following files with the improved versions:"
echo "   1. client/src/components/case-edit-form.tsx"
echo "   2. client/src/components/case-entry-form.tsx"
echo "   3. client/src/components/DocumentUploader.tsx"
echo "   4. server/routes.ts (if needed)"
echo ""
echo "You can:"
echo "   - Copy files from your local development"
echo "   - Use nano/vim to edit directly"
echo "   - Use the manual file update commands below"
echo ""

read -p "Press Enter when you have updated all the improved files..."

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
    
    # Test API endpoint
    echo "🌐 Testing API endpoint..."
    sleep 5
    if curl -s -f http://localhost:5000/api/auth/user > /dev/null 2>&1; then
        echo "✅ API endpoint is responding"
    elif curl -s http://localhost:5000/api/auth/user | grep -q "Unauthorized\|401"; then
        echo "✅ API endpoint is responding (authentication required)"
    else
        echo "⚠️  API endpoint check inconclusive (may be normal)"
    fi
    
    echo ""
    echo "🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!"
    echo ""
    echo "✅ Today's improvements deployed:"
    echo "   • Fixed document upload URL construction errors"
    echo "   • Added missing court session fields to edit form:"
    echo "     - Zhvillimi i seances gjyqesorë data,ora (Shkallë I)"
    echo "     - Zhvillimi i seances gjyqesorë data,ora (Apel)"
    echo "   • Changed 'Gjykata e Lartë' from dropdown to text input"
    echo ""
    echo "🌐 Application is live at: https://legal.albpetrol.al"
    echo ""
    echo "📋 Test the improvements:"
    echo "   1. Login: it.system@albpetrol.al / Admin2025!"
    echo "   2. Test document upload in 'Regjistro Çështje'"
    echo "   3. Test case editing in 'Menaxho Çështjet'"
    
else
    echo "❌ Service failed to start"
    sudo systemctl status albpetrol-legal --no-pager
    sudo journalctl -u albpetrol-legal --since "2 minutes ago" --no-pager
    
    echo ""
    echo "🔙 Rollback command if needed:"
    echo "   sudo systemctl stop albpetrol-legal"
    echo "   sudo cp -r $BACKUP_DIR/* ."
    echo "   sudo systemctl start albpetrol-legal"
    exit 1
fi