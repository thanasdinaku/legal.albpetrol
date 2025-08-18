#!/bin/bash

# Ubuntu Server Database Recovery Script
# This script will check and restore the database on your Ubuntu server

set -e

echo "=========================================="
echo "Ubuntu Server Database Recovery"
echo "=========================================="

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"

# Check if we're on Ubuntu server
if [ ! -d "$APP_DIR" ]; then
    echo "ERROR: This script must be run on the Ubuntu server (10.5.20.31)"
    echo "Current location: $(pwd)"
    echo "Expected directory not found: $APP_DIR"
    exit 1
fi

cd "$APP_DIR"

echo "Step 1: Checking current database status..."

# Check if PostgreSQL is running
if systemctl is-active --quiet postgresql; then
    echo "✅ PostgreSQL service is running"
else
    echo "❌ PostgreSQL service is not running"
    echo "Starting PostgreSQL..."
    systemctl start postgresql
    sleep 3
fi

# Check database connection
echo "Step 2: Testing database connection..."
if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database 'ceshtje_ligjore' exists and is accessible"
    
    # Check tables
    echo "Step 3: Checking database tables..."
    TABLES=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
    
    if [ -n "$TABLES" ]; then
        echo "✅ Tables found: $TABLES"
        
        # Check for data
        USER_COUNT=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | xargs || echo "0")
        DATA_COUNT=$(sudo -u postgres psql -d ceshtje_ligjore -t -c "SELECT COUNT(*) FROM data_entries;" 2>/dev/null | xargs || echo "0")
        
        echo "Current data:"
        echo "- Users: $USER_COUNT"
        echo "- Data entries: $DATA_COUNT"
        
        if [ "$USER_COUNT" -gt 0 ]; then
            echo "✅ Database has existing data - no restoration needed"
            echo "Step 4: Rebuilding application and restarting service..."
            
            # Rebuild and restart
            npm run build
            systemctl restart albpetrol-legal
            
            echo "✅ Database recovery completed - data was preserved"
            exit 0
        fi
    fi
fi

echo "❌ Database is empty or corrupted"
echo "Step 4: Looking for backup files..."

# Look for backup files
BACKUP_FILES=$(find /opt/ceshtje_ligjore/ -name "*backup*.sql" -o -name "*dump*.sql" 2>/dev/null | head -5)

if [ -n "$BACKUP_FILES" ]; then
    echo "Found backup files:"
    echo "$BACKUP_FILES"
    
    # Select most recent backup
    LATEST_BACKUP=$(ls -t /opt/ceshtje_ligjore/*backup*.sql /opt/ceshtje_ligjore/*dump*.sql 2>/dev/null | head -1)
    
    if [ -n "$LATEST_BACKUP" ]; then
        echo "Step 5: Restoring from backup: $LATEST_BACKUP"
        
        # Drop and recreate database
        sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || true
        sudo -u postgres createdb ceshtje_ligjore
        
        # Restore from backup
        sudo -u postgres psql -d ceshtje_ligjore < "$LATEST_BACKUP"
        
        echo "✅ Database restored from backup"
    fi
else
    echo "❌ No backup files found"
    echo "Step 5: Recreating database schema from scratch..."
    
    # Drop and recreate database
    sudo -u postgres dropdb ceshtje_ligjore 2>/dev/null || true
    sudo -u postgres createdb ceshtje_ligjore
    
    # Run migrations to recreate schema
    npm run db:push
    
    echo "✅ Database schema recreated"
    echo "⚠️  You will need to recreate user accounts and data"
fi

echo "Step 6: Testing final database connection..."
if sudo -u postgres psql -d ceshtje_ligjore -c "SELECT 1;" >/dev/null 2>&1; then
    echo "✅ Database connection successful"
    
    # Rebuild and restart application
    npm run build
    systemctl restart albpetrol-legal
    systemctl reload nginx
    
    echo "=========================================="
    echo "Database recovery completed!"
    echo "=========================================="
    echo "Next steps:"
    echo "1. Test the application at: https://legal.albpetrol.al"
    echo "2. Create admin user account if needed"
    echo "3. Re-enter any lost data"
    
else
    echo "❌ Database connection still failing"
    echo "Manual intervention required"
fi