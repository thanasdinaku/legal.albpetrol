#!/bin/bash
# Final Automated Deployment Script for Today's Improvements
# Date: 2025-08-19
# Optimized for Ubuntu server deployment

set -e  # Exit on any error

echo "=============================================="
echo "🚀 AUTOMATED DEPLOYMENT - TODAY'S IMPROVEMENTS"
echo "=============================================="
echo "Date: $(date)"
echo "User: $(whoami)"
echo "Directory: $(pwd)"
echo ""

# Configuration
PROD_SERVER="10.5.20.31"
PROD_USER="admuser"
PROD_PATH="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"
LOCAL_PROJECT_DIR="."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Function to check if we're in the right directory
check_project_structure() {
    print_status "Verifying project structure..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Run this script from the project root."
        exit 1
    fi
    
    if [ ! -d "client/src/components" ]; then
        print_error "client/src/components directory not found."
        exit 1
    fi
    
    if [ ! -d "server" ]; then
        print_error "server directory not found."
        exit 1
    fi
    
    # Check for specific improved files
    REQUIRED_FILES=(
        "client/src/components/case-edit-form.tsx"
        "client/src/components/case-entry-form.tsx"
        "client/src/components/DocumentUploader.tsx"
        "server/routes.ts"
    )
    
    for file in "${REQUIRED_FILES[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file not found: $file"
            exit 1
        fi
    done
    
    print_success "Project structure verified"
}

# Function to test SSH connection
test_ssh_connection() {
    print_status "Testing SSH connection to production server..."
    
    if ssh -o ConnectTimeout=10 -o BatchMode=yes $PROD_USER@$PROD_SERVER "echo 'SSH test successful'" 2>/dev/null; then
        print_success "Passwordless SSH connection established"
        return 0
    else
        print_warning "Passwordless SSH not available. Will prompt for password."
        return 1
    fi
}

# Function to create deployment package
create_deployment_package() {
    print_status "Creating deployment package..."
    
    DEPLOY_DIR="deployment_package_$(date +%Y%m%d_%H%M%S)"
    mkdir -p $DEPLOY_DIR
    
    # Copy improved files
    cp client/src/components/case-edit-form.tsx $DEPLOY_DIR/
    cp client/src/components/case-entry-form.tsx $DEPLOY_DIR/
    cp client/src/components/DocumentUploader.tsx $DEPLOY_DIR/
    cp server/routes.ts $DEPLOY_DIR/
    cp package.json $DEPLOY_DIR/
    cp package-lock.json $DEPLOY_DIR/
    
    # Create server deployment script
    cat > $DEPLOY_DIR/server_deploy.sh << 'EOF'
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
EOF

    chmod +x $DEPLOY_DIR/server_deploy.sh
    
    print_success "Deployment package created: $DEPLOY_DIR"
    echo $DEPLOY_DIR
}

# Function to transfer files
transfer_files() {
    local deploy_dir=$1
    print_status "Transferring files to production server..."
    
    scp -r $deploy_dir/* $PROD_USER@$PROD_SERVER:/tmp/
    
    print_success "Files transferred successfully"
}

# Function to execute deployment
execute_deployment() {
    print_status "Executing deployment on production server..."
    
    ssh $PROD_USER@$PROD_SERVER "chmod +x /tmp/server_deploy.sh && /tmp/server_deploy.sh"
    
    return $?
}

# Function to cleanup
cleanup() {
    local deploy_dir=$1
    print_status "Cleaning up temporary files..."
    
    # Local cleanup
    rm -rf $deploy_dir
    
    # Remote cleanup
    ssh $PROD_USER@$PROD_SERVER "rm -f /tmp/case-*.tsx /tmp/DocumentUploader.tsx /tmp/routes.ts /tmp/package*.json /tmp/server_deploy.sh" 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Main deployment function
main() {
    echo "Starting automated deployment process..."
    echo ""
    
    # Step 1: Verify project structure
    check_project_structure
    
    # Step 2: Test SSH connection
    SSH_PASSWORDLESS=false
    if test_ssh_connection; then
        SSH_PASSWORDLESS=true
    fi
    
    # Step 3: Create deployment package
    DEPLOY_DIR=$(create_deployment_package)
    
    # Step 4: Transfer files
    if [ "$SSH_PASSWORDLESS" = true ]; then
        transfer_files $DEPLOY_DIR
    else
        print_warning "You will be prompted for SSH password during file transfer..."
        transfer_files $DEPLOY_DIR
    fi
    
    # Step 5: Execute deployment
    print_status "Executing deployment on production server..."
    if [ "$SSH_PASSWORDLESS" = true ]; then
        execute_deployment
    else
        print_warning "You will be prompted for SSH password during deployment execution..."
        execute_deployment
    fi
    
    DEPLOY_RESULT=$?
    
    # Step 6: Cleanup
    cleanup $DEPLOY_DIR
    
    # Final status
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
        echo "🔍 Manual verification commands:"
        echo "   ssh admuser@10.5.20.31 'sudo systemctl status albpetrol-legal'"
        echo "   ssh admuser@10.5.20.31 'sudo journalctl -u albpetrol-legal -f'"
    else
        print_error "❌ DEPLOYMENT FAILED!"
        echo ""
        echo "🔧 Troubleshooting:"
        echo "   1. Check service status: ssh admuser@10.5.20.31 'sudo systemctl status albpetrol-legal'"
        echo "   2. Check logs: ssh admuser@10.5.20.31 'sudo journalctl -u albpetrol-legal -f'"
        echo "   3. Manual check: ssh admuser@10.5.20.31 'cd $PROD_PATH && npm run dev'"
        echo ""
        echo "🔙 Rollback command:"
        echo "   ssh admuser@10.5.20.31 'cd $PROD_PATH && sudo systemctl stop albpetrol-legal && sudo cp -r ../backup_* . && sudo systemctl start albpetrol-legal'"
    fi
    echo "=============================================="
    
    exit $DEPLOY_RESULT
}

# Run main function
main