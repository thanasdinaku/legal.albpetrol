#!/bin/bash

echo "=== FIXING DATABASE CONNECTION ISSUE ==="

# 1. Remove the duplicate DATABASE_URL line
sed -i '/^DATABASE_URL=postgresql:\/\/albpetrol_user/d' /opt/ceshtje-ligjore/.env

# 2. Verify the existing database exists
sudo -u postgres psql -c "\l" | grep ceshtje_ligjore

# 3. Test the existing database connection
sudo -u postgres psql ceshtje_ligjore -c "SELECT current_database();"

# 4. Check if the user exists and has permissions
sudo -u postgres psql ceshtje_ligjore -c "\du"

# 5. Clean the .env file and ensure correct format
cd /opt/ceshtje-ligjore
cp .env .env.backup

cat > .env << 'EOF'
DATABASE_URL=postgresql://ceshtje_user:gjrWzGdZQMc0lU%2Fwu%2FhYEbFBTF5y1cZ6AYg%2FQslPkAk@localhost:5432/ceshtje_ligjore
PGHOST=localhost
PGPORT=5432
PGDATABASE=ceshtje_ligjore
PGUSER=ceshtje_user
PGPASSWORD=gjrWzGdZQMc0lU/wu/hYEbFBTF5y1cZ6AYg/QslPkAk
NODE_ENV=production
PORT=5000
SESSION_SECRET=4SyV5c+mPEHAnCmjdoqY1e16zetKh+Qew531LWLfhB3UbBFhUw+8nlEsUwSkg7Sh A6tTshQWDlbtK5S8X8bogw==
ADMIN_EMAIL=it.system@albpetrol.al
ADMIN_PASSWORD=Admin2025!
EOF

# 6. Restart PM2 with the corrected environment
pm2 restart albpetrol-legal

# 7. Check logs immediately
pm2 logs albpetrol-legal --lines 10

echo "=== Database connection should now work ==="