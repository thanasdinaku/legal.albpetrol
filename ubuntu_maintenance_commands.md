# Ubuntu Server Maintenance Commands

## Daily Operations

### Check Application Status
```bash
pm2 status
curl -I http://localhost:5000
```

### View Logs
```bash
pm2 logs albpetrol-legal
pm2 logs albpetrol-legal --lines 50
```

### Restart Application
```bash
pm2 restart albpetrol-legal
```

## Updates from GitHub

### Quick Update
```bash
cd /opt/ceshtje-ligjore
git pull origin main
npm install
pm2 restart albpetrol-legal
```

### Full Update with Build
```bash
cd /opt/ceshtje-ligjore
git pull origin main
npm install
npm run build
pm2 restart albpetrol-legal
```

## Database Management

### Check Database Connection
```bash
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT current_database();"
```

### View Admin Users
```bash
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "SELECT email, role FROM users WHERE role = 'admin';"
```

### Backup Database
```bash
PGPASSWORD=SecurePass2025 pg_dump -h localhost -U albpetrol_user albpetrol_legal_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

## Security

### Update Admin Email
```bash
PGPASSWORD=SecurePass2025 psql -h localhost -U albpetrol_user -d albpetrol_legal_db -c "UPDATE users SET email = 'it.system@albpetrol.al' WHERE role = 'admin';"
```

### Check Security Logs
```bash
sudo tail -f /var/log/auth.log
sudo tail -f /var/log/syslog
```

## System Monitoring

### Check System Resources
```bash
top
htop
df -h
free -h
```

### Check Network
```bash
netstat -tlnp | grep 5000
ss -tlnp | grep 5000
```

## PM2 Management

### Save PM2 Configuration
```bash
pm2 save
```

### PM2 Startup Configuration
```bash
pm2 startup
```

### Delete and Recreate Application
```bash
pm2 delete albpetrol-legal
pm2 start ecosystem.config.cjs
pm2 save
```

## Git Operations

### Check Git Status
```bash
git status
git log --oneline -10
```

### Commit Changes (if any)
```bash
git add .
git commit -m "update: description of changes"
git push origin main
```

### Reset to Latest GitHub Version
```bash
git fetch origin
git reset --hard origin/main
```

## Troubleshooting

### Application Not Responding
```bash
pm2 restart albpetrol-legal
pm2 logs albpetrol-legal --lines 20
```

### Database Connection Issues
```bash
sudo systemctl status postgresql
sudo systemctl restart postgresql
```

### Build Issues
```bash
npm install
npm run build
pm2 restart albpetrol-legal
```

### Disk Space Issues
```bash
sudo apt autoremove
sudo apt autoclean
pm2 flush
```