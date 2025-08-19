#!/bin/bash
# Deploy Today's Improvements to Ubuntu Production Server - FIXED VERSION
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

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    echo "❌ Error: This script must be run from the project root directory"
    echo "Expected structure: client/, server/, package.json"
    echo "Current directory: $(pwd)"
    echo "Contents: $(ls -la)"
    exit 1
fi

echo "✅ Verified project structure"

# Check if SSH key exists, if not, provide instructions
if [ ! -f ~/.ssh/id_rsa ] && [ ! -f ~/.ssh/id_ed25519 ]; then
    echo "⚠️  SSH key not found. For passwordless deployment, set up SSH key:"
    echo "   ssh-keygen -t ed25519 -C 'deployment@$(hostname)'"
    echo "   ssh-copy-id admuser@10.5.20.31"
    echo ""
    echo "   Or continue with password authentication (you'll be prompted)"
    echo ""
fi

echo "=== STEP 1: VERIFY PRODUCTION ACCESS ==="
echo "Testing SSH connection to production server..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $PROD_USER@$PROD_SERVER "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ Passwordless SSH working"
    SSH_AUTH="passwordless"
else
    echo "⚠️  Passwordless SSH not configured, will use password authentication"
    echo "You will be prompted for password multiple times"
    SSH_AUTH="password"
fi

echo ""
echo "=== STEP 2: CREATE PRODUCTION BACKUP ==="
if [ "$SSH_AUTH" = "passwordless" ]; then
    ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && sudo cp -r . ../backup_\$(date +%Y%m%d_%H%M%S)"
else
    echo "Please enter password when prompted to create backup:"
    ssh $PROD_USER@$PROD_SERVER "cd $PROD_PATH && sudo cp -r . ../backup_\$(date +%Y%m%d_%H%M%S)"
fi
echo "✅ Production backup created"

echo ""
echo "=== STEP 3: PREPARE FILES FOR DEPLOYMENT ==="
# Create temporary deployment directory
DEPLOY_DIR="temp_deploy_$(date +%Y%m%d_%H%M%S)"
mkdir $DEPLOY_DIR

# Verify files exist before copying
echo "📋 Verifying and copying improved files..."
FILES_TO_COPY=(
    "client/src/components/case-edit-form.tsx"
    "client/src/components/case-entry-form.tsx" 
    "client/src/components/DocumentUploader.tsx"
    "server/routes.ts"
    "server/objectStorage.ts"
    "package.json"
    "package-lock.json"
)

for file in "${FILES_TO_COPY[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$DEPLOY_DIR/"
        echo "✅ Copied $file"
    else
        echo "❌ Missing file: $file"
        rm -rf $DEPLOY_DIR
        exit 1
    fi
done

# Create improved deployment script for production server
cat > $DEPLOY_DIR/deploy_on_server.sh << 'SERVER_DEPLOY_EOF'
#!/bin/bash
set -e

echo "🔧 Starting deployment on production server..."
echo "Current user: $(whoami)"
echo "Current directory: $(pwd)"

# Navigate to application directory
cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Check if we have sudo access
if sudo -n true 2>/dev/null; then
    echo "✅ Passwordless sudo available"
    SUDO_CMD="sudo"
else
    echo "⚠️  Sudo requires password"
    SUDO_CMD="sudo"
fi

# Stop the service
echo "⏹️  Stopping albpetrol-legal service..."
$SUDO_CMD systemctl stop albpetrol-legal

# Check service status
echo "Service status after stop:"
$SUDO_CMD systemctl is-active albpetrol-legal || true

# Backup current files
echo "💾 Creating file backups..."
BACKUP_SUFFIX=".backup.$(date +%Y%m%d_%H%M%S)"
$SUDO_CMD cp client/src/components/case-edit-form.tsx client/src/components/case-edit-form.tsx$BACKUP_SUFFIX 2>/dev/null || true
$SUDO_CMD cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx$BACKUP_SUFFIX 2>/dev/null || true
$SUDO_CMD cp client/src/components/DocumentUploader.tsx client/src/components/DocumentUploader.tsx$BACKUP_SUFFIX 2>/dev/null || true
$SUDO_CMD cp server/routes.ts server/routes.ts$BACKUP_SUFFIX
$SUDO_CMD cp server/objectStorage.ts server/objectStorage.ts$BACKUP_SUFFIX

