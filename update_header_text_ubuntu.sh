#!/bin/bash

# Script to update header text from "Data Management System" to "Sistemi i Menaxhimit të Rasteve Ligjore"
# For Albanian Legal Case Management System on Ubuntu

set -e

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Albanian Legal System Header Update Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Application directory
APP_DIR="/opt/ceshtje-ligjore"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory $APP_DIR not found${NC}"
    echo "Please make sure the application is installed in the correct location"
    exit 1
fi

echo -e "${GREEN}[INFO]${NC} Updating header text to Albanian..."
echo -e "${GREEN}[INFO]${NC} Application directory: $APP_DIR"

cd $APP_DIR

# Backup current files
echo -e "${GREEN}[INFO]${NC} Creating backup of original files..."
mkdir -p backups/$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"

# Files to update
FILES_TO_UPDATE=(
    "client/index.html"
    "client/src/components/sidebar.tsx"
    "client/src/pages/landing.tsx"
)

# Create backups
for file in "${FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo -e "${GREEN}[INFO]${NC} Backed up: $file"
    fi
done

echo -e "${YELLOW}[UPDATE]${NC} Updating HTML page title..."
# Update HTML title and meta description
sed -i 's|<title>Data Management System</title>|<title>Sistemi i Menaxhimit të Rasteve Ligjore</title>|g' client/index.html
sed -i 's|<meta name="description" content="Professional data management system with role-based access control for efficient database operations.">|<meta name="description" content="Sistem profesional i menaxhimit të rasteve ligjore me kontroll të aksesit të bazuar në role për operacione efikase në bazën e të dhënave.">|g' client/index.html

echo -e "${YELLOW}[UPDATE]${NC} Updating sidebar header text..."
# Update sidebar title
sed -i 's|Pasqyra e Ceshtjeve Ligjore|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/components/sidebar.tsx

echo -e "${YELLOW}[UPDATE]${NC} Updating landing page title..."
# Update landing page title
sed -i 's|Sistemi i Menaxhimit të të Dhënave|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/pages/landing.tsx

# Check if any other files contain the old text
echo -e "${GREEN}[INFO]${NC} Checking for any remaining references..."
grep -r "Data Management System" client/ || echo -e "${GREEN}[INFO]${NC} No more 'Data Management System' references found"
grep -r "Pasqyra e Ceshtjeve Ligjore" client/src/ || echo -e "${GREEN}[INFO]${NC} Old Albanian title references updated"

echo -e "${GREEN}[INFO]${NC} Rebuilding application..."
# Rebuild the application
npm run build

echo -e "${GREEN}[INFO]${NC} Restarting application service..."
# Restart the application service
sudo systemctl restart albpetrol-legal

# Wait a moment for service to start
sleep 3

# Check service status
if systemctl is-active --quiet albpetrol-legal; then
    echo -e "${GREEN}[SUCCESS]${NC} Application service restarted successfully"
else
    echo -e "${RED}[ERROR]${NC} Application service failed to restart"
    echo -e "${YELLOW}[INFO]${NC} Check logs with: sudo journalctl -u albpetrol-legal -n 20"
    exit 1
fi

# Reload nginx to ensure changes are served
echo -e "${GREEN}[INFO]${NC} Reloading nginx..."
sudo systemctl reload nginx

echo -e "${GREEN}[INFO]${NC} Testing local application response..."
# Test if application responds
if curl -s http://localhost:5000/api/health > /dev/null; then
    echo -e "${GREEN}[SUCCESS]${NC} Application is responding on localhost:5000"
else
    echo -e "${YELLOW}[WARNING]${NC} Application may not be responding - check logs"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}HEADER UPDATE COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Changes Made:${NC}"
echo "✓ Browser tab title: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "✓ HTML meta description: Updated to Albanian"
echo "✓ Sidebar header: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "✓ Landing page title: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Test the application at: https://legal.albpetrol.al"
echo "2. Verify the header text displays correctly"
echo "3. Check browser tab title shows the new Albanian text"
echo ""
echo -e "${BLUE}Rollback (if needed):${NC}"
echo "Files backed up to: $APP_DIR/$BACKUP_DIR"
echo "To rollback: cp $BACKUP_DIR/* client/ && npm run build && sudo systemctl restart albpetrol-legal"
echo ""
echo -e "${BLUE}Logs and Troubleshooting:${NC}"
echo "- Application logs: sudo journalctl -u albpetrol-legal -f"
echo "- Service status: sudo systemctl status albpetrol-legal"
echo "- Nginx logs: sudo tail -f /var/log/nginx/error.log"
echo ""