#!/bin/bash

# ========================================
# Environment Comparison Script
# Replit vs Ubuntu Server
# ========================================

echo "📊 ENVIRONMENT COMPARISON: Replit vs Ubuntu Server"
echo "===================================================="
echo ""

# Configuration
UBUNTU_SERVER="10.5.20.29"
UBUNTU_USER="root"
UBUNTU_PATH="/opt/ceshtje-ligjore"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=== REPLIT ENVIRONMENT ===${NC}"
echo "-------------------------------------------"
echo "📍 Location: https://replit.com/@truealbos/CaseRecord"
echo "📦 Package.json version: $(node -p "require('./package.json').version")"
echo "🔧 Node version: $(node --version)"
echo "📚 NPM version: $(npm --version)"
echo ""

echo "📂 Project Structure:"
find . -maxdepth 1 -type d -not -path '*/.*' | wc -l | xargs echo "  - Directories:"
find . -name "*.ts" -o -name "*.tsx" | wc -l | xargs echo "  - TypeScript files:"
find . -name "*.json" | wc -l | xargs echo "  - Config files:"
echo ""

echo "🔀 Git Status:"
echo "  - Current branch: $(git branch --show-current)"
echo "  - Latest commit: $(git log -1 --oneline)"
echo "  - Uncommitted changes: $(git status --short | wc -l)"
echo ""

echo "📦 Key Dependencies:"
echo "  - React: $(node -p "require('./package.json').dependencies.react")"
echo "  - Express: $(node -p "require('./package.json').dependencies.express")"
echo "  - Drizzle ORM: $(node -p "require('./package.json').dependencies['drizzle-orm']")"
echo "  - TypeScript: $(node -p "require('./package.json').devDependencies.typescript")"
echo ""

echo -e "${BLUE}=== UBUNTU SERVER ENVIRONMENT ===${NC}"
echo "-------------------------------------------"
echo "📍 Location: $UBUNTU_SERVER ($UBUNTU_PATH)"
echo ""

echo "🔌 Connecting to Ubuntu server to check status..."
ssh ${UBUNTU_USER}@${UBUNTU_SERVER} << 'ENDSSH'
    cd /opt/ceshtje-ligjore 2>/dev/null || { echo "❌ Project directory not found!"; exit 1; }
    
    echo "📦 Package.json version: $(node -p "require('./package.json').version" 2>/dev/null || echo 'N/A')"
    echo "🔧 Node version: $(node --version 2>/dev/null || echo 'Not installed')"
    echo "📚 NPM version: $(npm --version 2>/dev/null || echo 'Not installed')"
    echo ""
    
    echo "📂 Project Structure:"
    find . -maxdepth 1 -type d -not -path '*/.*' 2>/dev/null | wc -l | xargs echo "  - Directories:"
    find . -name "*.ts" -o -name "*.tsx" 2>/dev/null | wc -l | xargs echo "  - TypeScript files:"
    echo ""
    
    echo "🔀 Git Status:"
    git branch --show-current 2>/dev/null | xargs -I {} echo "  - Current branch: {}"
    git log -1 --oneline 2>/dev/null | xargs -I {} echo "  - Latest commit: {}"
    git status --short 2>/dev/null | wc -l | xargs -I {} echo "  - Uncommitted changes: {}"
    echo ""
    
    echo "🚀 PM2 Status:"
    pm2 list 2>/dev/null | grep albpetrol-legal || echo "  - Not running or PM2 not installed"
    echo ""
    
    echo "🗄️ Database Status:"
    systemctl is-active postgresql 2>/dev/null | xargs -I {} echo "  - PostgreSQL: {}"
ENDSSH

echo ""
echo -e "${YELLOW}=== COMPARISON SUMMARY ===${NC}"
echo "-------------------------------------------"

echo ""
echo "🔍 To check if environments are in sync:"
echo "   1. Compare 'Latest commit' - should be identical"
echo "   2. Compare 'Uncommitted changes' - Ubuntu should be 0"
echo "   3. Check PM2 status - should show 'online'"
echo ""

echo -e "${GREEN}=== NEXT STEPS ===${NC}"
echo "-------------------------------------------"
echo "If environments are OUT OF SYNC:"
echo "   ✅ Run: ./sync-replit-to-ubuntu.sh"
echo ""
echo "If environments are IN SYNC:"
echo "   ✅ You're good to go!"
echo ""
echo "===================================================="
