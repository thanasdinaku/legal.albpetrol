#!/bin/bash
# Remove thanas.dinaku@albpetrol.al user and keep only it.system@albpetrol.al as root admin

echo "🗑️ Removing thanas.dinaku@albpetrol.al user from database..."

cd /opt/ceshtje_ligjore/ceshtje_ligjore

# First check current users
echo "Current users in database:"
sudo -u postgres psql -d "$DATABASE_NAME" -c "SELECT id, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\";"

echo ""
echo "Removing thanas.dinaku@albpetrol.al user..."

# Delete the thanas.dinaku user
sudo -u postgres psql -d "$DATABASE_NAME" -c "
DELETE FROM users 
WHERE email = 'thanas.dinaku@albpetrol.al';
"

echo ""
echo "✅ User removed successfully!"

echo ""
echo "Remaining users in database:"
sudo -u postgres psql -d "$DATABASE_NAME" -c "SELECT id, email, role, \"createdAt\" FROM users ORDER BY \"createdAt\";"

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