#!/bin/bash

# Verification script to check if header changes were applied correctly
# For Albanian Legal Case Management System

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Header Changes Verification Script${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

APP_DIR="/opt/ceshtje-ligjore"
cd $APP_DIR

echo -e "${GREEN}[CHECK]${NC} Verifying HTML title change..."
if grep -q "Sistemi i Menaxhimit të Rasteve Ligjore" client/index.html; then
    echo -e "${GREEN}✓${NC} HTML title updated correctly"
else
    echo -e "${RED}✗${NC} HTML title not updated"
fi

echo -e "${GREEN}[CHECK]${NC} Verifying sidebar header..."
if grep -q "Sistemi i Menaxhimit të Rasteve Ligjore" client/src/components/sidebar.tsx; then
    echo -e "${GREEN}✓${NC} Sidebar header updated correctly"
else
    echo -e "${RED}✗${NC} Sidebar header not updated"
fi

echo -e "${GREEN}[CHECK]${NC} Verifying landing page title..."
if grep -q "Sistemi i Menaxhimit të Rasteve Ligjore" client/src/pages/landing.tsx; then
    echo -e "${GREEN}✓${NC} Landing page title updated correctly"
else
    echo -e "${RED}✗${NC} Landing page title not updated"
fi

echo -e "${GREEN}[CHECK]${NC} Verifying service status..."
if systemctl is-active --quiet albpetrol-legal; then
    echo -e "${GREEN}✓${NC} Application service is running"
else
    echo -e "${RED}✗${NC} Application service is not running"
fi

echo -e "${GREEN}[CHECK]${NC} Testing application response..."
if curl -s http://localhost:5000/ | grep -q "Sistemi i Menaxhimit të Rasteve Ligjore"; then
    echo -e "${GREEN}✓${NC} Application serving updated content"
else
    echo -e "${YELLOW}!${NC} Application may not be serving updated content yet"
fi

echo ""
echo -e "${BLUE}Current Content Preview:${NC}"
echo -e "${YELLOW}HTML Title:${NC}"
grep "<title>" client/index.html

echo -e "${YELLOW}Sidebar Header:${NC}"
grep -A 1 -B 1 "font-bold text-gray-900" client/src/components/sidebar.tsx

echo ""
echo -e "${GREEN}Verification completed!${NC}"