# Real Replit Application Deployment to Ubuntu

This package contains the **actual Replit application** that is currently running, not a recreation.

## What's Included

- `dist/` - Production build of the entire application (frontend + backend)
- `shared/schema.ts` - Database schema with all tables
- `package.json` - All dependencies 
- `ecosystem.config.cjs` - PM2 configuration
- Configuration files (drizzle, typescript, tailwind)

## Ubuntu Server Deployment Steps

### 1. Prerequisites (Run as root)
```bash
# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
apt-get install -y nodejs

# Install PostgreSQL
apt-get install -y postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Setup PostgreSQL
sudo -u postgres createuser --superuser albpetrol_user
sudo -u postgres createdb albpetrol_legal_db
sudo -u postgres psql -c "ALTER USER albpetrol_user PASSWORD 'your_secure_password';"
```

### 2. Copy Application Files
```bash
# Stop any existing PM2 processes
pm2 stop albpetrol-legal || true
pm2 delete albpetrol-legal || true

# Create application directory
mkdir -p /opt/ceshtje-ligjore
cd /opt/ceshtje-ligjore

# Copy all files from this deployment package
# (Copy dist/, shared/, package.json, ecosystem.config.cjs, etc.)
```

### 3. Install Dependencies & Setup Database
```bash
# Install production dependencies
npm install --production

# Set environment variables
cat > .env << EOF
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://albpetrol_user:your_secure_password@localhost:5432/albpetrol_legal_db
SESSION_SECRET=your_very_secure_session_secret_here
REPL_ID=your_repl_id
REPLIT_DOMAINS=legal.albpetrol.al,10.5.20.31
ISSUER_URL=https://replit.com/oidc

# Email configuration for 2FA
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=it.system@albpetrol.al
SMTP_PASS=your_email_password
EMAIL_FROM=it.system@albpetrol.al
EOF

# Push database schema (creates all tables)
npx drizzle-kit push
```

### 4. Start Application with PM2
```bash
# Create logs directory
mkdir -p logs

# Start with PM2
pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs albpetrol-legal
```

### 5. Configure Nginx (Optional)
```bash
cat > /etc/nginx/sites-available/albpetrol-legal << 'EOF'
server {
    listen 80;
    server_name legal.albpetrol.al 10.5.20.31;

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
    }
}
EOF

ln -s /etc/nginx/sites-available/albpetrol-legal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

## Email Update to it.system@albpetrol.al

The application is already configured to use `it.system@albpetrol.al` as the admin email. Make sure to:

1. Update the SMTP credentials in `.env` file
2. Verify the email account can send emails
3. Test 2FA functionality after deployment

## Features Included

- ✅ Complete React frontend with shadcn/ui components
- ✅ Express.js backend with all API routes
- ✅ PostgreSQL database with full schema
- ✅ Replit Auth integration with 2FA
- ✅ User management system with roles
- ✅ Data entry and management for legal cases
- ✅ Email notifications system
- ✅ Export functionality (Excel/CSV)
- ✅ Albanian language interface
- ✅ Security headers and protection

## Test the Deployment

1. Open `http://your-server-ip:5000` or `http://legal.albpetrol.al`
2. Login with admin credentials (check database for admin user)
3. Verify all features work as expected
4. Check PM2 logs for any issues: `pm2 logs albpetrol-legal`

This deployment package contains the exact same application running in your Replit environment.