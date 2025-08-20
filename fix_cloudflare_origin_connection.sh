#!/bin/bash

echo "🔧 Fix Cloudflare Origin Connection"
echo "==================================="

cat << 'ORIGIN_FIX'

cd /opt/ceshtje-ligjore

echo "PROBLEM IDENTIFIED:"
echo "Cloudflare tunnel is connected but cannot reach local application"
echo "Error: 'Unable to reach the origin service'"
echo ""

echo "1. First reload systemd (warning shows config changed):"
systemctl daemon-reload

echo ""
echo "2. Check current config:"
cat /etc/cloudflared/config.yml

echo ""
echo "3. Verify local app is accessible:"
curl -I http://localhost:5000
ss -tlnp | grep 5000

echo ""
echo "4. Fix the origin connection issue:"
echo "The problem is likely the service URL in config..."

echo ""
echo "Stopping tunnel to reconfigure..."
systemctl stop cloudflared

echo ""
echo "Creating corrected config file..."
cat > /etc/cloudflared/config.yml << 'CONFIG'
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://127.0.0.1:5000
  - service: http_status:404

# Additional settings for better connectivity
no-autoupdate: true
CONFIG

echo ""
echo "Verifying config syntax:"
cat /etc/cloudflared/config.yml

echo ""
echo "Testing local connectivity before starting tunnel:"
timeout 5 curl -I http://127.0.0.1:5000 || echo "Local app not responding on 127.0.0.1:5000"
timeout 5 curl -I http://localhost:5000 || echo "Local app not responding on localhost:5000"

echo ""
echo "5. Restart tunnel with corrected config:"
systemctl daemon-reload
systemctl start cloudflared

echo ""
echo "6. Wait for tunnel to establish connections:"
sleep 15

echo ""
echo "7. Check tunnel status:"
systemctl status cloudflared --no-pager

echo ""
echo "8. Check for origin connection errors:"
journalctl -u cloudflared --no-pager -n 10 | grep -E "(ERR|origin|Unable to reach)"

echo ""
echo "9. Test external access:"
echo "Testing https://legal.albpetrol.al in 10 seconds..."
sleep 10

curl -s -o /dev/null -w "External access: %{http_code}\n" https://legal.albpetrol.al

echo ""
echo "10. Final verification:"
if systemctl is-active --quiet cloudflared; then
    echo "✅ Tunnel service: Running"
else
    echo "❌ Tunnel service: Failed"
fi

if journalctl -u cloudflared --no-pager -n 5 | grep -q "Unable to reach"; then
    echo "❌ Still getting origin connection errors"
    echo "NEXT STEPS:"
    echo "- Verify PM2 app is binding to 0.0.0.0:5000, not just 127.0.0.1"
    echo "- Check firewall rules for localhost connections"
    echo "- Verify /etc/hosts has correct localhost entry"
else
    echo "✅ No origin connection errors detected"
fi

ORIGIN_FIX

echo ""
echo "Run this script to fix the origin connection issue"