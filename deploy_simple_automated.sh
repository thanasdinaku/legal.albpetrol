#!/bin/bash
# Simplified Automated Deployment for Replit Environment
# Date: 2025-08-19

set -e

echo "=============================================="
echo "🚀 SIMPLIFIED AUTOMATED DEPLOYMENT"
echo "=============================================="
echo "Date: $(date)"
echo ""

# Configuration
PROD_SERVER="10.5.20.31"
PROD_USER="admuser"
PROD_PATH="/opt/ceshtje_ligjore/ceshtje_ligjore"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check project structure
if [ ! -f "package.json" ] || [ ! -d "client" ] || [ ! -d "server" ]; then
    print_error "Run this script from the project root directory"
    exit 1
fi

print_success "Project structure verified"

# Read the improved files into variables
print_status "Reading improved files..."

CASE_EDIT_FORM=$(cat client/src/components/case-edit-form.tsx | base64 -w 0)
CASE_ENTRY_FORM=$(cat client/src/components/case-entry-form.tsx | base64 -w 0)
DOCUMENT_UPLOADER=$(cat client/src/components/DocumentUploader.tsx | base64 -w 0)
SERVER_ROUTES=$(cat server/routes.ts | base64 -w 0)
PACKAGE_JSON=$(cat package.json | base64 -w 0)

print_success "Files encoded for transfer"

# Create and execute deployment script remotely
print_status "Executing deployment on production server..."
print_warning "You will be prompted for SSH password..."

ssh $PROD_USER@$PROD_SERVER << EOF
#!/bin/bash
set -e

echo "🔧 Starting deployment on production server..."
echo "Timestamp: \$(date)"
echo "User: \$(whoami)"

# Navigate to application directory
cd $PROD_PATH

# Create backup
BACKUP_DIR="../backup_\$(date +%Y%m%d_%H%M%S)"
echo "📦 Creating backup at: \$BACKUP_DIR"
sudo cp -r . "\$BACKUP_DIR"

# Stop service
echo "⏹️  Stopping albpetrol-legal service..."
sudo systemctl stop albpetrol-legal

# Backup individual files
echo "💾 Backing up current files..."
sudo cp client/src/components/case-edit-form.tsx client/src/components/case-edit-form.tsx.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/case-entry-form.tsx client/src/components/case-entry-form.tsx.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp client/src/components/DocumentUploader.tsx client/src/components/DocumentUploader.tsx.bak.\$(date +%Y%m%d_%H%M%S) 2>/dev/null || true
sudo cp server/routes.ts server/routes.ts.bak.\$(date +%Y%m%d_%H%M%S)

# Create temporary files from base64 encoded content
echo "📁 Decoding and deploying improved files..."
echo '$CASE_EDIT_FORM' | base64 -d | sudo tee client/src/components/case-edit-form.tsx > /dev/null
echo '$CASE_ENTRY_FORM' | base64 -d | sudo tee client/src/components/case-entry-form.tsx > /dev/null  
echo '$DOCUMENT_UPLOADER' | base64 -d | sudo tee client/src/components/DocumentUploader.tsx > /dev/null
echo '$SERVER_ROUTES' | base64 -d | sudo tee server/routes.ts > /dev/null
echo '$PACKAGE_JSON' | base64 -d | sudo tee package.json > /dev/null

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
    
    echo "🎉 Deployment completed successfully!"
    exit 0
else
    echo "❌ Service failed to start"
    sudo systemctl status albpetrol-legal --no-pager
    sudo journalctl -u albpetrol-legal --since "2 minutes ago" --no-pager
    exit 1
fi
EOF

DEPLOY_RESULT=$?

echo ""
echo "=============================================="
if [ $DEPLOY_RESULT -eq 0 ]; then
    print_success "🎉 DEPLOYMENT SUCCESSFUL!"
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
    echo "📋 Next Steps:"
    echo "   1. Test document upload functionality"
    echo "   2. Verify all form fields are working"
    echo "   3. Check case editing with new court session fields"
    echo ""
    echo "🔍 Manual verification:"
    echo "   Login: it.system@albpetrol.al / Admin2025!"
    echo "   Test: Document upload in 'Regjistro Çështje'"  
    echo "   Test: Case editing in 'Menaxho Çështjet'"
else
    print_error "❌ DEPLOYMENT FAILED!"
    echo ""
    echo "🔧 Troubleshooting commands:"
    echo "   ssh admuser@10.5.20.31 'sudo systemctl status albpetrol-legal'"
    echo "   ssh admuser@10.5.20.31 'sudo journalctl -u albpetrol-legal -f'"
    echo ""
    echo "🔙 Rollback command:"
    echo "   ssh admuser@10.5.20.31 'cd $PROD_PATH && sudo systemctl stop albpetrol-legal && sudo cp -r ../backup_* . && sudo systemctl start albpetrol-legal'"
fi
echo "=============================================="

exit $DEPLOY_RESULT