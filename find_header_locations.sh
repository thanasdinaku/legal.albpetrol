#!/bin/bash

# Script to find all header text locations in the Albanian Legal Case Management System
# This will identify where "Data Management System" and related text appears

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}Header Text Location Discovery Script${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Find application directory
echo -e "${YELLOW}[SEARCH]${NC} Looking for application directory..."

POSSIBLE_DIRS=(
    "/opt/ceshtje-ligjore"
    "/opt/ceshtje_ligjore" 
    "/home/ceshtje-ligjore"
    "/var/www/ceshtje-ligjore"
    "/root/ceshtje-ligjore"
    "/var/www/html"
    "/usr/share/nginx/html"
)

APP_DIR=""
for dir in "${POSSIBLE_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        # Look for package.json or common web files
        if [ -f "$dir/package.json" ] || [ -f "$dir/index.html" ] || [ -d "$dir/client" ] || [ -d "$dir/src" ]; then
            APP_DIR="$dir"
            echo -e "${GREEN}[FOUND]${NC} Checking directory: $APP_DIR"
            break
        fi
    fi
done

# If still not found, do a broader search
if [ -z "$APP_DIR" ]; then
    echo -e "${YELLOW}[SEARCH]${NC} Searching entire system for application files..."
    
    # Look for any files containing "Data Management System"
    SEARCH_RESULTS=$(find / -type f \( -name "*.html" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" \) -exec grep -l "Data Management System\|Sistemi i Menaxhimit\|Pasqyra e Ceshtjeve" {} + 2>/dev/null | head -10)
    
    if [ -n "$SEARCH_RESULTS" ]; then
        echo -e "${GREEN}[FOUND]${NC} Files containing header text:"
        echo "$SEARCH_RESULTS"
        
        # Get the directory from the first result
        FIRST_FILE=$(echo "$SEARCH_RESULTS" | head -1)
        APP_DIR=$(dirname "$FIRST_FILE")
        
        # Try to find the root directory
        while [ "$APP_DIR" != "/" ] && [ ! -f "$APP_DIR/package.json" ]; do
            APP_DIR=$(dirname "$APP_DIR")
        done
    fi
fi

if [ -z "$APP_DIR" ] || [ ! -d "$APP_DIR" ]; then
    echo -e "${RED}[ERROR]${NC} Could not find application directory"
    echo -e "${YELLOW}[INFO]${NC} Please run this script from the application root directory"
    exit 1
fi

echo -e "${GREEN}[FOUND]${NC} Application directory: $APP_DIR"
cd "$APP_DIR"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SEARCHING FOR HEADER TEXT LOCATIONS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Search patterns
SEARCH_TERMS=(
    "Data Management System"
    "Sistemi i Menaxhimit"
    "Pasqyra e Ceshtjeve"
    "Legal Case Management"
    "Albanian Legal"
)

echo -e "${YELLOW}[SEARCH]${NC} Searching for header text in all files..."

for term in "${SEARCH_TERMS[@]}"; do
    echo ""
    echo -e "${BLUE}--- Searching for: \"$term\" ---${NC}"
    
    # Search in various file types
    find . -type f \( -name "*.html" -o -name "*.js" -o -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.json" \) -exec grep -Hn "$term" {} + 2>/dev/null | while read -r line; do
        echo -e "${GREEN}[MATCH]${NC} $line"
    done
done

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}FILE STRUCTURE ANALYSIS${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Show directory structure
echo -e "${YELLOW}[INFO]${NC} Current directory structure:"
find . -maxdepth 3 -type d | head -20

echo ""
echo -e "${YELLOW}[INFO]${NC} HTML files found:"
find . -name "*.html" -type f | head -10

echo ""
echo -e "${YELLOW}[INFO]${NC} React/JS component files:"
find . -name "*.tsx" -o -name "*.jsx" -o -name "*.ts" -o -name "*.js" | grep -E "(component|page|layout|header|sidebar)" | head -10

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}CONFIGURATION FILES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check for common config files
if [ -f "package.json" ]; then
    echo -e "${GREEN}[FOUND]${NC} package.json"
    grep -E "(name|description)" package.json || true
fi

if [ -f "index.html" ]; then
    echo -e "${GREEN}[FOUND]${NC} index.html"
    grep -E "<title>|<meta.*description" index.html || true
fi

# Check client directory
if [ -d "client" ]; then
    echo -e "${GREEN}[FOUND]${NC} client directory"
    if [ -f "client/index.html" ]; then
        echo -e "${GREEN}[FOUND]${NC} client/index.html"
        grep -E "<title>|<meta.*description" client/index.html || true
    fi
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}SERVICES AND PROCESSES${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Check running services
echo -e "${YELLOW}[INFO]${NC} Checking for running services..."
systemctl list-units --type=service --state=running | grep -E "(albpetrol|ceshtje|legal|node)" || echo "No matching services found"

# Check processes
echo -e "${YELLOW}[INFO]${NC} Checking for Node.js processes..."
ps aux | grep -E "(node|npm)" | grep -v grep || echo "No Node.js processes found"

echo ""
echo -e "${GREEN}================================================${NC}"
echo -e "${GREEN}DISCOVERY COMPLETED${NC}"
echo -e "${GREEN}================================================${NC}"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "1. Review the search results above"
echo "2. Identify which files contain the header text"
echo "3. Note the exact file paths for updating"
echo "4. Check if services need to be restarted after changes"
echo ""
echo -e "${BLUE}Application Directory:${NC} $APP_DIR"
echo ""