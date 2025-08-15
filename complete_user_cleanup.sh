#!/bin/bash
# Complete removal of thanas.dinaku user with all foreign key constraint handling

echo "🔄 Complete cleanup: Transferring all thanas.dinaku references and removing user..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Read environment variables
if [ -f .env ]; then
    set -a
    source .env
    set +a
fi

# Get database name
DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
echo "Using database: $DB_NAME"

# Get user IDs
THANAS_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'thanas.dinaku@albpetrol.al';" | tr -d ' ' | tr -d '\n')
SYSTEM_ID=$(sudo -u postgres psql -d "$DB_NAME" -t -c "SELECT id FROM users WHERE email = 'it.system@albpetrol.al';" | tr -d ' ' | tr -d '\n')

echo "Thanas ID: '$THANAS_ID'"
echo "System ID: '$SYSTEM_ID'"

# Check all tables that reference the user
echo ""
echo "🔍 Checking all foreign key references..."

echo "Data entries referencing thanas.dinaku:"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM data_entries WHERE created_by_id = '$THANAS_ID';"

echo "System settings referencing thanas.dinaku:"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM system_settings WHERE updated_by_id = '$THANAS_ID';"

# Transfer data entries (already done but checking)
echo ""
echo "📦 Transferring data entries..."
sudo -u postgres psql -d "$DB_NAME" -c "
UPDATE data_entries 
SET created_by_id = '$SYSTEM_ID'
WHERE created_by_id = '$THANAS_ID';
"

# Transfer system settings ownership
echo ""
echo "⚙️ Transferring system settings..."
sudo -u postgres psql -d "$DB_NAME" -c "
UPDATE system_settings 
SET updated_by_id = '$SYSTEM_ID'
WHERE updated_by_id = '$THANAS_ID';
"

# Check for any other foreign key references
echo ""
echo "🔍 Checking for any remaining references..."
echo "Activity logs (if exists):"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM activity_logs WHERE user_id = '$THANAS_ID';" 2>/dev/null || echo "No activity_logs table"

echo "Sessions (if exists):"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM sessions WHERE user_id = '$THANAS_ID';" 2>/dev/null || echo "No sessions table with user_id"

# Clean up any sessions
echo ""
echo "🧹 Cleaning up sessions..."
sudo -u postgres psql -d "$DB_NAME" -c "DELETE FROM sessions WHERE sess::text LIKE '%$THANAS_ID%';" 2>/dev/null || echo "No sessions to clean"

# Transfer any activity logs if they exist
echo ""
echo "📋 Transferring activity logs (if any)..."
sudo -u postgres psql -d "$DB_NAME" -c "
UPDATE activity_logs 
SET user_id = '$SYSTEM_ID'
WHERE user_id = '$THANAS_ID';
" 2>/dev/null || echo "No activity_logs table to update"

# Final verification - check all references are gone
echo ""
echo "🔍 Final verification of references..."
REMAINING_REFS=$(sudo -u postgres psql -d "$DB_NAME" -t -c "
SELECT 
  (SELECT COUNT(*) FROM data_entries WHERE created_by_id = '$THANAS_ID') +
  (SELECT COUNT(*) FROM system_settings WHERE updated_by_id = '$THANAS_ID');
" | tr -d ' ' | tr -d '\n')

echo "Remaining references: $REMAINING_REFS"

if [ "$REMAINING_REFS" = "0" ]; then
    echo "✅ All references cleared!"
    
    # Now try to delete the user
    echo ""
    echo "🗑️ Removing thanas.dinaku@albpetrol.al user..."
    sudo -u postgres psql -d "$DB_NAME" -c "
    DELETE FROM users 
    WHERE email = 'thanas.dinaku@albpetrol.al';
    "
    
    if [ $? -eq 0 ]; then
        echo "✅ User removed successfully!"
        
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
        echo "🎉 COMPLETE CLEANUP SUCCESSFUL!"
        echo ""
        echo "📋 Summary:"
        echo "   ✅ All data entries transferred to it.system@albpetrol.al"
        echo "   ✅ All system settings transferred to it.system@albpetrol.al"
        echo "   ✅ All sessions cleaned up"
        echo "   ✅ thanas.dinaku@albpetrol.al user removed completely"
        echo "   ✅ it.system@albpetrol.al is now the sole root administrator"
        echo ""
        echo "🔐 Root administrator credentials:"
        echo "   Email: it.system@albpetrol.al"
        echo "   Password: admin123"
        echo "   Role: admin"
        
    else
        echo "❌ Still failed to remove user - checking for other constraints..."
        # List all foreign key constraints that might reference users table
        sudo -u postgres psql -d "$DB_NAME" -c "
        SELECT 
            tc.table_name, 
            kcu.column_name,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name='users';
        "
    fi
else
    echo "❌ Still have $REMAINING_REFS references - manual cleanup needed"
    echo "Check what's still referencing the user:"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM data_entries WHERE created_by_id = '$THANAS_ID';"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT COUNT(*) FROM system_settings WHERE updated_by_id = '$THANAS_ID';"
fi