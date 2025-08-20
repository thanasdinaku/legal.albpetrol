#!/bin/bash

echo "🚨 Emergency Cloudflare 502 Fix"
echo "==============================="

cat << 'EMERGENCY_FIX'

cd /opt/ceshtje-ligjore

echo "1. IMMEDIATE DIAGNOSIS:"
echo "Local app status:"
curl -s -o /dev/null -w "Local (5000): %{http_code}\n" http://localhost:5000
curl -s -o /dev/null -w "IP Access: %{http_code}\n" http://10.5.20.31

echo ""
echo "2. CLOUDFLARE TUNNEL STATUS:"
systemctl status cloudflared --no-pager
echo ""

echo "3. TUNNEL LOGS (last 10 lines):"
journalctl -u cloudflared --no-pager -n 10
echo ""

echo "4. TUNNEL PROCESS CHECK:"
ps aux | grep cloudflared | grep -v grep
echo ""

echo "5. IMMEDIATE FIX ATTEMPT:"

echo "Stopping broken tunnel..."
systemctl stop cloudflared
killall cloudflared 2>/dev/null

echo "Checking tunnel configuration..."
if [ ! -f /etc/cloudflared/config.yml ]; then
    echo "❌ Missing config.yml - Creating basic config..."
    mkdir -p /etc/cloudflared
    cat > /etc/cloudflared/config.yml << CONFIG
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
CONFIG
else
    echo "✅ Config exists:"
    cat /etc/cloudflared/config.yml
fi

echo ""
echo "Checking credentials file..."
if [ ! -f /etc/cloudflared/cert.json ]; then
    echo "❌ CRITICAL: Missing /etc/cloudflared/cert.json"
    echo "You need to download this from Cloudflare dashboard"
else
    echo "✅ Credentials file exists"
    ls -la /etc/cloudflared/cert.json
fi

echo ""
echo "6. RESTART TUNNEL SERVICE:"
systemctl enable cloudflared
systemctl start cloudflared

echo ""
echo "Wait 10 seconds for connection..."
sleep 10

echo ""
echo "7. VERIFY TUNNEL STATUS:"
systemctl status cloudflared --no-pager
echo ""
journalctl -u cloudflared --no-pager -n 5

echo ""
echo "8. CONNECTION TEST:"
echo "Testing in 15 seconds..."
sleep 15

curl -s -o /dev/null -w "Cloudflare: %{http_code}\n" https://legal.albpetrol.al || echo "Cloudflare: Failed"

echo ""
echo "9. FINAL STATUS:"
if systemctl is-active --quiet cloudflared; then
    echo "✅ Tunnel service: Running"
else
    echo "❌ Tunnel service: Failed"
fi

if curl -s -o /dev/null -w "%{http_code}" https://legal.albpetrol.al | grep -q "200"; then
    echo "✅ External access: Working"
else
    echo "❌ External access: Still broken"
    echo ""
    echo "NEXT STEPS:"
    echo "1. Check Cloudflare dashboard for tunnel status"
    echo "2. Verify cert.json file exists and is valid"
    echo "3. Check DNS settings for legal.albpetrol.al"
    echo "4. Verify tunnel name matches Cloudflare config"
fi

EMERGENCY_FIX

echo ""
echo "Run this script on Ubuntu to fix the 502 error immediately"