#!/bin/bash

# Fix storage.ts syntax error at line 421
# Repairs the broken ilike statement

set -e

echo "Fixing storage.ts syntax error..."

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
cd "$APP_DIR"

# Create backup
cp "server/storage.ts" "storage-backup-$(date +%s).ts"

echo "Checking line 421 in storage.ts..."
sed -n '415,425p' server/storage.ts

echo "Fixing the syntax error..."

# Fix the broken ilike statement - it appears to be missing a closing parenthesis
# Find the problematic line and fix it
sed -i '421s/ilike(users\.firstName, `%\${filters\.search}%`)/ilike(users.firstName, `%${filters.search}%`)/' server/storage.ts

# Ensure the line has proper closure
sed -i '421s/$//' server/storage.ts

# Check if there are any unclosed parentheses in the search conditions
# Look for the search filter section and ensure it's properly closed
sed -i '/ilike(users\.firstName.*filters\.search/a\
        )' server/storage.ts

# Remove any duplicate closing parentheses
sed -i '/ilike(users\.firstName.*filters\.search/,/^[[:space:]]*)[[:space:]]*$/ {
    /^[[:space:]]*)[[:space:]]*$/ {
        N
        /\n[[:space:]]*)[[:space:]]*$/ d
    }
}' server/storage.ts

echo "Checking the fix..."
sed -n '415,425p' server/storage.ts

echo "Testing build..."
npm run build

if [ $? -eq 0 ]; then
    echo "Build successful! Restarting service..."
    systemctl restart albpetrol-legal
    sleep 3
    
    if systemctl is-active --quiet albpetrol-legal; then
        echo "Service restarted successfully"
        systemctl reload nginx
        echo "Storage syntax error fixed!"
        echo "Application should now work at: https://legal.albpetrol.al"
    else
        echo "Service failed to start - checking logs..."
        journalctl -u albpetrol-legal -n 5 --no-pager
    fi
else
    echo "Build still failing - restoring backup"
    cp storage-backup-*.ts server/storage.ts
    echo "Check line 421 manually:"
    echo "sed -n '415,425p' server/storage.ts"
fi