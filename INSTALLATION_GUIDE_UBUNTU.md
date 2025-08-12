# Udhëzuesi i Instalimit - Sistemi i Menaxhimit të Çështjeve Ligjore
## Ubuntu 24.04.3 LTS Installation Guide

Ky udhëzues përmban udhëzime të plota për instalimin e sistemit të menaxhimit të çështjeve ligjore në Ubuntu 24.04.3 LTS nga GitHub.

---

## 📋 Kërkesat e Sistemit

### Minimale:
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB free space
- **OS**: Ubuntu 24.04.3 LTS
- **Network**: Internet connection të gjithë kohën

### Të Rekomanduara:
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **Network**: Broadband connection

---

## 🔧 Hapi 1: Përditësimi i Sistemit

Filloni duke përditësuar sistemin:

```bash
# Përditëso listën e paketave
sudo apt update

# Përditëso të gjitha paketat e instaluara
sudo apt upgrade -y

# Pastro paketat e vjetra
sudo apt autoremove -y
```

---

## 🌐 Hapi 2: Instalimi i Node.js dhe npm

Instaloni Node.js versioni 20 (LTS):

```bash
# Instaloni curl nëse nuk është instaluar
sudo apt install -y curl

# Shtoni repository-n e Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Instaloni Node.js
sudo apt install -y nodejs

# Verifikoni instalimin
node --version  # Duhet të shfaqë v20.x.x
npm --version   # Duhet të shfaqë v10.x.x
```

---

## 🐘 Hapi 3: Instalimi i PostgreSQL

Instaloni dhe konfiguroni PostgreSQL:

```bash
# Instaloni PostgreSQL dhe mjetet shtesë
sudo apt install -y postgresql postgresql-contrib

# Nisni dhe aktivizoni shërbimin e PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verifikoni statusin
sudo systemctl status postgresql
```

### Konfigurimi i PostgreSQL:

```bash
# Kaloni në përdoruesin postgres
sudo -u postgres psql

# Në PostgreSQL prompt, krijoni një databazë dhe përdorues:
CREATE DATABASE albpetrol_legal;
CREATE USER albpetrol_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE albpetrol_legal TO albpetrol_user;
GRANT ALL ON SCHEMA public TO albpetrol_user;
\q

# Konfigurimet e rrjetit (opsionale për access të jashtëm)
sudo nano /etc/postgresql/16/main/postgresql.conf
# Gjeni dhe ndryshoni: listen_addresses = 'localhost'

sudo nano /etc/postgresql/16/main/pg_hba.conf
# Shtoni: local   all   albpetrol_user   md5

# Rivendosni PostgreSQL
sudo systemctl restart postgresql
```

---

## 🔄 Hapi 4: Instalimi i Git

```bash
# Instaloni Git
sudo apt install -y git

# Konfiguroni Git (opsionale)
git config --global user.name "Emri Juaj"
git config --global user.email "email@albpetrol.al"
```

---

## 📁 Hapi 5: Klonimi i Projektit nga GitHub

```bash
# Krijoni një direktori për projektin
mkdir -p /opt/albpetrol
cd /opt/albpetrol

# Klononi projektin (zëvendësoni URL-në me repository-n tuaj)
git clone https://github.com/YOUR_USERNAME/albpetrol-legal-system.git
cd albpetrol-legal-system

# Verifikoni strukturën e projektit
ls -la
```

---

## 📦 Hapi 6: Instalimi i Dependencies

```bash
# Instaloni paketat e Node.js
npm install

# Verifikoni që të gjitha paketat janë instaluar me sukses
npm list --depth=0
```

---

## 🔐 Hapi 7: Konfigurimi i Environment Variables

Krijoni file-in `.env` në root të projektit:

```bash
# Krijoni file-in .env
nano .env
```

Shtoni konfigurimin e mëposhtëm në `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://albpetrol_user:your_secure_password_here@localhost:5432/albpetrol_legal

# Application Configuration
NODE_ENV=production
PORT=5000
SESSION_SECRET=your_very_secure_session_secret_here_at_least_32_characters

# Email Configuration (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM=noreply@albpetrol.al

# Security
BCRYPT_ROUNDS=12
```

