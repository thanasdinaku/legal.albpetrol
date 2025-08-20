# Cloudflare 502 Bad Gateway - Emergency Fix Guide

## Problem Identified
- ✅ Local application: Working (http://10.5.20.31)
- ❌ Cloudflare tunnel: 502 Bad Gateway
- Issue: Tunnel connection broken between Cloudflare and your server

## Immediate Fix Steps

### 1. Run Emergency Diagnostic
```bash
cd /opt/ceshtje-ligjore

# Check local app
curl -I http://localhost:5000
curl -I http://10.5.20.31

# Check tunnel service
systemctl status cloudflared
journalctl -u cloudflared -n 20
```

### 2. Restart Tunnel Service
```bash
# Stop broken service
systemctl stop cloudflared
killall cloudflared

# Restart cleanly
systemctl start cloudflared
systemctl status cloudflared
```

### 3. Verify Configuration

Check `/etc/cloudflared/config.yml`:
```yaml
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
```

### 4. Check Critical Files
```bash
# Verify config exists
cat /etc/cloudflared/config.yml

# Check credentials (CRITICAL)
ls -la /etc/cloudflared/cert.json
```

## Most Likely Causes

1. **Service crashed** - Restart with `systemctl start cloudflared`
2. **Missing credentials** - Need to re-download cert.json from Cloudflare
3. **Wrong service URL** - Should be `http://localhost:5000`, not `https`
4. **Port binding conflict** - Check if port 5000 is accessible

## Expected Results After Fix

- `systemctl status cloudflared` = "active (running)"
- Logs show "Connection registered" or "Tunnel connected"
- https://legal.albpetrol.al loads Albanian interface
- No more 502 Bad Gateway error

## If Still Broken

Check these in Cloudflare dashboard:
1. Tunnel status (should show "Healthy")
2. DNS record for legal.albpetrol.al (should point to tunnel)
3. Tunnel configuration matches server config

## Alternative Access

While fixing Cloudflare:
- Direct access: http://10.5.20.31 (works perfectly)
- Use this for immediate system access

## Emergency Commands Summary

```bash
# Quick restart
systemctl restart cloudflared

# Check status
systemctl status cloudflared

# View live logs
journalctl -u cloudflared -f

# Test connection
curl -I https://legal.albpetrol.al
```

Your Albanian Legal Case Management System is working perfectly locally - this is purely a Cloudflare tunnel connectivity issue.