# Cloudflare Tunnel Troubleshooting Guide

## Quick Diagnostic Commands

Run these on your Ubuntu server to diagnose Cloudflare issues:

```bash
# Check tunnel service status
systemctl status cloudflared

# Check recent logs
journalctl -u cloudflared --no-pager -n 30

# Verify local application works
curl -I http://localhost:5000
curl -I http://10.5.20.31

# Check tunnel process
ps aux | grep cloudflared
```

## Common Issues & Solutions

### 1. Service Not Running
```bash
systemctl enable cloudflared
systemctl start cloudflared
systemctl status cloudflared
```

### 2. Configuration Problems
Check config file: `/etc/cloudflared/config.yml`

Should contain:
```yaml
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
```

### 3. Missing Credentials
- Check if `/etc/cloudflared/cert.json` exists
- Verify credentials are valid
- Re-download from Cloudflare dashboard if needed

### 4. DNS Issues
- Ensure legal.albpetrol.al points to your tunnel
- Check Cloudflare DNS settings
- Verify CNAME record exists

### 5. Port/Service Issues
```bash
# Ensure local app is running
pm2 status
ss -tlnp | grep 5000

# Test local connectivity
curl http://localhost:5000
wget -O- http://10.5.20.31
```

## Step-by-Step Fix Process

1. **Verify Local Application**
   ```bash
   pm2 status
   curl -I http://localhost:5000
   ```

2. **Check Tunnel Service**
   ```bash
   systemctl status cloudflared
   journalctl -u cloudflared -n 20
   ```

3. **Restart Tunnel**
   ```bash
   systemctl stop cloudflared
   systemctl start cloudflared
   systemctl status cloudflared
   ```

4. **Test External Access**
   - Try: https://legal.albpetrol.al
   - Check response time and status

## Configuration Files

### /etc/cloudflared/config.yml
```yaml
tunnel: legal-albpetrol
credentials-file: /etc/cloudflared/cert.json

ingress:
  - hostname: legal.albpetrol.al
    service: http://localhost:5000
  - service: http_status:404
```

### Service Status Commands
```bash
# Status check
systemctl status cloudflared

# Enable auto-start
systemctl enable cloudflared

# Manual start/stop
systemctl start cloudflared
systemctl stop cloudflared

# View logs
journalctl -u cloudflared -f
```

## Expected Behavior

When working correctly:
- systemctl status shows "active (running)"
- Logs show "Connection established" 
- https://legal.albpetrol.al loads your Albanian interface
- No "tunnel disconnected" errors

## Contact Information

If issues persist:
1. Check Cloudflare dashboard for tunnel status
2. Verify DNS propagation
3. Test local application first (http://10.5.20.31)
4. Review tunnel logs for specific errors