### Të dhënat e sigurisë:
- **SESSION_SECRET**: Duhet të jetë një string i gjatë dhe i sigurt (min. 32 karaktere)
- **SMTP credentials**: Për Gmail, përdorni App Password në vend të password-it normal
- **DATABASE_URL**: Zëvendësoni `your_secure_password_here` me password-in aktual

---

## 🗄️ Hapi 8: Inicializimi i Databazës

```bash
# Push schema në databazë
npm run db:push

# Verifikoni që tabelat janë krijuar
sudo -u postgres psql -d albpetrol_legal -c "\dt"
```

---

## 🔨 Hapi 9: Build i Aplikacionit

```bash
# Build aplikacionin për production
npm run build

# Verifikoni që build-i është krijuar me sukses
ls -la dist/
```

---

## 🚀 Hapi 10: Testimi i Aplikacionit

```bash
# Testoni aplikacionin në development mode
npm run dev

# Aplikacioni duhet të jetë i disponueshëm në: http://localhost:5000
# Shtypni Ctrl+C për të ndalur

# Testoni në production mode
npm run start
```

---

## 🔧 Hapi 11: Konfigurimi i Systemd Service

Krijoni një service për të menaxhuar aplikacionin:

```bash
# Krijoni file-in e service-it
sudo nano /etc/systemd/system/albpetrol-legal.service
```

Shtoni përmbajtjen e mëposhtme:

```ini
[Unit]
Description=Albpetrol Legal Management System
After=network.target postgresql.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/opt/albpetrol/albpetrol-legal-system
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/index.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=albpetrol-legal

[Install]
WantedBy=multi-user.target
```

### Aktivizo dhe nis service-in:

```bash
# Ngarko konfigurimin e ri
sudo systemctl daemon-reload

# Aktivizo service-in
sudo systemctl enable albpetrol-legal

# Nis service-in
sudo systemctl start albpetrol-legal

# Verifikoni statusin
sudo systemctl status albpetrol-legal

# Shikoni logs
sudo journalctl -u albpetrol-legal -f
```

---

## 🌐 Hapi 12: Konfigurimi i Nginx (Reverse Proxy)

### Instalimi i Nginx:

```bash
# Instaloni Nginx
sudo apt install -y nginx

# Nisni dhe aktivizoni Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Konfigurimi i Nginx:

```bash
# Krijoni konfigurimin për sitin
sudo nano /etc/nginx/sites-available/albpetrol-legal
```

Shtoni konfigurimin:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;  # Ndrysho me domain-in tuaj
    
    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Static files optimization
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        proxy_pass http://localhost:5000;
        expires 1M;
        add_header Cache-Control "public, immutable";
    }
}
```

### Aktivizo konfigurimin:

```bash
# Aktivizo sitin
sudo ln -s /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/

# Testoni konfigurimin
sudo nginx -t

# Rivendosni Nginx
sudo systemctl restart nginx
```

---

## 🔒 Hapi 13: SSL Certificate (Let's Encrypt)

```bash
# Instaloni Certbot
sudo apt install -y certbot python3-certbot-nginx

# Merrni SSL certificate (ndrysho domain-in)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Testoni rinovimin automatik
sudo certbot renew --dry-run
```

---

## 🔥 Hapi 14: Konfigurimi i Firewall-it

```bash
# Aktivizo UFW firewall
sudo ufw enable

# Lejo SSH (ndrysho portin nëse përdorni port tjetër)
sudo ufw allow 22/tcp

# Lejo HTTP dhe HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Lejo PostgreSQL vetëm lokalish (opsionale)
sudo ufw allow from 127.0.0.1 to any port 5432

# Verifikoni rregullat
sudo ufw status
```

---

## 📊 Hapi 15: Monitoring dhe Backup

### Logs Monitoring:

```bash
# Shiko logs të aplikacionit
sudo journalctl -u albpetrol-legal -f

# Shiko logs të Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Shiko logs të PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Backup Script:

```bash
# Krijoni script për backup
sudo nano /opt/backup/backup-albpetrol.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backup"
DB_NAME="albpetrol_legal"

# Krijoni backup të databazës
sudo -u postgres pg_dump $DB_NAME > "$BACKUP_DIR/db_backup_$DATE.sql"

