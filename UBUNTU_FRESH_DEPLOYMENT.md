# Complete Fresh Deployment Guide for Ubuntu Server

This guide will help you deploy the Albanian Legal Case Management System from scratch on your Ubuntu 24.04.3 LTS server.

## Prerequisites

- Ubuntu 24.04.3 LTS server
- Root or sudo access
- Internet connection
- Domain name (legal.albpetrol.al) pointing to your server

## Step 1: Download and Run Deployment Script

1. **Connect to your Ubuntu server:**
   ```bash
   ssh your-username@your-server-ip
   ```

2. **Download the deployment script:**
   ```bash
   wget https://raw.githubusercontent.com/thanasdinaku/ceshtje_ligjore/main/ubuntu_complete_deployment.sh
   ```

3. **Make it executable:**
   ```bash
   chmod +x ubuntu_complete_deployment.sh
   ```

4. **Run the deployment script:**
   ```bash
   ./ubuntu_complete_deployment.sh
   ```

## What the Script Does

The deployment script automatically:

1. **System Setup:**
   - Updates Ubuntu packages
   - Installs Node.js 20
   - Installs PostgreSQL
   - Installs Nginx
   - Installs PM2 process manager

2. **Application Setup:**
   - Clones the repository
   - Installs dependencies
   - Creates database and user
   - Builds the application
   - Runs database migrations

3. **Security & Configuration:**
   - Creates secure environment variables
   - Sets up firewall rules
   - Configures Nginx with security headers
   - Sets up rate limiting

4. **Backup & Monitoring:**
   - Creates automated backup script
   - Sets up daily backups
   - Configures PM2 for process monitoring

## Step 2: Cloudflare Tunnel Setup (Optional)

If you want external access via Cloudflare:

1. **Install Cloudflared:**
   ```bash
   wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
   sudo dpkg -i cloudflared-linux-amd64.deb
   ```

2. **Login to Cloudflare:**
   ```bash
   cloudflared tunnel login
   ```

3. **Create tunnel:**
   ```bash
   cloudflared tunnel create albpetrol-legal
   ```

4. **Configure tunnel:**
   ```bash
   sudo mkdir -p /etc/cloudflared
   sudo tee /etc/cloudflared/config.yml << EOF
   tunnel: albpetrol-legal
   credentials-file: /root/.cloudflared/tunnel-id.json
   
   ingress:
     - hostname: legal.albpetrol.al
       service: http://localhost:5000
     - service: http_status:404
   EOF
   ```

5. **Route DNS:**
   ```bash
   cloudflared tunnel route dns albpetrol-legal legal.albpetrol.al
   ```

6. **Install as service:**
   ```bash
   sudo cloudflared service install
   sudo systemctl start cloudflared
   sudo systemctl enable cloudflared
   ```

## Step 3: Verification

1. **Check application status:**
   ```bash
   pm2 status
   pm2 logs albpetrol-legal
   ```

2. **Check web server:**
   ```bash
   sudo systemctl status nginx
   curl http://localhost:5000
   ```

3. **Check database:**
   ```bash
   sudo -u postgres psql -d ceshtje_ligjore -c "SELECT * FROM users;"
   ```

## Login Credentials

After deployment, you can access the system with:

- **URL:** http://your-server-ip or https://legal.albpetrol.al
- **Email:** it.system@albpetrol.al
- **Password:** Admin2025!

## Important Files and Locations

- **Application:** `/opt/ceshtje-ligjore/`
- **Environment:** `/opt/ceshtje-ligjore/.env`
- **Nginx Config:** `/etc/nginx/sites-available/albpetrol-legal`
- **PM2 Config:** `/opt/ceshtje-ligjore/ecosystem.config.js`
- **Backup Script:** `/usr/local/bin/backup-albpetrol-legal.sh`

## Useful Commands

### Application Management
```bash
# Check status
pm2 status

# View logs
pm2 logs albpetrol-legal

# Restart application
pm2 restart albpetrol-legal

# Stop application
pm2 stop albpetrol-legal
```

### Web Server Management
```bash
# Check Nginx status
sudo systemctl status nginx

# Reload Nginx configuration
sudo systemctl reload nginx

# Test Nginx configuration
sudo nginx -t
```

### Database Management
```bash
# Connect to database
sudo -u postgres psql -d ceshtje_ligjore

# Create backup
sudo -u postgres pg_dump ceshtje_ligjore > backup.sql

# Restore from backup
sudo -u postgres psql -d ceshtje_ligjore < backup.sql
```

### Backup Management
```bash
# Manual backup
sudo /usr/local/bin/backup-albpetrol-legal.sh

# View backup files
ls -la /opt/backups/albpetrol-legal/
```

## Troubleshooting

### Application Won't Start
```bash
# Check PM2 logs
pm2 logs albpetrol-legal

# Check environment variables
cat /opt/ceshtje-ligjore/.env

# Restart application
pm2 restart albpetrol-legal
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;"
```

### Nginx Issues
```bash
# Check Nginx logs
sudo tail -f /var/log/nginx/error.log

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Security Recommendations

1. **Change default passwords immediately**
2. **Configure SSL certificate**
3. **Set up proper firewall rules**
4. **Enable fail2ban for additional security**
5. **Regular security updates**

## Support

If you encounter any issues:

1. Check the logs using the commands above
2. Verify all services are running
3. Check network connectivity
4. Ensure proper permissions on files

The deployment script creates a complete, production-ready environment with all necessary security measures and backup systems in place.