#!/bin/bash

# Script to update court names from "Rrethit Gjyqësor" to "Juridiksionit të Përgjithshëm"
# For Albanian Legal Case Management System on Ubuntu Server

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Updating Court Names in Dropdown Menu${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Application directory and service details
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
BACKUP_FILE="$TARGET_FILE.backup_court_update_$TIMESTAMP"
cp "$TARGET_FILE" "$BACKUP_FILE"
echo -e "${YELLOW}[BACKUP]${NC} Created backup: $BACKUP_FILE"

# Show current court options before changes
echo ""
echo -e "${BLUE}[CURRENT]${NC} Current court options:"
grep -A 15 "SelectContent" "$TARGET_FILE" | grep "SelectItem.*Gjykata e Shkallës së Parë" | sed 's/.*value="\([^"]*\)".*/  - \1/' || true

echo ""
echo -e "${BLUE}[UPDATE]${NC} Updating court names..."

# Update court names from "Rrethit Gjyqësor" to "Juridiksionit të Përgjithshëm"
# Berat
sed -i 's|Gjykata e Shkallës së Parë e Rrethit Gjyqësor Berat|Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat|g' "$TARGET_FILE"

# Vlorë to Vlore (also removing accent)
sed -i 's|Gjykata e Shkallës së Parë e Rrethit Gjyqësor Vlorë|Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlore|g' "$TARGET_FILE"

# Elbasan
sed -i 's|Gjykata e Shkallës së Parë e Rrethit Gjyqësor Elbasan|Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan|g' "$TARGET_FILE"

# Fier
sed -i 's|Gjykata e Shkallës së Parë e Rrethit Gjyqësor Fier|Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier|g' "$TARGET_FILE"

# Verify all changes were made
EXPECTED_COURTS=(
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Berat"
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Vlore"
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Elbasan"
    "Gjykata e Shkallës së Parë e Juridiksionit të Përgjithshëm Fier"
)

echo ""
echo -e "${BLUE}[VERIFY]${NC} Verifying changes..."

ALL_UPDATED=true
for court in "${EXPECTED_COURTS[@]}"; do
    if grep -q "$court" "$TARGET_FILE"; then
        echo -e "${GREEN}[✓]${NC} $court"
    else
        echo -e "${RED}[✗]${NC} Missing: $court"
        ALL_UPDATED=false
    fi
done

# Check if any old "Rrethit Gjyqësor" entries remain
OLD_ENTRIES=$(grep -c "Rrethit Gjyqësor" "$TARGET_FILE" 2>/dev/null || echo "0")
if [ "$OLD_ENTRIES" -gt 0 ]; then
    echo -e "${YELLOW}[WARNING]${NC} Found $OLD_ENTRIES remaining 'Rrethit Gjyqësor' entries"
    grep "Rrethit Gjyqësor" "$TARGET_FILE" || true
fi

if [ "$ALL_UPDATED" = false ]; then
    echo -e "${RED}[ERROR]${NC} Some court names were not updated correctly"
    echo -e "${YELLOW}[RESTORE]${NC} Restoring backup..."
    cp "$BACKUP_FILE" "$TARGET_FILE"
    exit 1
fi

# Show updated court options
echo ""
echo -e "${BLUE}[UPDATED]${NC} Updated court options:"
grep -A 15 "SelectContent" "$TARGET_FILE" | grep "SelectItem.*Gjykata e Shkallës së Parë" | sed 's/.*value="\([^"]*\)".*/  - \1/' || true

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
        echo -e "${YELLOW}[RESTORE]${NC} Consider restoring backup: cp $BACKUP_FILE $TARGET_FILE"
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
echo -e "${GREEN}COURT NAMES UPDATED SUCCESSFULLY!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""

echo -e "${BLUE}Summary of Changes:${NC}"
echo "✓ Berat: 'Rrethit Gjyqësor' → 'Juridiksionit të Përgjithshëm'"
echo "✓ Vlore: 'Rrethit Gjyqësor Vlorë' → 'Juridiksionit të Përgjithshëm Vlore'"
echo "✓ Elbasan: 'Rrethit Gjyqësor' → 'Juridiksionit të Përgjithshëm'"
echo "✓ Fier: 'Rrethit Gjyqësor' → 'Juridiksionit të Përgjithshëm'"
echo ""
echo "✓ File updated: $TARGET_FILE"
echo "✓ Backup created: $BACKUP_FILE"
echo "✓ Application rebuilt"
echo "✓ Service $SERVICE_NAME restarted"
echo "✓ Nginx reloaded"
echo ""

echo -e "${BLUE}Test Your Changes:${NC}"
echo "1. Visit: https://legal.albpetrol.al"
echo "2. Click 'Regjistro Çështje' (Register Case)"
echo "3. Check the 'Gjykata e Shkallës së Parë' dropdown"
echo "4. Verify all courts now show 'Juridiksionit të Përgjithshëm'"
echo ""

echo -e "${BLUE}Service Status:${NC}"
systemctl status "$SERVICE_NAME" --no-pager -l | head -10

echo ""
echo -e "${BLUE}Rollback (if needed):${NC}"
echo "cp $BACKUP_FILE $TARGET_FILE && npm run build && systemctl restart $SERVICE_NAME"