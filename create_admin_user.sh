#!/bin/bash

# Create default admin user script
# This will create the essential admin account for the system

set -e

echo "Creating default admin user..."

APP_DIR="/opt/ceshtje_ligjore/ceshtje_ligjore"
cd "$APP_DIR"

# Create admin user directly in database
sudo -u postgres psql -d ceshtje_ligjore << 'EOSQL'
-- Insert default admin user
INSERT INTO users (
    id, 
    email, 
    first_name, 
    last_name, 
    role, 
    is_default_admin, 
    created_at, 
    updated_at
) VALUES (
    'admin-' || generate_random_uuid()::text,
    'admin@albpetrol.al',
    'Administrator',
    'Albpetrol',
    'admin',
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Show created admin
SELECT email, role, is_default_admin FROM users WHERE email = 'admin@albpetrol.al';
EOSQL

echo "Default admin user created: admin@albpetrol.al"
echo "Use this email to login through the OIDC system"