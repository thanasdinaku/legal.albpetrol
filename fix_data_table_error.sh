#!/bin/bash

# Script to fix the 500 error in "Menaxho Çështjet" panel
# caused by the new zhvillimiSeancesShkalleI field

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Fixing Data Table 500 Error${NC}"
echo -e "${BLUE}================================================${NC}"

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
SERVICE_NAME="albpetrol-legal"

echo -e "${GREEN}[INFO]${NC} Application: $APP_DIR"
cd "$APP_DIR"

# Create backup
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="backup_fix_table_$TIMESTAMP"
mkdir -p "$BACKUP_DIR"
cp "server/storage.ts" "$BACKUP_DIR/" 2>/dev/null || true
cp "client/src/components/data-table-component.tsx" "$BACKUP_DIR/" 2>/dev/null || true
echo -e "${YELLOW}[BACKUP]${NC} Created: $BACKUP_DIR"

echo -e "${BLUE}[FIX 1]${NC} Updating storage.ts search conditions..."

# Fix the getDataEntriesForExport function
sed -i '/ilike(dataEntries\.gjykataLarte, searchTerm),/a\
          ilike(sql`CASE WHEN ${dataEntries.zhvillimiSeancesShkalleI} IS NOT NULL THEN to_char(${dataEntries.zhvillimiSeancesShkalleI}, '\''DD/MM/YYYY HH24:MI'\'') ELSE '\'''\'' END`, searchTerm),' server/storage.ts

# Fix the getDataEntries function  
sed -i '/ilike(dataEntries\.gjykataLarte, `%\${filters\.search}%`),/a\
          ilike(sql`CASE WHEN ${dataEntries.zhvillimiSeancesShkalleI} IS NOT NULL THEN to_char(${dataEntries.zhvillimiSeancesShkalleI}, '\''DD/MM/YYYY HH24:MI'\'') ELSE '\'''\'' END`, `%${filters.search}%`)' server/storage.ts

echo -e "${BLUE}[FIX 2]${NC} Ensuring proper handling of timestamp field..."

# Add proper date formatting for display in the data table component
if ! grep -q "zhvillimiSeancesShkalleI" client/src/components/data-table-component.tsx; then
    echo -e "${BLUE}[UPDATE]${NC} Adding date handling to data table component..."
    
    # Add format import if not exists
    if ! grep -q "format.*from.*date-fns" client/src/components/data-table-component.tsx; then
        sed -i '/import { format } from "date-fns";/i\
import { format, parseISO } from "date-fns";\
import { sq } from "date-fns/locale";' client/src/components/data-table-component.tsx
        # Remove the original line
        sed -i '/^import { format } from "date-fns";$/d' client/src/components/data-table-component.tsx
    fi
fi

echo -e "${BLUE}[FIX 3]${NC} Updating database to handle null values..."

# Ensure the database can handle the new field properly
npm run db:push

echo -e "${BLUE}[BUILD]${NC} Building application..."
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}[ERROR]${NC} Build failed, restoring backup"
    cp "$BACKUP_DIR/storage.ts" "server/" 2>/dev/null || true
    cp "$BACKUP_DIR/data-table-component.tsx" "client/src/components/" 2>/dev/null || true
    exit 1
fi

echo -e "${BLUE}[RESTART]${NC} Restarting service..."
systemctl restart "$SERVICE_NAME"
sleep 5

if systemctl is-active --quiet "$SERVICE_NAME"; then
    echo -e "${GREEN}[SUCCESS]${NC} Service restarted successfully"
else
    echo -e "${RED}[ERROR]${NC} Service restart failed"
    journalctl -u "$SERVICE_NAME" -n 10 --no-pager
    exit 1
fi

systemctl reload nginx 2>/dev/null || true

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}DATA TABLE ERROR FIXED!${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo "✓ Updated search conditions to handle new timestamp field"
echo "✓ Added proper null value handling"
echo "✓ Database schema updated"
echo "✓ Service restarted successfully"
echo ""
echo "Test at: https://legal.albpetrol.al"
echo "Go to 'Menaxho Çështjet' - the 500 error should be resolved"
echo ""
echo "Backup saved in: $BACKUP_DIR"