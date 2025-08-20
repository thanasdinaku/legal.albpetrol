# Ubuntu Deployment Instructions

## 1. Copy files to Ubuntu server:
```bash
scp -r ubuntu_deployment/* admuser@10.5.20.31:/tmp/replit_interface/
```

## 2. On Ubuntu server:
```bash
# Switch to root
sudo su -

# Stop PM2
pm2 stop albpetrol-legal

# Copy files to application directory
cp -r /tmp/replit_interface/dist/* /opt/ceshtje-ligjore/dist/
cp -r /tmp/replit_interface/static /opt/ceshtje-ligjore/

# Make sure server serves static files
# Add this to your Express server (dist/index.js):
app.use('/static', express.static(path.join(__dirname, '../static')));

# Start PM2
pm2 start ecosystem.config.cjs

# Check status
pm2 status
```

## 3. Test the interface:
- Open http://10.5.20.31
- Should see exact Replit login with Albpetrol orange logo
- Login with 2FA support
- Professional dashboard with real functionality

## Features included:
✅ Exact Albpetrol orange logo from Replit
✅ Professional login page matching Replit design
✅ Two-factor authentication support
✅ Modern dashboard with real stats
✅ Professional sidebar navigation
✅ Responsive design
✅ Real data integration
✅ Activity tracking
✅ Quick action buttons