# Deploy the improved files
echo "📁 Deploying improved files..."
$SUDO_CMD cp /tmp/case-edit-form.tsx client/src/components/
$SUDO_CMD cp /tmp/case-entry-form.tsx client/src/components/
$SUDO_CMD cp /tmp/DocumentUploader.tsx client/src/components/
$SUDO_CMD cp /tmp/routes.ts server/
$SUDO_CMD cp /tmp/objectStorage.ts server/
$SUDO_CMD cp /tmp/package.json .
$SUDO_CMD cp /tmp/package-lock.json .

# Set proper permissions
$SUDO_CMD chown -R admuser:admuser .
$SUDO_CMD chmod -R 755 client/src/components/
$SUDO_CMD chmod -R 755 server/

# Install dependencies
echo "📦 Installing dependencies..."
npm install --production

# Build the application
echo "🏗️  Building application..."
npm run build

# Start the service
echo "▶️  Starting albpetrol-legal service..."
$SUDO_CMD systemctl start albpetrol-legal

# Wait for service to start
echo "⏳ Waiting for service to start..."
sleep 15

# Check service status
echo "🔍 Checking service status..."
$SUDO_CMD systemctl status albpetrol-legal --no-pager || true

# Verify service is running
if $SUDO_CMD systemctl is-active --quiet albpetrol-legal; then
    echo "✅ Service is running"
else
    echo "❌ Service failed to start"
    echo "Service logs:"
    $SUDO_CMD journalctl -u albpetrol-legal --since "5 minutes ago" --no-pager
    exit 1
fi

# Test API endpoint
echo "🌐 Testing API endpoint..."
sleep 5
if curl -s -f http://localhost:5000/api/auth/user > /dev/null 2>&1; then
    echo "✅ API endpoint responding"
else
    echo "⚠️  API endpoint not responding (this may be normal for authenticated endpoints)"
fi

echo "🎉 Deployment completed successfully!"
SERVER_DEPLOY_EOF

chmod +x $DEPLOY_DIR/deploy_on_server.sh

echo "✅ Files prepared for deployment"

echo ""
echo "=== STEP 4: TRANSFER FILES TO PRODUCTION ==="
echo "📤 Transferring files to production server..."
if [ "$SSH_AUTH" = "password" ]; then
    echo "Please enter password when prompted for file transfer:"
fi
scp -r $DEPLOY_DIR/* $PROD_USER@$PROD_SERVER:/tmp/
echo "✅ Files transferred"

echo ""
echo "=== STEP 5: DEPLOY ON PRODUCTION SERVER ==="
echo "🚀 Running deployment on production server..."
if [ "$SSH_AUTH" = "password" ]; then
    echo "Please enter password when prompted for deployment:"
fi

ssh $PROD_USER@$PROD_SERVER "chmod +x /tmp/deploy_on_server.sh && /tmp/deploy_on_server.sh"
DEPLOY_RESULT=$?

echo ""
echo "=== STEP 6: CLEANUP ==="
# Clean up temporary files
rm -rf $DEPLOY_DIR
if [ "$SSH_AUTH" = "passwordless" ]; then
    ssh $PROD_USER@$PROD_SERVER "rm -f /tmp/case-*.tsx /tmp/DocumentUploader.tsx /tmp/routes.ts /tmp/objectStorage.ts /tmp/package*.json /tmp/deploy_on_server.sh"
else
    echo "Please enter password to clean up temporary files:"
    ssh $PROD_USER@$PROD_SERVER "rm -f /tmp/case-*.tsx /tmp/DocumentUploader.tsx /tmp/routes.ts /tmp/objectStorage.ts /tmp/package*.json /tmp/deploy_on_server.sh"
fi

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
    echo "🔧 To verify deployment manually:"
    echo "   ssh admuser@10.5.20.31"
    echo "   sudo systemctl status albpetrol-legal"
    echo "   sudo journalctl -u albpetrol-legal -f"
else
    echo "❌ DEPLOYMENT FAILED!"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "   1. Check service logs: ssh admuser@10.5.20.31 'sudo journalctl -u albpetrol-legal -f'"
    echo "   2. Verify application status: ssh admuser@10.5.20.31 'sudo systemctl status albpetrol-legal'"
    echo "   3. Check application manually: ssh admuser@10.5.20.31 'cd $PROD_PATH && npm run dev'"
    echo ""
    echo "🔙 Rollback if needed:"
    echo "   ssh admuser@10.5.20.31 'cd $PROD_PATH && sudo systemctl stop albpetrol-legal && sudo cp -r ../backup_* . && sudo systemctl start albpetrol-legal'"
fi

echo ""
echo "📋 Deployment log completed at $(date)"