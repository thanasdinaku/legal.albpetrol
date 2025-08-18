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

# Find application directory
POSSIBLE_DIRS=(
    "/opt/ceshtje-ligjore"
    "/opt/ceshtje_ligjore" 
    "/home/ceshtje-ligjore"
    "/var/www/ceshtje-ligjore"
    "/root/ceshtje-ligjore"
)

APP_DIR=""
for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ] && [ -f "$dir/package.json" ]; then
        APP_DIR="$dir"
        break
    fi
done

# If not found, search for it
if [ -z "$APP_DIR" ]; then
    echo -e "${YELLOW}[SEARCH]${NC} Searching for application directory..."
    FOUND_DIR=$(find /opt /home /var/www /root -name "package.json" -path "*/ceshtje*" 2>/dev/null | head -1 | dirname)
    if [ -n "$FOUND_DIR" ]; then
        APP_DIR="$FOUND_DIR"
    fi
fi

if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}Error: Application directory not found${NC}"
    echo "Searched locations:"
    for dir in "${POSSIBLE_DIRS[@]}"; do
        echo "  - $dir"
    done
    echo ""
    echo "Please run this script from the application directory or specify the correct path:"
    echo "cd /path/to/your/app && ./fix_header_ubuntu.sh"
    exit 1
fi

echo -e "${GREEN}[FOUND]${NC} Application directory: $APP_DIR"
cd "$APP_DIR"

# Check if this is the correct application
if [ ! -f "package.json" ] || ! grep -q "ceshtje" package.json 2>/dev/null; then
    echo -e "${RED}Error: This doesn't appear to be the Albanian legal case management application${NC}"
    echo "Current directory: $(pwd)"
    exit 1
fi

# Backup current files
echo -e "${GREEN}[INFO]${NC} Creating backup of original files..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
mkdir -p "backups/$TIMESTAMP"
BACKUP_DIR="backups/$TIMESTAMP"

# Files to update - check if they exist
declare -A FILES_TO_UPDATE
FILES_TO_UPDATE["client/index.html"]="HTML page title"
FILES_TO_UPDATE["client/src/components/sidebar.tsx"]="Sidebar header"  
FILES_TO_UPDATE["client/src/pages/landing.tsx"]="Landing page title"

# Create backups
for file in "${!FILES_TO_UPDATE[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        echo -e "${GREEN}[BACKUP]${NC} ${FILES_TO_UPDATE[$file]}: $file"
    else
        echo -e "${YELLOW}[SKIP]${NC} File not found: $file"
    fi
done

# Update HTML title and meta description
if [ -f "client/index.html" ]; then
    echo -e "${YELLOW}[UPDATE]${NC} Updating HTML page title..."
    sed -i 's|<title>Data Management System</title>|<title>Sistemi i Menaxhimit të Rasteve Ligjore</title>|g' client/index.html
    sed -i 's|<meta name="description" content="Professional data management system.*">|<meta name="description" content="Sistem profesional i menaxhimit të rasteve ligjore me kontroll të aksesit të bazuar në role për operacione efikase në bazën e të dhënave.">|g' client/index.html
fi

# Update sidebar title
if [ -f "client/src/components/sidebar.tsx" ]; then
    echo -e "${YELLOW}[UPDATE]${NC} Updating sidebar header text..."
    sed -i 's|Pasqyra e Ceshtjeve Ligjore|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/components/sidebar.tsx
    sed -i 's|Data Management System|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/components/sidebar.tsx
fi

# Update landing page title
if [ -f "client/src/pages/landing.tsx" ]; then
    echo -e "${YELLOW}[UPDATE]${NC} Updating landing page title..."
    sed -i 's|Sistemi i Menaxhimit të të Dhënave|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/pages/landing.tsx
    sed -i 's|Data Management System|Sistemi i Menaxhimit të Rasteve Ligjore|g' client/src/pages/landing.tsx
fi

# Check for any remaining references
echo -e "${GREEN}[CHECK]${NC} Checking for remaining references..."
if find client/ -name "*.tsx" -o -name "*.ts" -o -name "*.html" | xargs grep -l "Data Management System" 2>/dev/null; then
    echo -e "${YELLOW}[INFO]${NC} Found additional references to update"
    find client/ -name "*.tsx" -o -name "*.ts" -o -name "*.html" | xargs sed -i 's|Data Management System|Sistemi i Menaxhimit të Rasteve Ligjore|g' 2>/dev/null
else
    echo -e "${GREEN}[INFO]${NC} No more 'Data Management System' references found"
fi

# Build application if npm is available
if command -v npm >/dev/null 2>&1; then
    echo -e "${GREEN}[BUILD]${NC} Rebuilding application..."
    npm run build
else
    echo -e "${YELLOW}[SKIP]${NC} npm not found, skipping build"
fi

# Restart services
echo -e "${GREEN}[RESTART]${NC} Restarting services..."

# Try different service names
SERVICE_NAMES=("albpetrol-legal" "ceshtje-ligjore" "legal-case-system")
SERVICE_RESTARTED=false

for service in "${SERVICE_NAMES[@]}"; do
    if systemctl is-enabled "$service" >/dev/null 2>&1; then
        echo -e "${GREEN}[RESTART]${NC} Restarting $service..."
        systemctl restart "$service"
        sleep 2
        if systemctl is-active --quiet "$service"; then
            echo -e "${GREEN}[SUCCESS]${NC} Service $service restarted successfully"
            SERVICE_RESTARTED=true
            break
        fi
    fi
done

if [ "$SERVICE_RESTARTED" = false ]; then
    echo -e "${YELLOW}[WARNING]${NC} Could not find/restart application service"
    echo "Try manually: systemctl restart [your-service-name]"
fi

# Reload nginx if available
if systemctl is-active --quiet nginx >/dev/null 2>&1; then
    echo -e "${GREEN}[RELOAD]${NC} Reloading nginx..."
    systemctl reload nginx
else
    echo -e "${YELLOW}[SKIP]${NC} nginx not running or not found"
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}HEADER UPDATE COMPLETED!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Changes Made:${NC}"
echo "✓ Browser tab title: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "✓ HTML meta description: Updated to Albanian"
echo "✓ Sidebar header: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "✓ Landing page title: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo ""
echo -e "${BLUE}Backup Location:${NC}"
echo "$APP_DIR/$BACKUP_DIR"
echo ""
echo -e "${BLUE}Test Your Changes:${NC}"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Check browser tab shows: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "3. Verify sidebar header shows Albanian text"
echo ""
echo -e "${BLUE}If Issues Occur:${NC}"
echo "Restore backup: cp $BACKUP_DIR/* client/ && npm run build"
echo ""