#!/bin/bash

# Fix Cloudflare API Blocking Issue
# This script helps resolve the login issue where Cloudflare is blocking API requests

echo "=== Cloudflare API Blocking Fix for legal.albpetrol.al ==="
echo ""

echo "PROBLEM IDENTIFIED:"
echo "- Cloudflare WAF is showing challenge pages for /api/auth/* endpoints"
echo "- Frontend expects JSON but gets HTML challenge pages"
echo "- This causes 'Unexpected token I <!DOCTYPE' JSON parsing errors"
echo ""

echo "SOLUTION OPTIONS:"
echo ""

echo "1. CLOUDFLARE DASHBOARD CONFIGURATION (RECOMMENDED):"
echo "   a) Log into Cloudflare Dashboard"
echo "   b) Go to legal.albpetrol.al domain settings"
echo "   c) Navigate to Security > WAF"
echo "   d) Add a Custom Rule to bypass challenges for API paths:"
echo "      - Rule name: 'API Endpoints Bypass'"
echo "      - Expression: (http.request.uri.path contains \"/api/\")"
echo "      - Action: Skip > All remaining custom rules, Bot Fight Mode, Managed Ruleset, Rate Limiting rules"
echo "   e) Save and deploy the rule"
echo ""

echo "2. CLOUDFLARE PAGE RULES (ALTERNATIVE):"
echo "   a) Go to Cloudflare Dashboard > Rules > Page Rules"
echo "   b) Create a new page rule:"
echo "      - URL pattern: legal.albpetrol.al/api/*"
echo "      - Settings:"
echo "        * Security Level: Essentially Off"
echo "        * Browser Integrity Check: Off"
echo "        * Cache Level: Bypass"
echo "   c) Save and activate the rule"
echo ""

echo "3. IMMEDIATE WORKAROUND (TEMPORARY):"
echo "   - Test API endpoints directly with proper browser headers"
echo "   - Use Chrome DevTools Network tab to copy requests as cURL"
echo "   - Verify the backend server is responding on internal network"
echo ""

echo "4. VERIFY SERVER IS RUNNING:"
echo "   Checking internal server status..."

# Test internal server connectivity
if curl -s --connect-timeout 5 http://10.5.20.31:5000/api/auth/user > /dev/null 2>&1; then
    echo "   ✅ Internal server (10.5.20.31:5000) is responding"
else
    echo "   ❌ Internal server (10.5.20.31:5000) is not responding"
    echo "   Need to restart the application service:"
    echo "   sudo systemctl restart albpetrol-legal"
fi

echo ""
echo "5. TEST THE FIX:"
echo "   After implementing solution 1 or 2, test with:"
echo "   curl -X POST https://legal.albpetrol.al/api/auth/login \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"email\":\"it.system@albpetrol.al\",\"password\":\"[password]\"}'"
echo ""

echo "6. PRODUCTION SERVER COMMANDS (if needed):"
echo "   # Check application status"
echo "   sudo systemctl status albpetrol-legal"
echo ""
echo "   # Restart application"
echo "   sudo systemctl restart albpetrol-legal"
echo ""
echo "   # Check application logs"
echo "   sudo journalctl -u albpetrol-legal -n 50 --no-pager"
echo ""
echo "   # Check nginx status"
echo "   sudo systemctl status nginx"
echo ""

echo "=== PRIORITY ACTION NEEDED ==="
echo "The main issue is Cloudflare configuration, not the application code."
echo "Please implement solution 1 (WAF Custom Rule) in Cloudflare Dashboard."
echo "This will allow API endpoints to bypass the bot protection challenges."
echo ""