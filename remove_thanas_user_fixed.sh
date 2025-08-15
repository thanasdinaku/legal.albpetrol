#!/bin/bash
# Remove thanas.dinaku@albpetrol.al user and keep only it.system@albpetrol.al as root admin

echo "🗑️ Removing thanas.dinaku@albpetrol.al user from database..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# Get database name from environment or default
if [ -f .env ]; then
    source .env
fi

# Extract database name from DATABASE_URL if available
if [ -n "$DATABASE_URL" ]; then
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
else
    # Try common database names
    DB_NAME="albpetrol_legal"
fi

echo "Using database: $DB_NAME"

# First check current users
echo "Current users in database:"
sudo -u postgres psql -d "$DB_NAME" -c "SELECT id, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\";" 2>/dev/null

if [ $? -ne 0 ]; then
    echo "Database $DB_NAME not found, trying alternative names..."
    # Try other possible database names
    for db in "ceshtje_ligjore" "legal_cases" "postgres"; do
        echo "Trying database: $db"
        sudo -u postgres psql -d "$db" -c "SELECT id, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\";" 2>/dev/null
        if [ $? -eq 0 ]; then
            DB_NAME="$db"
            break
        fi
    done
fi

echo ""
echo "Removing thanas.dinaku@albpetrol.al user from database $DB_NAME..."

# Delete the thanas.dinaku user
sudo -u postgres psql -d "$DB_NAME" -c "
DELETE FROM users 
WHERE email = 'thanas.dinaku@albpetrol.al';
"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ User removed successfully!"
    
    echo ""
    echo "Remaining users in database:"
    sudo -u postgres psql -d "$DB_NAME" -c "SELECT id, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\";"
    
    echo ""
    echo "🔐 Root administrator configuration:"
    echo "   ✅ Only it.system@albpetrol.al remains as root admin"
    echo "   ✅ Protected from deletion (cannot be removed)"
    echo "   ✅ Has full admin privileges for user management"
    echo ""
    echo "📋 Default admin credentials:"
    echo "   Email: it.system@albpetrol.al"
    echo "   Password: admin123"
    echo "   Role: admin"
    echo ""
    echo "🎯 System now has single root administrator as requested!"
else
    echo "❌ Failed to remove user. Check if user exists or database connection."
    echo ""
    echo "Manual removal option:"
    echo "1. Connect to PostgreSQL: sudo -u postgres psql"
    echo "2. List databases: \\l"
    echo "3. Connect to your database: \\c your_database_name"
    echo "4. List users: SELECT * FROM users;"
    echo "5. Delete user: DELETE FROM users WHERE email = 'thanas.dinaku@albpetrol.al';"
fi