# Backup të file-ave të aplikacionit
tar -czf "$BACKUP_DIR/app_backup_$DATE.tar.gz" -C /opt/albpetrol albpetrol-legal-system

# Fshi backup-et më të vjetër se 7 ditë
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Bëje executable
sudo chmod +x /opt/backup/backup-albpetrol.sh

# Shtoje në crontab për backup automatik (çdo ditë në 2:00 AM)
sudo crontab -e
# Shto: 0 2 * * * /opt/backup/backup-albpetrol.sh
```

---

## 🚦 Hapi 16: Verifikimi Final

### Testo aplikacionin:

1. **Hap në browser**: `http://your-domain.com` ose `https://your-domain.com`
2. **Login si administrator**: 
   - Email: `it.system@albpetrol.al`
   - Password: `admin123`
3. **Testo funksionalitetet kryesore**:
   - Krijimi i çështjeve të reja
   - Email notifications
   - Export në Excel/CSV
   - User management

### Komanda diagnostike:

```bash
# Status i të gjitha shërbimeve
sudo systemctl status albpetrol-legal nginx postgresql

# Test i portave
sudo netstat -tlnp | grep -E ':(80|443|5000|5432)'

# Test i databazës
sudo -u postgres psql -d albpetrol_legal -c "SELECT count(*) FROM users;"

# Memoria dhe CPU usage
free -h
top -n1 | head -n 20
```

---

## 🔧 Troubleshooting

### Probleme të zakonshme:

#### 1. Aplikacioni nuk niset:
```bash
# Verifikoni logs
sudo journalctl -u albpetrol-legal --no-pager -l

# Verifikoni environment variables
sudo -u www-data printenv | grep -E "(DATABASE|NODE|SMTP)"
```

#### 2. Database connection error:
```bash
# Testoni lidhjen me databazën
sudo -u postgres psql -d albpetrol_legal

# Verifikoni permissions
sudo -u postgres psql -c "\du albpetrol_user"
```

#### 3. Email nuk dërgohen:
```bash
# Testoni SMTP konfigurimin
telnet smtp.gmail.com 587

# Verifikoni logs për email errors
sudo journalctl -u albpetrol-legal | grep -i email
```

#### 4. Nginx errors:
```bash
# Testoni konfigurimin
sudo nginx -t

# Verifikoni error logs
sudo tail -f /var/log/nginx/error.log
```

---

## 📋 Maintenance Checklist

### Çdo javë:
- [ ] Backup i databazës dhe aplikacionit
- [ ] Update i paketave të sistemit: `sudo apt update && sudo apt upgrade`
- [ ] Verifikimi i logs për errors
- [ ] Testimi i funksionaliteteve kryesore

### Çdo muaj:
- [ ] Rinovimi i SSL certificates (automatic me Let's Encrypt)
- [ ] Verifikimi i disk space: `df -h`
- [ ] Update i Node.js dependencies: `npm audit`
- [ ] Pastrim i log files të vjetra

### Çdo 3 muaj:
- [ ] Full backup verification
- [ ] Performance tuning i PostgreSQL
- [ ] Security audit i sistemit
- [ ] Update i dokumentacionit

---

## 🛡️ Security Best Practices

1. **Ndryshoni passwords default**:
   - Database password
   - Admin user password në aplikacion
   - Session secret

2. **Konfiguroni SSL**:
   - Përdorni Let's Encrypt për certificate falas
   - Force HTTPS redirects

3. **Firewall Configuration**:
   - Mbyllni porte të panevojshme
   - Limitoni SSH access

4. **Regular Updates**:
   - Sistema dhe paketat
   - Node.js dependencies
   - Security patches

5. **Monitor Access**:
   - Review logs rregullisht
   - Setup email alerts për errors
   - Monitor disk usage

---

## 📞 Support

Për çështje teknike, kontaktoni:
- **IT Support**: it.system@albpetrol.al
- **Documentation**: Referojuni kësaj udhëzuesi dhe `replit.md`
- **Logs Location**: `/var/log/` dhe `sudo journalctl -u albpetrol-legal`

---

**Shënim**: Zëvendësoni të gjitha `your_domain.com`, `your_secure_password_here`, dhe konfigurime të tjera me vlerat aktuale para se të vazhdoni me instalimin.