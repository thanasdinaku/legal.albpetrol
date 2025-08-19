# Step-by-Step Deployment Commands

## Prerequisites
- SSH access to admuser@10.5.20.31
- Current project files in Replit
- Ubuntu server with albpetrol-legal service

## Step 1: Connect to Production Server
```bash
ssh admuser@10.5.20.31
```

## Step 2: Navigate to Application Directory
```bash
cd /opt/ceshtje_ligjore/ceshtje_ligjore
```

## Step 3: Create Backup
```bash
sudo cp -r . ../backup_$(date +%Y%m%d_%H%M%S)
```

## Step 4: Stop the Service
```bash
sudo systemctl stop albpetrol-legal
sudo systemctl status albpetrol-legal
```

## Step 5: Update Case Edit Form
```bash
sudo nano client/src/components/case-edit-form.tsx
```

**Copy and paste the complete improved case-edit-form.tsx content**
**Key additions:**
- Court session date/time fields for both levels
- Text input for "Gjykata e Lartë"

## Step 6: Update Document Uploader (if needed)
```bash
sudo nano client/src/components/DocumentUploader.tsx
```

**Verify URL construction fix in onSuccess handler**

## Step 7: Update Case Entry Form (verify consistency)
```bash
sudo nano client/src/components/case-entry-form.tsx
```

**Ensure all fields match the edit form**

## Step 8: Set Proper Permissions
```bash
sudo chown -R admuser:admuser .
sudo chmod -R 755 client/src/components/
sudo chmod -R 755 server/
```

## Step 9: Install Dependencies
```bash
npm install --production
```

## Step 10: Build Application
```bash
npm run build
```

## Step 11: Start Service
```bash
sudo systemctl start albpetrol-legal
```

## Step 12: Verify Deployment
```bash
# Check service status
sudo systemctl status albpetrol-legal

# Check if service is active
sudo systemctl is-active albpetrol-legal

# Monitor logs
sudo journalctl -u albpetrol-legal -f --no-pager

# Test API endpoint (optional)
curl -I http://localhost:5000/api/auth/user
```

## Step 13: Test Application
1. Open browser: https://legal.albpetrol.al
2. Login: it.system@albpetrol.al / Admin2025!
3. Test document upload in "Regjistro Çështje"
4. Test case editing in "Menaxho Çështjet"
5. Verify court session fields are present

## Rollback Commands (if needed)
```bash
sudo systemctl stop albpetrol-legal
sudo rm -rf /opt/ceshtje_ligjore/ceshtje_ligjore
sudo cp -r /opt/ceshtje_ligjore/backup_YYYYMMDD_HHMMSS /opt/ceshtje_ligjore/ceshtje_ligjore
cd /opt/ceshtje_ligjore/ceshtje_ligjore
sudo systemctl start albpetrol-legal
```

## Quick Status Check Commands
```bash
# Service status
sudo systemctl status albpetrol-legal --no-pager

# Recent logs
sudo journalctl -u albpetrol-legal --since "10 minutes ago" --no-pager

# Process check
ps aux | grep node

# Port check
netstat -tlnp | grep :5000
```