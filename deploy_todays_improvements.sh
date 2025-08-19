#!/bin/bash
# Deploy Today's Improvements to Ubuntu Production Server
# Date: 2025-08-19
# Improvements: Document upload fixes + Court session fields in edit form

echo "🚀 Deploying today's improvements to Ubuntu production server..."
echo "📅 $(date)"
echo ""

# Production server details
PROD_SERVER="10.5.20.31"
PROD_USER="admuser"
PROD_PATH="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"

echo "=== STEP 1: BACKUP CURRENT PRODUCTION ==="
ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && sudo cp -r . ../backup_$(date +%Y%m%d_%H%M%S)"
echo "✅ Production backup created"

echo ""
echo "=== STEP 2: PREPARE FILES FOR DEPLOYMENT ==="
# Create temporary deployment directory
DEPLOY_DIR="temp_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir $DEPLOY_DIR

# Copy the improved files to deployment directory
echo "📋 Copying improved files..."
cp client/src/components/case-edit-form.tsx $DEPLOY_DIR/
cp client/src/components/case-entry-form.tsx $DEPLOY_DIR/
cp client/src/components/DocumentUploader.tsx $DEPLOY_DIR/
cp server/routes.ts $DEPLOY_DIR/
cp server/objectStorage.ts $DEPLOY_DIR/
cp package.json $DEPLOY_DIR/
cp package-lock.json $DEPLOY_DIR/

# Create deployment verification script
cat > $DEPLOY_DIR/verify_deployment.sh << 'VERIFY_EOF'
#!/bin/bash
echo "🔍 Verifying deployment..."

# Check if service is running
if systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Service is running"
else
    echo "❌ Service is not running"
    exit 1
fi

# Check if application responds
if curl -s -f http://localhost:5000/api/auth/user > /dev/null; then
    echo "✅ API endpoint responding"
else
    echo "❌ API endpoint not responding"
    exit 1
fi

# Check for syntax errors in logs
if journalctl -u albpetrol-legal --since "1 minute ago" | grep -i "error\|failed" | grep -v "401\|Unauthorized"; then
    echo "⚠️  Found errors in logs"
    exit 1
else
    echo "✅ No critical errors in logs"
fi

echo "✅ Deployment verification successful"
VERIFY_EOF

chmod +x $DEPLOY_DIR/verify_deployment.sh

echo "✅ Files prepared for deployment"

echo ""
echo "=== STEP 3: TRANSFER FILES TO PRODUCTION ==="
# Transfer files to production server
echo "📤 Transferring files to production server..."
scp -r $DEPLOY_DIR/* $PROD_USER@$PROD_SERVER:/tmp/
echo "✅ Files transferred"

echo ""
echo "=== STEP 4: DEPLOY ON PRODUCTION SERVER ==="
ssh $PROD_USER@$PROD_SERVER << 'DEPLOY_EOF'
set -e

echo "🔧 Starting deployment on production server..."
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Stop the service
echo "⏹️  Stopping albpetrol-legal service..."
sudo systemctl stop albpetrol-legal

# Backup current files
echo "💾 Creating file backups..."
sudo cp client/src/components/case-edit-form.tsx client/src/components/case-edit-form.tsx.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/DocumentUploader.tsx client/src/components/DocumentUploader.tsx.backup.$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp server/routes.ts server/routes.ts.backup.$(date +%Y%m%d_%H%M%S)
sudo cp server/objectStorage.ts server/objectStorage.ts.backup.$(date +%Y%m%d_%H%M%S)

# Deploy the improved files
echo "📁 Deploying improved files..."
sudo cp /tmp/case-edit-form.tsx client/src/components/
sudo cp /tmp/case-entry-form.tsx client/src/components/
sudo cp /tmp/DocumentUploader.tsx client/src/components/
sudo cp /tmp/routes.ts server/
sudo cp /tmp/objectStorage.ts server/
sudo cp /tmp/package.json .
sudo cp /tmp/package-lock.json .

# Set proper permissions
sudo chown -R admuser:admuser .
sudo chmod -R 755 client/src/components/
sudo chmod -R 755 server/

# Install any new dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🏗️  Building application..."
npm run build

# Start the service
echo "▶️  Starting albpetrol-legal service..."
sudo systemctl start albpetrol-legal

# Wait a moment for service to start
sleep 10

# Check service status
echo "🔍 Checking service status..."
sudo systemctl status albpetrol-legal --no-pager

# Run verification
echo "✅ Running deployment verification..."
chmod +x /tmp/verify_deployment.sh
/tmp/verify_deployment.sh

echo "🎉 Deployment completed successfully!"
DEPLOY_EOF

DEPLOY_RESULT=$?

echo ""
echo "=== STEP 5: CLEANUP ==="
# Clean up temporary files
rm -rf $DEPLOY_DIR
ssh $PROD_USER@$PROD_SERVER "rm -f /tmp/case-*.tsx /tmp/DocumentUploader.tsx /tmp/routes.ts /tmp/objectStorage.ts /tmp/package*.json /tmp/verify_deployment.sh"

echo ""
if [ $DEPLOY_RESULT -eq 0 ]; then
    echo "🎉 DEPLOYMENT SUCCESSFUL!"
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
    echo "📊 Next steps:"
    echo "   1. Test document upload functionality"
    echo "   2. Verify all form fields are working"
    echo "   3. Check case editing with new court session fields"
    echo ""
else
    echo "❌ DEPLOYMENT FAILED!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check service logs: sudo journalctl -u albpetrol-legal -f"
    echo "   2. Verify application status: sudo systemctl status albpetrol-legal"
    echo "   3. Check application logs: cd $PROD_PATH && npm run dev"
    echo ""
    echo "🔙 Rollback if needed:"
    echo "   ssh $PROD_USER@$PROD_SERVER 'cd $PROD_PATH && sudo systemctl stop albpetrol-legal && sudo cp -r ../backup_* . && sudo systemctl start albpetrol-legal'"
fi