# Deployment Instructions - Today's Improvements (2025-08-19)

## What's Being Deployed

Today's improvements include:

1. **Fixed Document Upload System**
   - Resolved URL construction errors in both case entry and edit forms
   - Documents now upload successfully without client-side errors
   - Server-side upload handling working properly

2. **Enhanced Case Edit Form**
   - Added missing court session fields:
     - "Zhvillimi i seances gjyqesorë data,ora (Shkallë I)" 
     - "Zhvillimi i seances gjyqesorë data,ora (Apel)"
   - Changed "Gjykata e Lartë" from dropdown to text input for flexibility

## Pre-Deployment Checklist

Before running the deployment:

1. **Verify Current System Status**
   ```bash
   ssh admuser@10.5.20.31 'sudo systemctl status albpetrol-legal'
   ```

2. **Check Available Disk Space**
   ```bash
   ssh admuser@10.5.20.31 'df -h /opt/ceshtje_ligjore'
   ```

3. **Ensure You Have SSH Access**
   ```bash
   ssh admuser@10.5.20.31 'echo "SSH connection working"'
   ```

## Deployment Process

### Automatic Deployment (Recommended)

Run the automated deployment script:

```bash
./deploy_todays_improvements.sh
```

This script will:
- Create automatic backups
- Transfer improved files
- Build and restart the application
- Verify deployment success

### Manual Deployment (If Needed)

If automated deployment fails, follow these manual steps:

1. **Connect to Production Server**
   ```bash
   ssh admuser@10.5.20.31
   cd /opt/ceshtje_ligjore/ceshtje_ligjore
   ```

2. **Stop the Service**
   ```bash
   sudo systemctl stop albpetrol-legal
   ```

3. **Create Backup**
   ```bash
   sudo cp -r . ../backup_manual_$(date +%Y%m%d_%H%M%S)
   ```

4. **Update Files** (copy the improved files manually)

5. **Build and Start**
   ```bash
   npm install --production
   npm run build
   sudo systemctl start albpetrol-legal
   ```

## Post-Deployment Verification

After deployment, verify the following:

1. **Service Status**
   ```bash
   sudo systemctl status albpetrol-legal
   ```

2. **Application Response**
   ```bash
   curl -I https://legal.albpetrol.al
   ```

3. **Check Logs**
   ```bash
   sudo journalctl -u albpetrol-legal -f --no-pager
   ```

4. **Test Document Upload**
   - Login to https://legal.albpetrol.al
   - Go to "Regjistro Çështje" 
   - Try uploading a PDF or Word document
   - Verify no errors appear in browser console

5. **Test Case Editing**
   - Go to "Menaxho Çështjet"
   - Edit an existing case
   - Verify both court session date/time fields are present:
     - Zhvillimi i seances gjyqesorë data,ora (Shkallë I)
     - Zhvillimi i seances gjyqesorë data,ora (Apel)
   - Verify "Gjykata e Lartë" is a text input (not dropdown)

## Rollback Instructions

If deployment fails or issues occur:

```bash
ssh admuser@10.5.20.31
cd /opt/ceshtje_ligjore
sudo systemctl stop albpetrol-legal
sudo rm -rf ceshtje_ligjore
sudo cp -r backup_YYYYMMDD_HHMMSS ceshtje_ligjore
cd ceshtje_ligjore
sudo systemctl start albpetrol-legal
```

## Important Notes

- **Administrator Credentials**: it.system@albpetrol.al / Admin2025!
- **Cloudflare Tunnel**: c51774f0-433f-40c0-a0b6-b7d3145fd95f.cfargotunnel.com
- **Object Storage**: repl-default-bucket-b60ba873-2f4d-4fbe-8dda-424df7154be9
- **Service Path**: /opt/ceshtje_ligjore/ceshtje_ligjore
- **Service Name**: albpetrol-legal

## Contact Information

If deployment issues occur:
- Check system logs: `sudo journalctl -u albpetrol-legal -f`
- Verify Cloudflare tunnel: `sudo systemctl status cloudflared`
- Monitor system resources: `htop`

## Success Indicators

Deployment is successful when:
- ✅ Service status shows "active (running)"
- ✅ Application loads at https://legal.albpetrol.al
- ✅ Document upload works without errors
- ✅ Case edit form has all required fields
- ✅ No critical errors in service logs