# Cloudflare Tunnel Setup Guide

## Problem Summary
- Tunnel name "legal-albpetrol" doesn't exist in your Cloudflare account
- Missing credentials file `/etc/cloudflared/cert.json`
- Local system works perfectly at http://10.5.20.31

## Solution Options

### Option 1: Get Existing Tunnel Credentials

If you already have a tunnel in Cloudflare dashboard:

1. **Go to Cloudflare Dashboard**
   - Visit: https://dash.cloudflare.com
   - Navigate: Zero Trust → Networks → Tunnels

2. **Find Your Tunnel**
   - Look for existing tunnel (may have different name)
   - Click on the tunnel name

3. **Download Credentials**
   - Go to "Configure" tab
   - Download the JSON credentials file
   - Save as `/etc/cloudflared/cert.json` on Ubuntu server

4. **Update Config**
   ```bash
   # Edit config with correct tunnel name
   nano /etc/cloudflared/config.yml
   
   # Replace "legal-albpetrol" with actual tunnel name
   # Example:
   tunnel: abc123def-456-ghi789  # Use real tunnel ID/name
   credentials-file: /etc/cloudflared/cert.json
   
   ingress:
     - hostname: legal.albpetrol.al
       service: http://127.0.0.1:5000
     - service: http_status:404
   ```

### Option 2: Create New Tunnel

If no tunnel exists:

1. **Login to Cloudflare**
   ```bash
   cloudflared tunnel login
   ```

2. **Create New Tunnel**
   ```bash
   cloudflared tunnel create legal-albpetrol
   ```

3. **Configure DNS**
   - In Cloudflare dashboard, add DNS record:
   - Type: CNAME
   - Name: legal
   - Target: [tunnel-id].cfargotunnel.com

4. **Start Tunnel**
   ```bash
   systemctl enable cloudflared
   systemctl start cloudflared
   ```

### Option 3: Temporary Disable (Current Status)

Your system is fully operational without external access:

```bash
# Disable tunnel service
systemctl stop cloudflared
systemctl disable cloudflared

# System remains accessible at:
# http://10.5.20.31
```

## Current System Status

✅ **Local Access**: http://10.5.20.31 - Fully operational  
❌ **External Access**: https://legal.albpetrol.al - Temporarily unavailable  
✅ **Application**: Albanian Legal Case Management System working  
✅ **Database**: PostgreSQL operational  
✅ **Authentication**: Working with admin user  

## Quick Commands

```bash
# Check tunnel status
systemctl status cloudflared

# List existing tunnels (if logged in)
cloudflared tunnel list

# Test local application
curl -I http://10.5.20.31

# View tunnel logs
journalctl -u cloudflared -n 20
```

## Next Steps

1. **For immediate use**: Access system at http://10.5.20.31
2. **For external access**: Choose Option 1 or 2 above
3. **Once configured**: External access at https://legal.albpetrol.al

Your Albanian Legal Case Management System is fully functional - external access just needs proper Cloudflare tunnel setup.