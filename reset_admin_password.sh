#!/bin/bash

# Reset Administrator Password for it.system@albpetrol.al
# New password will be: Admin2025!

echo "Resetting administrator password..."

# Generate password hash using Node.js bcrypt
HASH=$(node -e "
const bcrypt = require('bcrypt');
const password = 'Admin2025!';
const saltRounds = 10;
bcrypt.hashSync(password, saltRounds, (err, hash) => {
  if (err) throw err;
  console.log(hash);
});
console.log(bcrypt.hashSync(password, saltRounds));
")

echo "Generated hash: $HASH"

# Update password in database
psql "$DATABASE_URL" << EOF
UPDATE users 
SET password = '$HASH'
WHERE email = 'it.system@albpetrol.al';

SELECT 'Password updated for: ' || email || ' (Admin: ' || is_default_admin || ')' as result
FROM users 
WHERE email = 'it.system@albpetrol.al';
EOF

echo ""
echo "✅ Administrator password reset successfully!"
echo ""
echo "Login credentials:"
echo "Email: it.system@albpetrol.al"
echo "Password: Admin2025!"
echo ""
echo "This is the default protected admin account."