#!/bin/bash

echo "🔍 Diagnose Cloudflare Service Failure"
echo "======================================"

cat << 'DIAGNOSE'

cd /opt/ceshtje-ligjore

echo "1. Check service failure details:"
systemctl status cloudflared.service --no-pager -l

echo ""
echo "2. Check detailed logs:"
journalctl -xeu cloudflared.service --no-pager -n 20

echo ""
echo "3. Verify config file syntax:"
echo "Current config:"
cat /etc/cloudflared/config.yml

echo ""
echo "4. Test config validation:"
/usr/bin/cloudflared tunnel --config /etc/cloudflared/config.yml validate 2>&1 || echo "Config validation failed"

echo ""
echo "5. Check credentials file:"
if [ -f /etc/cloudflared/cert.json ]; then
    echo "✅ Credentials file exists:"
    ls -la /etc/cloudflared/cert.json
    echo "File size: $(stat -c%s /etc/cloudflared/cert.json) bytes"
else
    echo "❌ CRITICAL: Missing credentials file /etc/cloudflared/cert.json"
fi

echo ""
echo "6. Check tunnel name and connectivity:"
if [ -f /etc/cloudflared/cert.json ]; then
    echo "Testing tunnel connectivity..."
    timeout 10 /usr/bin/cloudflared tunnel --config /etc/cloudflared/config.yml info 2>&1 || echo "Tunnel info failed"
fi

echo ""
echo "7. Manual tunnel test:"
echo "Attempting manual tunnel start for diagnostics..."
timeout 15 /usr/bin/cloudflared --config /etc/cloudflared/config.yml tunnel run 2>&1 | head -20

echo ""
echo "8. Common fixes based on typical failures:"

echo ""
echo "Fix A: Recreate working config with proper YAML syntax"
cat > /etc/cloudflared/config.yml << 'WORKING_CONFIG'
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://127.0.0.1:5000
  - service: http_status:404

no-autoupdate: true
WORKING_CONFIG

echo "✅ Updated config with proper format"

echo ""
echo "Fix B: Check systemd service file"
if [ -f /etc/systemd/system/cloudflared.service ]; then
    echo "Service file exists:"
    cat /etc/systemd/system/cloudflared.service
else
    echo "Creating systemd service file..."
    cat > /etc/systemd/system/cloudflared.service << 'SERVICE'
[Unit]
Description=cloudflared
After=network.target

[Service]
Type=simple
User=root
ExecStart=/usr/bin/cloudflared --no-autoupdate --config /etc/cloudflared/config.yml tunnel run
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
SERVICE
    systemctl daemon-reload
    echo "✅ Created systemd service file"
fi

echo ""
echo "Fix C: Try starting service again"
systemctl daemon-reload
systemctl start cloudflared

echo ""
echo "Final status check:"
sleep 5
systemctl status cloudflared.service --no-pager

DIAGNOSE

echo ""
echo "Run this to diagnose and fix the Cloudflare service failure"