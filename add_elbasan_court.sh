#!/bin/bash

# Script to add "Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan" to court dropdown
# For Albanian Legal Case Management System on Ubuntu Server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Adding Elbasan Court to Dropdown Menu${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Application directory (discovered from previous analysis)
APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"
TARGET_FILE="client/src/components/case-entry-form.tsx"

echo -e "${GREEN}[INFO]${NC} Application directory: $APP_DIR"
echo -e "${GREEN}[INFO]${NC} Target file: $TARGET_FILE"
echo -e "${GREEN}[INFO]${NC} Service: $SERVICE_NAME"

# Check if directory and file exist
if [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Application directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

if [ ! -f "$TARGET_FILE" ]; then
    echo -e "${RED}[ERROR]${NC} Target file not found: $TARGET_FILE"
    echo -e "${YELLOW}[INFO]${NC} Available files in client/src/components/:"
    ls -la client/src/components/ 2>/dev/null || echo "Directory not found"
    exit 1
fi

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$TARGET_FILE.backup_$TIMESTAMP"
cp "$TARGET_FILE" "$BACKUP_FILE"
echo -e "${YELLOW}[BACKUP]${NC} Created backup: $BACKUP_FILE"

# Show current court options before change
echo -e "${BLUE}[CURRENT]${NC} Current court options:"
grep -A 10 "SelectContent" "$TARGET_FILE" | grep "SelectItem" | sed 's/.*value="\([^"]*\)".*/  - \1/' || true

echo ""
echo -e "${BLUE}[UPDATE]${NC} Adding Elbasan court option..."

# Add Elbasan court option in alphabetical order (after Berat, before Fier)
sed -i '/Gjykata e Shkallës së Parë e Rrethit Gjyqësor Berat/a\
                            <SelectItem value="Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan">Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan</SelectItem>' "$TARGET_FILE"

# Verify the change was made
if grep -q "Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan" "$TARGET_FILE"; then
    echo -e "${GREEN}[SUCCESS]${NC} Elbasan court option added successfully"
else
    echo -e "${RED}[ERROR]${NC} Failed to add Elbasan court option"
    echo -e "${YELLOW}[RESTORE]${NC} Restoring backup..."
    cp "$BACKUP_FILE" "$TARGET_FILE"
    exit 1
fi

# Show updated court options
echo ""
echo -e "${BLUE}[UPDATED]${NC} Updated court options:"
grep -A 10 "SelectContent" "$TARGET_FILE" | grep "SelectItem" | sed 's/.*value="\([^"]*\)".*/  - \1/' || true

# Build the application
echo ""
echo -e "${GREEN}[BUILD]${NC} Rebuilding application..."

if [ -f "package.json" ] && command -v npm >/dev/null 2>&1; then
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}[SUCCESS]${NC} Application built successfully"
    else
        echo -e "${RED}[ERROR]${NC} Build failed"
        echo -e "${YELLOW}[RESTORE]${NC} Restoring backup..."
        cp "$BACKUP_FILE" "$TARGET_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} npm or package.json not found, skipping build"
fi

# Restart the service
echo ""
echo -e "${GREEN}[RESTART]${NC} Restarting service: $SERVICE_NAME"

if systemctl is-active --quiet "$SERVICE_NAME"; then
    systemctl restart "$SERVICE_NAME"
    sleep 5
    
    if systemctl is-active --quiet "$SERVICE_NAME"; then
        echo -e "${GREEN}[SUCCESS]${NC} Service $SERVICE_NAME restarted successfully"
    else
        echo -e "${RED}[ERROR]${NC} Service failed to restart"
        echo -e "${YELLOW}[INFO]${NC} Check logs: journalctl -u $SERVICE_NAME -n 20"
        echo -e "${YELLOW}[RESTORE]${NC} Consider restoring backup if needed: cp $BACKUP_FILE $TARGET_FILE"
        exit 1
    fi
else
    echo -e "${YELLOW}[WARNING]${NC} Service $SERVICE_NAME was not running"
    systemctl start "$SERVICE_NAME"
    sleep 5
fi

# Reload nginx if running
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}[RELOAD]${NC} Reloading nginx..."
    systemctl reload nginx
fi

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}ELBASAN COURT ADDED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo -e "${BLUE}Summary:${NC}"
echo "✓ Added: 'Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan'"
echo "✓ File updated: $TARGET_FILE"
echo "✓ Backup created: $BACKUP_FILE"
echo "✓ Application rebuilt"
echo "✓ Service $SERVICE_NAME restarted"
echo "✓ Nginx reloaded"
echo ""

echo -e "${BLUE}Test Your Changes:${NC}"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Click 'Regjistro Çështje' (Register Case)"
echo "3. Look for 'Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan' in the dropdown"
echo ""

echo -e "${BLUE}Service Status:${NC}"
systemctl status "$SERVICE_NAME" --no-pager -l

echo ""
echo -e "${BLUE}Rollback (if needed):${NC}"
echo "cp $BACKUP_FILE $TARGET_FILE && npm run build && systemctl restart $SERVICE_NAME"