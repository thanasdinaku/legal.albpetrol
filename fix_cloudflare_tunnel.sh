#!/bin/bash

echo "🌐 Cloudflare Tunnel Diagnostic & Fix"
echo "====================================="

cat << 'CLOUDFLARE_FIX'

echo "1. Check Cloudflare tunnel status:"
systemctl status cloudflared

echo ""
echo "2. Check tunnel configuration:"
cat /etc/cloudflared/config.yml 2>/dev/null || echo "Config file missing"

echo ""
echo "3. Check tunnel logs:"
journalctl -u cloudflared --no-pager -n 20

echo ""
echo "4. Test local application first:"
curl -I http://localhost:5000
curl -I http://10.5.20.31

echo ""
echo "5. Check tunnel process:"
ps aux | grep cloudflared

echo ""
echo "6. Fix common issues:"

echo "Stopping existing tunnel..."
systemctl stop cloudflared

echo "Recreating config with correct settings..."
mkdir -p /etc/cloudflared

cat > /etc/cloudflared/config.yml << 'CONFIG'
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
CONFIG

echo "Starting tunnel service..."
systemctl enable cloudflared
systemctl start cloudflared

echo ""
echo "7. Wait and check status:"
sleep 10
systemctl status cloudflared --no-pager -l

echo ""
echo "8. Test external connectivity:"
echo "Internal: http://localhost:5000"
echo "Local IP: http://10.5.20.31"
echo "External: https://legal.albpetrol.al"

echo ""
echo "If tunnel still fails, check:"
echo "- Cloudflare credentials in /etc/cloudflared/cert.json"
echo "- DNS settings point to tunnel"
echo "- Tunnel name matches Cloudflare dashboard"

CLOUDFLARE_FIX

echo ""
echo "Run this script on Ubuntu to fix Cloudflare tunnel"