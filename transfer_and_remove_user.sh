#!/bin/bash
# Transfer thanas.dinaku entries to it.system and then remove the user

echo "🔄 Transferring thanas.dinaku@albpetrol.al entries to it.system@albpetrol.al and removing user..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Get the actual database name from DATABASE_URL
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

if [ -z "$DB_NAME" ]; then
    echo "❌ Could not determine database name from DATABASE_URL"
    echo "DATABASE_URL: $DATABASE_URL"
    exit 1
fi

echo "Using database: $DB_NAME"

# First, show current users and their entry counts
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

# Get the IDs we need
echo ""
echo "🔍 Getting user IDs..."
THANAS_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'thanas.dinaku@albpetrol.al';" | tr -d ' ')
SYSTEM_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'it.system@albpetrol.al';" | tr -d ' ')

if [ -z "$THANAS_ID" ]; then
    echo "❌ thanas.dinaku@albpetrol.al user not found"
    exit 1
fi

if [ -z "$SYSTEM_ID" ]; then
    echo "❌ it.system@albpetrol.al user not found"
    exit 1
fi

echo "Thanas ID: $THANAS_ID"
echo "System ID: $SYSTEM_ID"

# Transfer all data entries from thanas.dinaku to it.system
echo ""
echo "📦 Transferring data entries from thanas.dinaku to it.system..."
sudo -u postgres psql -d "$DB_NAME" -c "
UPDATE data_entries 
SET created_by_id = '$SYSTEM_ID'
WHERE created_by_id = '$THANAS_ID';
"

if [ $? -eq 0 ]; then
    echo "✅ Data entries transferred successfully!"
else
    echo "❌ Failed to transfer data entries"
    exit 1
fi

# Now delete the thanas.dinaku user
echo ""
echo "🗑️ Removing thanas.dinaku@albpetrol.al user..."
sudo -u postgres psql -d "$DB_NAME" -c "
DELETE FROM users 
WHERE email = 'thanas.dinaku@albpetrol.al';
"

if [ $? -eq 0 ]; then
    echo "✅ User removed successfully!"
else
    echo "❌ Failed to remove user"
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
echo ""
echo "🎯 System now has single root administrator with all entries!"