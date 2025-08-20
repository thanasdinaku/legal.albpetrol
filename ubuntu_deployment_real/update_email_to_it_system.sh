#!/bin/bash

echo "🔧 Updating admin email to it.system@albpetrol.al in database..."

# Update admin user email in database
psql -d albpetrol_legal_db -U albpetrol_user << 'SQL_COMMANDS'
-- Update the admin user email
UPDATE users 
SET email = 'it.system@albpetrol.al'
WHERE role = 'admin' OR is_default_admin = true;

-- Verify the update
SELECT id, email, role, is_default_admin, "firstName", "lastName" 
FROM users 
WHERE role = 'admin' OR is_default_admin = true;
SQL_COMMANDS

echo ""
echo "✅ Admin email updated to it.system@albpetrol.al"
echo "🔄 Restart PM2 to ensure changes take effect:"
echo "   pm2 restart albpetrol-legal"
echo ""
echo "📧 Make sure to update SMTP settings in .env file:"
echo "   SMTP_USER=it.system@albpetrol.al"
echo "   EMAIL_FROM=it.system@albpetrol.al"