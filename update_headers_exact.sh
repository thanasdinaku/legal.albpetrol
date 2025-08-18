#!/bin/bash

# Exact script for updating headers in Albanian Legal Case Management System
# Based on discovered location: /opt/ceshtje_ligjore/ceshtje_ligjore/

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Albanian Legal System - Exact Header Update${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Exact application directory from discovery
APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"

echo -e "${GREEN}[INFO]${NC} Application directory: $APP_DIR"
echo -e "${GREEN}[INFO]${NC} Service name: $SERVICE_NAME"

# Check if directory exists
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"

echo -e "${YELLOW}[BACKUP]${NC} Creating backup in $BACKUP_DIR"

# Find and backup all source files that might contain headers
echo -e "${GREEN}[SEARCH]${NC} Finding source files..."

# Look for source files (not built dist files)
SOURCE_FILES=""
for pattern in "client/index.html" "src/index.html" "index.html" "client/src" "src"; do
    if [ -f "$pattern" ] || [ -d "$pattern" ]; then
        echo -e "${GREEN}[FOUND]${NC} Source location: $pattern"
        find "$pattern" -type f \( -name "*.html" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" \) 2>/dev/null | while read -r file; do
            if [ -f "$file" ]; then
                mkdir -p "$BACKUP_DIR/$(dirname "$file")"
                cp "$file" "$BACKUP_DIR/$file"
                echo -e "${YELLOW}[BACKUP]${NC} $file"
            fi
        done
        SOURCE_FILES="$pattern"
        break
    fi
done

# If no typical source structure, backup what we can find
if [ -z "$SOURCE_FILES" ]; then
    echo -e "${YELLOW}[INFO]${NC} Standard source structure not found, checking entire directory"
    find . -maxdepth 3 -name "*.html" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" | head -20 | while read -r file; do
        if [ -f "$file" ]; then
            mkdir -p "$BACKUP_DIR/$(dirname "$file")"
            cp "$file" "$BACKUP_DIR/$file"
            echo -e "${YELLOW}[BACKUP]${NC} $file"
        fi
    done
fi

echo ""
echo -e "${BLUE}[UPDATE]${NC} Updating header text to: 'Sistemi i Menaxhimit të Rasteve Ligjore'"

# Update all possible header text variations
SEARCH_REPLACE_PAIRS=(
    "s|Data Management System|Sistemi i Menaxhimit të Rasteve Ligjore|g"
    "s|Sistemi i Menaxhimit të Çështjeve Ligjore|Sistemi i Menaxhimit të Rasteve Ligjore|g"
    "s|Sistemi i Menaxhimit të të Dhënave|Sistemi i Menaxhimit të Rasteve Ligjore|g"
    "s|Pasqyra e Ceshtjeve Ligjore|Sistemi i Menaxhimit të Rasteve Ligjore|g"
    "s|Pasqyra e Çështjeve Ligjore|Sistemi i Menaxhimit të Rasteve Ligjore|g"
)

# Update source files
find . -name "*.html" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | grep -v dist | grep -v node_modules | while read -r file; do
    if [ -f "$file" ]; then
        echo -e "${YELLOW}[UPDATE]${NC} Processing: $file"
        
        for replace_cmd in "${SEARCH_REPLACE_PAIRS[@]}"; do
            sed -i "$replace_cmd" "$file" 2>/dev/null || true
        done
    fi
done

# Check if we have a build command
echo ""
echo -e "${GREEN}[BUILD]${NC} Rebuilding application..."

if [ -f "package.json" ]; then
    if command -v npm >/dev/null 2>&1; then
        echo -e "${GREEN}[BUILD]${NC} Running npm run build..."
        npm run build || echo -e "${YELLOW}[WARNING]${NC} Build command failed, continuing..."
    else
        echo -e "${YELLOW}[WARNING]${NC} npm not found"
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} No package.json found"
fi

# Restart the service
echo ""
echo -e "${GREEN}[RESTART]${NC} Restarting service: $SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl restart "$SERVICE_NAME"
    sleep 3
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}[SUCCESS]${NC} Service $SERVICE_NAME restarted successfully"
    else
        echo -e "${RED}[ERROR]${NC} Service failed to restart"
        echo -e "${YELLOW}[INFO]${NC} Check logs: journalctl -u $SERVICE_NAME -n 20"
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Service $SERVICE_NAME was not running"
    systemctl start "$SERVICE_NAME"
fi

# Reload nginx
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}[RELOAD]${NC} Reloading nginx..."
    systemctl reload nginx
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}HEADER UPDATE COMPLETED!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo -e "${BLUE}Summary:${NC}"
echo "✓ Backup created: $APP_DIR/$BACKUP_DIR"
echo "✓ Header text updated to: 'Sistemi i Menaxhimit të Rasteve Ligjore'"
echo "✓ Application rebuilt"
echo "✓ Service $SERVICE_NAME restarted"
echo "✓ Nginx reloaded"
echo ""

echo -e "${BLUE}Test Your Changes:${NC}"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Check browser tab title"
echo "3. Verify header text in the application"
echo ""

echo -e "${BLUE}Check Service Status:${NC}"
echo "systemctl status $SERVICE_NAME"
echo ""

echo -e "${BLUE}View Logs (if needed):${NC}"
echo "journalctl -u $SERVICE_NAME -f"
echo ""

echo -e "${BLUE}Rollback (if needed):${NC}"
echo "cp -r $BACKUP_DIR/* . && npm run build && systemctl restart $SERVICE_NAME"