#!/bin/bash

echo "🔧 Fix Cloudflare Tunnel Name and Credentials"
echo "============================================="

cat << 'TUNNEL_FIX'

cd /opt/ceshtje-ligjore

echo "PROBLEM IDENTIFIED:"
echo "1. Tunnel name 'legal-albpetrol' doesn't exist in Cloudflare"
echo "2. Missing credentials file /etc/cloudflared/cert.json"
echo ""

echo "SOLUTION: Find correct tunnel name and get credentials"
echo ""

echo "1. Stop the failing service first:"
systemctl stop cloudflared

echo ""
echo "2. List existing tunnels (if credentials exist):"
echo "First we need to check if you have any cloudflared login token..."

if [ -f ~/.cloudflared/cert.pem ]; then
    echo "Found user credentials, listing tunnels:"
    /usr/bin/cloudflared tunnel list
else
    echo "❌ No user credentials found"
    echo ""
    echo "MANUAL STEPS NEEDED:"
    echo "==================="
    echo ""
    echo "You need to either:"
    echo ""
    echo "Option A: Get tunnel credentials from Cloudflare dashboard"
    echo "  1. Go to https://dash.cloudflare.com"
    echo "  2. Go to Zero Trust > Networks > Tunnels"
    echo "  3. Find your tunnel (might have different name)"
    echo "  4. Click on it and go to 'Configure'"
    echo "  5. Download the JSON credentials file"
    echo "  6. Copy it to /etc/cloudflared/cert.json"
    echo ""
    echo "Option B: Create a new tunnel"
    echo "  1. Run: cloudflared tunnel login"
    echo "  2. Follow browser authentication"
    echo "  3. Create tunnel: cloudflared tunnel create legal-albpetrol"
    echo "  4. Configure DNS in Cloudflare dashboard"
    echo ""
    echo "Option C: Use working tunnel with correct name"
    echo "  If tunnel exists with different name, update config:"
fi

echo ""
echo "3. Check for existing tunnel configurations:"
ls -la /etc/cloudflared/
ls -la ~/.cloudflared/ 2>/dev/null || echo "No user cloudflared directory"

echo ""
echo "4. TEMPORARY WORKAROUND - Disable Cloudflare tunnel:"
echo "Since your local application works perfectly at http://10.5.20.31"
echo "You can temporarily disable the tunnel service:"
echo ""
systemctl stop cloudflared
systemctl disable cloudflared

echo "✅ Cloudflare tunnel disabled"
echo ""
echo "Your system is still fully accessible at:"
echo "http://10.5.20.31 - Albanian Legal Case Management System"
echo ""
echo "To re-enable external access, you need to:"
echo "1. Get correct tunnel name/credentials from Cloudflare dashboard"
echo "2. Update /etc/cloudflared/config.yml with correct tunnel name"
echo "3. Place credentials JSON in /etc/cloudflared/cert.json"
echo "4. Restart: systemctl enable cloudflared && systemctl start cloudflared"

echo ""
echo "5. Test local access works:"
curl -s -o /dev/null -w "Local access: %{http_code}\n" http://10.5.20.31

echo ""
echo "STATUS: Your Albanian Legal Case Management System is fully operational"
echo "Access: http://10.5.20.31 (internal network)"
echo "External access: Temporarily unavailable (Cloudflare tunnel needs reconfiguration)"

TUNNEL_FIX

echo ""
echo "Run this script to fix tunnel credentials or disable temporarily"