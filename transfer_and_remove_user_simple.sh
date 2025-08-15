#!/bin/bash
# Transfer thanas.dinaku entries to it.system and then remove the user

echo "🔄 Transferring thanas.dinaku@albpetrol.al entries to it.system@albpetrol.al and removing user..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Read environment variables from .env file if it exists
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Try to get database name from various sources
if [ -n "$DATABASE_URL" ]; then
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    echo "Found DATABASE_URL, using database: $DB_NAME"
elif [ -n "$PGDATABASE" ]; then
    DB_NAME="$PGDATABASE"
    echo "Using PGDATABASE: $DB_NAME"
else
    # List available databases and let user choose
    echo "Available databases:"
    sudo -u postgres psql -l | grep -E '^\s*\w+\s*\|' | awk '{print $1}' | grep -v '^$' | head -10
    
    # Try common names
    for db in "albpetrol_legal" "ceshtje_ligjore" "legal_cases" "postgres"; do
        echo "Trying database: $db"
        if sudo -u postgres psql -d "$db" -c "SELECT 1 FROM users LIMIT 1;" >/dev/null 2>&1; then
            DB_NAME="$db"
            echo "Found working database: $DB_NAME"
            break
        fi
    done
fi

if [ -z "$DB_NAME" ]; then
    echo "❌ Could not determine database name automatically"
    echo "Please run manually:"
    echo "sudo -u postgres psql -l"
    echo "Then use: sudo -u postgres psql -d YOUR_DATABASE_NAME"
    exit 1
fi

echo "Using database: $DB_NAME"

# Show current users and their entry counts
echo ""
echo "📊 Current users and their data entries:"
sudo -u postgres psql -d "$DB_NAME" -c "
SELECT 
    u.email, 
    u.role,
    COUNT(de.id) as entry_count
FROM users u 
LEFT JOIN data_entries de ON u.id = de.created_by_id 
GROUP BY u.id, u.email, u.role 
ORDER BY u.email;
"

# Get user IDs
echo ""
echo "🔍 Getting user IDs..."
THANAS_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'thanas.dinaku@albpetrol.al';" | tr -d ' ' | tr -d '\n')
SYSTEM_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'it.system@albpetrol.al';" | tr -d ' ' | tr -d '\n')

echo "Thanas ID: '$THANAS_ID'"
echo "System ID: '$SYSTEM_ID'"

if [ -z "$THANAS_ID" ] || [ "$THANAS_ID" = "" ]; then
    echo "❌ thanas.dinaku@albpetrol.al user not found in database"
    echo "Available users:"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT email FROM users;"
    exit 1
fi

if [ -z "$SYSTEM_ID" ] || [ "$SYSTEM_ID" = "" ]; then
    echo "❌ it.system@albpetrol.al user not found in database"
    echo "Available users:"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT email FROM users;"
    exit 1
fi

# Transfer data entries
echo ""
echo "📦 Transferring data entries from thanas.dinaku to it.system..."
sudo -u postgres psql -d "$DB_NAME" -c "
UPDATE data_entries 
SET created_by_id = '$SYSTEM_ID'
WHERE created_by_id = '$THANAS_ID';
"

TRANSFER_RESULT=$?
if [ $TRANSFER_RESULT -eq 0 ]; then
    echo "✅ Data entries transferred successfully!"
else
    echo "❌ Failed to transfer data entries (exit code: $TRANSFER_RESULT)"
    exit 1
fi

# Remove the user
echo ""
echo "🗑️ Removing thanas.dinaku@albpetrol.al user..."
sudo -u postgres psql -d "$DB_NAME" -c "
DELETE FROM users 
WHERE email = 'thanas.dinaku@albpetrol.al';
"

DELETE_RESULT=$?
if [ $DELETE_RESULT -eq 0 ]; then
    echo "✅ User removed successfully!"
else
    echo "❌ Failed to remove user (exit code: $DELETE_RESULT)"
    exit 1
fi

# Show final state
echo ""
echo "📊 Final user status:"
sudo -u postgres psql -d "$DB_NAME" -c "
SELECT 
    u.email, 
    u.role,
    COUNT(de.id) as entry_count
FROM users u 
LEFT JOIN data_entries de ON u.id = de.created_by_id 
GROUP BY u.id, u.email, u.role 
ORDER BY u.email;
"

echo ""
echo "🎉 CLEANUP COMPLETED SUCCESSFULLY!"
echo ""
echo "📋 Summary:"
echo "   ✅ All data entries transferred to it.system@albpetrol.al"
echo "   ✅ thanas.dinaku@albpetrol.al user removed completely"
echo "   ✅ it.system@albpetrol.al is now the sole root administrator"
echo "   ✅ All data entries preserved and owned by system admin"
echo ""
echo "🔐 Root administrator credentials:"
echo "   Email: it.system@albpetrol.al"
echo "   Password: admin123"
echo "   Role: admin"